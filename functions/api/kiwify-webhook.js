export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const email = body?.Customer?.email?.trim().toLowerCase();
    const orderStatus = body?.order_status;
    const eventType = body?.webhook_event_type;
    const orderId = body?.order_id || null;
    const productName =
      body?.Product?.product_name || "MD QR - Acesso Vitalício";
    const productId = body?.Product?.product_id;

    const MD_QR_PRODUCT_ID =
      "02cd7cd0-be6d-11f1-8b2e-5726e7cecf50";

    // Aceita somente eventos do produto MD QR
    if (productId !== MD_QR_PRODUCT_ID) {
      return new Response(
        JSON.stringify({
          success: true,
          ignored: true,
          reason: "Produto não autorizado."
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "E-mail do cliente não encontrado."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    let status;

    if (
      orderStatus === "paid" ||
      eventType === "order_approved"
    ) {
      status = "active";
    } else if (
      eventType === "order_refunded" ||
      eventType === "refund" ||
      eventType === "chargeback"
    ) {
      status = "inactive";
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          ignored: true,
          event: eventType,
          order_status: orderStatus
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase não configurado."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/kiwify_access?on_conflict=email`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({
          email,
          status,
          kiwify_transaction_id: orderId,
          product_name: productName,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Erro Supabase:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Erro ao atualizar acesso."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log("Kiwify acesso atualizado:", {
      email,
      status,
      orderId,
      eventType,
      productId
    });

    return new Response(
      JSON.stringify({
        success: true,
        email,
        status
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Erro no webhook Kiwify:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro ao processar webhook."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
