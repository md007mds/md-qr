import { onRequestGet as getOrder } from "./functions/api/get-order.js";
import { onRequestPost as createPayment } from "./functions/api/create-payment.js";
import { onRequestPost as pagbankWebhook } from "./pagbank-webhook.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
        if (url.pathname.startsWith("/r/")) {
      if (request.method !== "GET") {
        return new Response("Método não permitido.", {
          status: 405
        });
      }

      const qrId = url.pathname.split("/")[2];

      if (!qrId) {
        return new Response("QR Code não informado.", {
          status: 400
        });
      }
             const supabaseUrl = env.SUPABASE_URL;
      const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;   
      if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase não configurado.", {
          status: 500
        });
      }
                const response = await fetch(
        `${supabaseUrl}/rest/v1/qr_codes?id=eq.${encodeURIComponent(qrId)}&select=destination_url&limit=1`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Accept": "application/json"
          }
        }
      );
                if (!response.ok) {
        return new Response("Erro ao consultar QR Code.", {
          status: 500
        });
      }

      const rows = await response.json();

      if (!rows.length || !rows[0].destination_url) {
        return new Response("QR Code não encontrado.", {
          status: 404
        });
      }

      return Response.redirect(rows[0].destination_url, 302);
    }
    if (url.pathname === "/api/create-payment") {
      if (request.method !== "POST") {
        return new Response("Método não permitido.", {
          status: 405
        });
      }

      return createPayment({
        request,
        env,
        ctx
      });
    }

    if (url.pathname === "/api/pagbank-webhook") {
      if (request.method !== "POST") {
        return new Response("Método não permitido.", {
          status: 405
        });
      }

      return pagbankWebhook({
        request,
        env,
        ctx
      });
    }
if (url.pathname === "/api/get-order") {
  if (request.method !== "GET") {
    return new Response("Método não permitido.", {
      status: 405
    });
  }

  return getOrder({
    request,
    env,
    ctx
  });
}
    return env.ASSETS.fetch(request);
  }
};
