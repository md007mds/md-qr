(() => {
  const cfg = window.MDQR_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    cfg.SUPABASE_URL.startsWith("https://") &&
    !cfg.SUPABASE_URL.includes("COLE_AQUI") &&
    !cfg.SUPABASE_ANON_KEY.includes("COLE_AQUI");
  const $ = id => document.getElementById(id);
  const authSection = $("authSection"), appSection = $("appSection");
  let supabase = null, session = null, authMode = "login", currentCodes = [];

  function message(id, text, error=false) {
    const el = $(id); el.textContent = text; el.classList.toggle("error", error);
  }
  function notify(text) {
    const el = $("globalMessage"); el.textContent = text; el.classList.add("show");
    window.setTimeout(() => el.classList.remove("show"), 3500);
  }
  function showMode(mode) {
    authMode = mode;
    $("showLogin").classList.toggle("active", mode === "login");
    $("showSignup").classList.toggle("active", mode === "signup");
    $("authTitle").textContent = mode === "login" ? "Entre no MD QR" : "Crie sua conta";
    $("authSubmit").textContent = mode === "login" ? "Entrar" : "Criar conta";
    $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
    message("authMessage", "");
  }
  $("showLogin").addEventListener("click", () => showMode("login"));
  $("showSignup").addEventListener("click", () => showMode("signup"));

 async function setLoggedIn(user) {
  if (!user) {
    session = null;
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    $("logoutBtn").classList.add("hidden");
    $("qrList").innerHTML = '<div class="list-empty">Entre para ver seus QR Codes.</div>';
    currentCodes = [];
    return;
  }

  const { data: access, error } = await supabase
    .from("kiwify_access")
    .select("status")
    .eq("email", user.email)
    .maybeSingle();

  if (error || !access || access.status !== "active") {
    await supabase.auth.signOut();
    session = null;

    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    $("logoutBtn").classList.add("hidden");

    message(
      "authMessage",
      "Sua conta ainda não possui acesso ao MD QR. Aguarde a liberação da compra.",
      true
    );

    return;
  }

  session = { user };

  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
  $("userEmail").textContent = user.email || "Conta MD QR";

  loadCodes();
}
  $("authForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!supabase) return message("authMessage", "Configure primeiro o arquivo config.js e siga o README.", true);
    const email = $("email").value.trim(), password = $("password").value;
    $("authSubmit").disabled = true;
    message("authMessage", authMode === "login" ? "Entrando…" : "Criando conta…");
    try {
      const result = authMode === "login"
        ? await supabase.auth.signInWithPassword({email, password})
        : await supabase.auth.signUp({email, password});
      if (result.error) throw result.error;
      if (authMode === "signup" && !result.data.session) {
        message("authMessage", "Conta criada! Confira seu e-mail para confirmar o cadastro antes de entrar.");
      } else {
        message("authMessage", "Acesso confirmado.");
      }
    } catch (err) { message("authMessage", err.message || "Não foi possível autenticar.", true); }
    finally { $("authSubmit").disabled = false; }
  });
$("forgotPassword").addEventListener("click", async () => {
  const email = $("email").value.trim();

  if (!email) {
    message("authMessage", "Digite seu e-mail primeiro.", true);
    return;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://md-qr.pages.dev/app.html"
    });

    if (error) throw error;

    message("authMessage", "Se o e-mail estiver cadastrado, você receberá o link de recuperação.");
  } catch (err) {
    message("authMessage", err.message || "Não foi possível enviar o e-mail.", true);
  }
});
  $("logoutBtn").addEventListener("click", async () => {
    if (supabase) await supabase.auth.signOut();
  });

  function safeUrl(raw) {
    try { const u = new URL(raw); return ["http:", "https:"].includes(u.protocol) ? u.href : null; }
    catch { return null; }
  }

  function showPreview(value, filename="md-qr.png") {
    const target = $("qrPreview");
    target.innerHTML = "";
    const holder = document.createElement("div"); target.appendChild(holder);
    try {
      new QRCode(holder, {text:value, width:220, height:220, colorDark:"#101820", colorLight:"#ffffff", correctLevel:QRCode.CorrectLevel.H});
      $("downloadBtn").classList.remove("disabled");
      $("downloadBtn").onclick = event => {
        event.preventDefault();
        const canvas = holder.querySelector("canvas");
        const img = holder.querySelector("img");
        const data = canvas ? canvas.toDataURL("image/png") : img?.src;
        if (!data) return notify("Não foi possível gerar a imagem.");
        const a = document.createElement("a"); a.href = data; a.download = filename; a.click();
      };
      $("previewUrl").textContent = value;
    } catch { target.innerHTML = '<p>Não foi possível gerar a prévia.</p>'; }
  }

  $("createForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!session || !supabase) return message("createMessage", "Entre na sua conta para salvar códigos.", true);
    const title = $("qrTitle").value.trim(), destination_url = safeUrl($("qrUrl").value.trim()), type = $("qrType").value;
    if (!destination_url) return message("createMessage", "Digite um link válido começando com http:// ou https://.", true);
    const btn = e.submitter; if (btn) btn.disabled = true;
    message("createMessage", "Salvando código…");
    try {
      const {data, error} = await supabase.from("qr_codes").insert({
        user_id: session.user.id, title, destination_url, type
      }).select().single();
      if (error) throw error;
      const qrValue = type === "dynamic" ? `${location.origin}/r/${data.id}` : destination_url;
      showPreview(qrValue, `${title.replace(/[^a-z0-9-_]/gi,"-") || "md-qr"}.png`);
      message("createMessage", "QR Code criado com sucesso.");
      $("createForm").reset();
      await loadCodes();
    } catch (err) { message("createMessage", err.message || "Erro ao salvar código.", true); }
    finally { if (btn) btn.disabled = false; }
  });


