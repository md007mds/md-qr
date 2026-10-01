export async function onRequest(context) {
  const { env, params } = context;
  const id = params.id;
  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!base || !key || !/^[0-9a-f-]{36}$/i.test(id || "")) {
    return new Response("QR Code indisponível.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  try {
    const endpoint =
      `${base.replace(/\/$/, "")}/rest/v1/qr_codes?id=eq.${encodeURIComponent(id)}&select=destination_url,type&limit=1`;

    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    if (!response.ok) {
      return new Response("QR Code indisponível.", { status: 404 });
    }

    const rows = await response.json();
    const item = rows?.[0];

    if (!item || item.type !== "dynamic") {
      return new Response("QR Code não encontrado.", { status: 404 });
    }

    let destination;

    try {
      destination = new URL(item.destination_url);
    } catch {
      return new Response("Destino inválido.", { status: 400 });
    }

    if (!["http:", "https:"].includes(destination.protocol)) {
      return new Response("Destino inválido.", { status: 400 });
    }

    return Response.redirect(destination.href, 302);
  } catch {
    return new Response("Erro temporário ao abrir o QR Code.", {
      status: 503
    });
  }
}
