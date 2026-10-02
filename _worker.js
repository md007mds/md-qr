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
