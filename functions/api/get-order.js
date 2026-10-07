export async function onRequestGet(context) {
  const { request, env } = context;

  const token = env.PAGBANK_TOKEN;

  if (!token) {
    return new Response("PagBank não configurado.", {
      status: 500
    });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");

  if (!orderId) {
    return new Response(
      JSON.stringify({
        error: "order_id não informado."
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const response = await fetch(
      `https://sandbox.api.pagseguro.com/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const charge = data.charges?.[0];

    return new Response(
      JSON.stringify({
        order_id: data.id,
        charge_id: charge?.id,
        status: charge?.status
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
        error: "Erro ao consultar pedido."
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