async function loadCodes() {
  if (!session || !supabase) return;

  $("qrList").innerHTML =
    '<div class="list-empty">Carregando seus códigos...</div>';

  const pageSize = 1000;
  let allCodes = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      $("qrList").innerHTML =
        '<div class="list-empty">Não foi possível carregar. Confira a conexão e as políticas RLS.</div>';
      return;
    }

    const page = data || [];
    allCodes.push(...page);

    if (page.length < pageSize) break;

    from += pageSize;
  }

  currentCodes = allCodes;
  renderCodes();
}
  function renderCodes() {
    const list = $("qrList"); list.innerHTML = "";
    if (!currentCodes.length) {
      list.innerHTML = '<div class="list-empty">Você ainda não criou códigos. Use o formulário acima para começar.</div>'; return;
    }
    currentCodes.forEach(code => {
      const row = document.createElement("article"); row.className = "qr-item";
      const icon = document.createElement("div"); icon.className = "qr-mini"; icon.textContent = "▦";
      const meta = document.createElement("div"); meta.className = "qr-meta";
      const title = document.createElement("strong"); title.textContent = code.title;
      const url = document.createElement("small"); url.textContent = code.destination_url; url.title = code.destination_url;
      const badge = document.createElement("span"); badge.className = "type-badge"; badge.textContent = code.type === "dynamic" ? "Dinâmico" : "Estático";
      meta.append(title, url, badge);
      const actions = document.createElement("div"); actions.className = "item-actions";
      const preview = document.createElement("button"); preview.textContent = "Ver / baixar";
      preview.addEventListener("click", () => {
        const value = code.type === "dynamic" ? `${location.origin}/r/${code.id}` : code.destination_url;
        showPreview(value, `${code.title.replace(/[^a-z0-9-_]/gi,"-") || "md-qr"}.png`);
        window.scrollTo({top:$("qrPreview").getBoundingClientRect().top + window.scrollY - 100, behavior:"smooth"});
      });
      actions.append(preview);
      if (code.type === "dynamic") {
        const edit = document.createElement("button"); edit.textContent = "Editar destino";
        edit.addEventListener("click", async () => {
          const next = prompt("Novo link de destino:", code.destination_url);
          if (next === null) return;
          const valid = safeUrl(next.trim());
          if (!valid) return notify("Informe um link válido com http:// ou https://.");
          const {error} = await supabase.from("qr_codes").update({destination_url:valid}).eq("id",code.id);
          if (error) return notify("Erro ao atualizar: " + error.message);
          notify("Destino atualizado. O QR Code continua o mesmo."); await loadCodes();
        });
        actions.append(edit);
      }
      const del = document.createElement("button"); del.className = "delete"; del.textContent = "Excluir";
      del.addEventListener("click", async () => {
        if (!confirm(`Excluir "${code.title}"? Esta ação não pode ser desfeita.`)) return;
        const {error} = await supabase.from("qr_codes").delete().eq("id",code.id);
        if (error) return notify("Erro ao excluir: " + error.message);
        notify("QR Code excluído."); await loadCodes();
      });
      actions.append(del); row.append(icon,meta,actions); list.append(row);
    });
  }
  $("refreshBtn").addEventListener("click", loadCodes);

  if (!configured || !window.supabase) {
    setLoggedIn(null);
    message("authMessage", "Para ativar o site, configure a URL e a chave pública do Supabase em config.js. Veja o README.", true);
    $("authSubmit").disabled = true;
  } else {
    supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    supabase.auth.getSession().then(({data}) => setLoggedIn(data.session?.user || null));
    supabase.auth.onAuthStateChange((event, newSession) => {
  setLoggedIn(newSession?.user || null);

  if (event === "PASSWORD_RECOVERY") {
    setTimeout(async () => {
      const novaSenha = prompt("Digite sua nova senha (mínimo 6 caracteres):");

      if (!novaSenha || novaSenha.length < 6) {
        alert("A senha precisa ter pelo menos 6 caracteres.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        alert("Erro ao alterar senha: " + error.message);
      } else {
        alert("Senha alterada com sucesso! Entre com sua nova senha.");
      }
    }, 500);
  }
});
  }
})();
