import { onRequestPost as createPayment } from "./functions/api/create-payment.js";
import { onRequestPost as pagbankWebhook } from "./functions/api/pagbank-webhook.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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

    return env.ASSETS.fetch(request);
  }
};
