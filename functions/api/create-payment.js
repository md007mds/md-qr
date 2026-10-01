export async function onRequestPost(context) {
  const { env } = context;

  const token = env.PAGBANK_TOKEN;

  if (!token) {
    return new Response("PagBank não configurado.", {
      status: 500
    });
  }

  try {
    const response = await fetch("https://sandbox.api.pagseguro.com/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reference_id: `MDQR-${Date.now()}`,

       customer: {
  name: "Cliente MD QR",
  email: "cliente@mdqr.com",
tax_id: "79630442027"

        items: [
          {
            reference_id: "mdqr-acesso-vitalicio",
            name: "MD QR - Acesso Vitalício",
            quantity: 1,
            unit_amount: 2990
          }
        ],

        charges: [
          {
            reference_id: `MDQR-PIX-${Date.now()}`,
            description: "MD QR - Acesso Vitalício",

            amount: {
              value: 2990,
              currency: "BRL"
            },

            payment_method: {
              type: "PIX",

              pix: {
                expiration_date: new Date(
                  Date.now() + 30 * 60 * 1000
                ).toISOString()
              }
            }
          }
        ],

        notification_urls: [
        "https://md-qr.mdcombos74.workers.dev/api/pagbank-webhook"
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify(data),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const charge = data.charges?.[0];

    return new Response(
      JSON.stringify({
        order_id: data.id,
        charge_id: charge?.id,
        status: charge?.status,
        pix_code: charge?.qr_code?.text,
        qr_code: charge?.links?.find(
          link => link.rel === "QRCODE.PNG"
        )?.href
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Erro ao criar pagamento."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
// Redeploy após configurar PAGBANK_TOKEN
