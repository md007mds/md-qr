export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.text();

    console.log("KIWIFY WEBHOOK RECEBIDO:");
    console.log(body);

    return new Response(
      JSON.stringify({
        success: true,
        received: true
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
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
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}

