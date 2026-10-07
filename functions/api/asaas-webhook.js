export async function onRequestPost(context) {
  const { request, env } = context;

  const webhookToken = env.ASAAS_WEBHOOK_TOKEN;
  const asaasApiKey = env.ASAAS_API_KEY;
  const paymentLinkId = env.ASAAS_PAYMENT_LINK_ID;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookToken || !asaasApiKey || !paymentLinkId || !supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Asaas webhook: variáveis de ambiente ausentes.");
    return new Response("Webhook não configurado.", { status: 500 });
  }

  const receivedToken = request.headers.get("asaas-access-token");

  if (!receivedToken || receivedToken !== webhookToken) {
    return new Response("Não autorizado.", { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.event !== "PAYMENT_RECEIVED") {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const payment = body.payment;

    if (!payment?.id) {
      return new Response("Pagamento não informado.", { status: 400 });
    }

    // Confirma o pagamento diretamente na API do Asaas.
    const paymentResponse = await fetch(
      `https://api.asaas.com/v3/payments/${encodeURIComponent(payment.id)}`,
      {
        method: "GET",
        headers: {
          "accept": "application/json",
          "access_token": asaasApiKey,
          "User-Agent": "MD-QR/1.0"
        }
      }
    );

    if (!paymentResponse.ok) {
      console.error("Asaas API recusou a consulta do pagamento:", paymentResponse.status);
      return new Response("Não foi possível validar o pagamento.", { status: 502 });
    }

    const confirmedPayment = await paymentResponse.json();

    // Segurança: o acesso só é liberado para o Link de Pagamento do MD QR,
    // no valor de R$ 29,90 e com Pix recebido.
    if (
      confirmedPayment.status !== "RECEIVED" ||
      confirmedPayment.billingType !== "PIX" ||
      Number(confirmedPayment.value) !== 29.90 ||
      confirmedPayment.paymentLink !== paymentLinkId
    ) {
      console.warn("Pagamento recebido não corresponde ao MD QR.", {
        paymentId: confirmedPayment.id,
        status: confirmedPayment.status,
        billingType: confirmedPayment.billingType,
        value: confirmedPayment.value,
        paymentLink: confirmedPayment.paymentLink
      });

      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!confirmedPayment.customer) {
      return new Response("Cliente do pagamento não encontrado.", { status: 422 });
    }

    // Busca o cliente para obter o e-mail usado na compra.
    const customerResponse = await fetch(
      `https://api.asaas.com/v3/customers/${encodeURIComponent(confirmedPayment.customer)}`,
      {
        method: "GET",
        headers: {
          "accept": "application/json",
          "access_token": asaasApiKey,
          "User-Agent": "MD-QR/1.0"
        }
      }
    );

    if (!customerResponse.ok) {
      console.error("Não foi possível consultar o cliente Asaas:", customerResponse.status);
      return new Response("Não foi possível validar o cliente.", { status: 502 });
    }

    const customer = await customerResponse.json();
    const email = String(customer.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return new Response("E-mail do cliente não encontrado.", { status: 422 });
    }

    // A tabela kiwify_access já é usada pelo painel do MD QR.
    // Mantemos a mesma estrutura: email + status.
    const findResponse = await fetch(
      `${supabaseUrl}/rest/v1/kiwify_access?select=email,status&email=eq.${encodeURIComponent(email)}&limit=1`,
      {
        method: "GET",
        headers: {
          "apikey": supabaseServiceRoleKey,
          "Authorization": `Bearer ${supabaseServiceRoleKey}`,
          "Accept": "application/json"
        }
      }
    );

    if (!findResponse.ok) {
      console.error("Erro ao consultar acesso no Supabase:", findResponse.status);
      return new Response("Erro ao consultar acesso.", { status: 502 });
    }

    const existing = await findResponse.json();

    if (existing.length > 0) {
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/kiwify_access?email=eq.${encodeURIComponent(email)}`,
        {
          method: "PATCH",
          headers: {
            "apikey": supabaseServiceRoleKey,
            "Authorization": `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({ status: "active" })
        }
      );

      if (!updateResponse.ok) {
        console.error("Erro ao ativar acesso existente:", updateResponse.status);
        return new Response("Erro ao ativar acesso.", { status: 502 });
      }
    } else {
      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/kiwify_access`,
        {
          method: "POST",
          headers: {
            "apikey": supabaseServiceRoleKey,
            "Authorization": `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            email,
            status: "active"
          })
        }
      );

      if (!insertResponse.ok) {
        console.error("Erro ao criar acesso:", insertResponse.status);
        return new Response("Erro ao criar acesso.", { status: 502 });
      }
    }

    console.log("MD QR: acesso liberado.", {
      eventId: body.id,
      paymentId: confirmedPayment.id
    });

    return new Response(JSON.stringify({
      received: true,
      access: "active"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro no webhook Asaas:", error);
    return new Response("Erro interno.", { status: 500 });
  }
}
