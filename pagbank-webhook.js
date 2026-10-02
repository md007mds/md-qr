export async function onRequestPost(context) {
  const { env, request } = context;

  const token = env.PAGBANK_TOKEN;

  if (!token) {
    return new Response("PagBank não configurado.", {
      status: 500
    });
  }

  try {
    // 1. Captura o corpo ORIGINAL da requisição
    const rawBody = await request.text();

    // 2. Captura todas as assinaturas recebidas
    const signatureHeader = request.headers.get("x-payload-signature");

    if (!signatureHeader) {
      return new Response("Assinatura ausente.", {
        status: 401
      });
    }

    const signatures = signatureHeader
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);

    // 3. Consulta a chave pública do PagBank
    const keyResponse = await fetch(
      "https://sandbox.api.pagseguro.com/public-keys/webhook",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      }
    );

    if (!keyResponse.ok) {
      return new Response("Não foi possível obter a chave pública.", {
        status: 502
      });
    }

    const keyData = await keyResponse.json();

    if (!keyData.public_key) {
      return new Response("Chave pública inválida.", {
        status: 502
      });
    }

    // 4. Converte a chave pública Base64 para ArrayBuffer
    const publicKeyBytes = Uint8Array.from(
      atob(keyData.public_key),
      char => char.charCodeAt(0)
    );

    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBytes.buffer,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["verify"]
    );

    // 5. Converte o corpo original para bytes
    const payloadBytes = new TextEncoder().encode(rawBody);

    // 6. Verifica todas as assinaturas
    let validSignature = false;

    for (const signatureBase64 of signatures) {
      try {
        const signatureDer = Uint8Array.from(
          atob(signatureBase64),
          char => char.charCodeAt(0)
        );

        const signatureRaw = derToRawEcdsa(signatureDer);

        const valid = await crypto.subtle.verify(
          {
            name: "ECDSA",
            hash: "SHA-256"
          },
          publicKey,
          signatureRaw,
          payloadBytes
        );

        if (valid) {
          validSignature = true;
          break;
        }
      } catch {
        // Testa a próxima assinatura
      }
    }

    // 7. Rejeita se nenhuma assinatura for válida
    if (!validSignature) {
      return new Response("Assinatura inválida.", {
        status: 401
      });
    }

    // 8. Somente agora o JSON pode ser interpretado
    const event = JSON.parse(rawBody);

    const orderId = event.id;
    const charge = event.charges?.[0];
    const status = charge?.status;

    console.log("Webhook PagBank recebido:", {
      orderId,
      chargeId: charge?.id,
      status
    });

    // Por enquanto apenas confirmamos o recebimento.
    // A atualização do Supabase será adicionada depois.

    return new Response(null, {
      status: 204
    });

  } catch (error) {
    console.error("Erro no webhook PagBank:", error);

    return new Response("Erro interno.", {
      status: 500
    });
  }
}


// Converte assinatura ECDSA DER para o formato
// r || s exigido pelo Web Crypto API.
function derToRawEcdsa(der) {
  if (der[0] !== 0x30) {
    throw new Error("Assinatura DER inválida.");
  }

  let offset = 2;

  if (der[1] & 0x80) {
    const lengthBytes = der[1] & 0x7f;
    offset = 2 + lengthBytes;
  }

  if (der[offset] !== 0x02) {
    throw new Error("Componente r inválido.");
  }

  const rLength = der[offset + 1];
  const rStart = offset + 2;
  const rEnd = rStart + rLength;

  const r = der.slice(rStart, rEnd);

  offset = rEnd;

  if (der[offset] !== 0x02) {
    throw new Error("Componente s inválido.");
  }

  const sLength = der[offset + 1];
  const sStart = offset + 2;
  const sEnd = sStart + sLength;

  const s = der.slice(sStart, sEnd);

  const rNormalized = normalizeEcdsaComponent(r);
  const sNormalized = normalizeEcdsaComponent(s);

  const result = new Uint8Array(64);

  result.set(rNormalized, 0);
  result.set(sNormalized, 32);

  return result;
}


function normalizeEcdsaComponent(component) {
  let value = component;

  while (value.length > 32 && value[0] === 0) {
    value = value.slice(1);
  }

  if (value.length > 32) {
    throw new Error("Componente ECDSA muito grande.");
  }

  const result = new Uint8Array(32);

  result.set(value, 32 - value.length);

  return result;
}
