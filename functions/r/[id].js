/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
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
  }// Configure este arquivo com os dados públicos do seu projeto Supabase.
// A chave anon/publishable pode ser usada no navegador; NUNCA coloque a service_role aqui.
window.MDQR_CONFIG = {
  SUPABASE_URL: "COLE_AQUI_A_URL_DO_SEU_PROJETO",
  SUPABASE_ANON_KEY: "COLE_AQUI_SUA_CHAVE_ANON_OU_PUBLISHABLE"
};

<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101820">
  <title>MD QR — Gerador de QR Code</title>
  <meta name="description" content="Crie QR Codes estáticos e dinâmicos com o MD QR.">
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="#"><span class="brand-icon">▦</span><span>MD <b>QR</b></span></a>
    <span class="tagline">Crie. Personalize. Acompanhe.</span>
    <button id="logoutBtn" class="btn btn-quiet hidden">Sair</button>
  </header>

  <main class="wrap">
    <section class="hero">
      <div>
        <p class="eyebrow">GERADOR DE QR CODE</p>
        <h1>Seus links.<br><span>Em um só código.</span></h1>
        <p class="hero-copy">Crie QR Codes estáticos ou dinâmicos e gerencie tudo em um painel simples.</p>
        <div class="hero-pills"><span>✓ Estáticos</span><span>✓ Dinâmicos editáveis</span><span>✓ Download PNG</span></div>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="qr-art"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span>MD QR</span></div>
    </section>

    <section id="authSection" class="panel auth-panel">
      <div class="panel-heading">
        <div><p class="eyebrow">SUA CONTA</p><h2 id="authTitle">Entre no MD QR</h2></div>
        <div class="switcher"><button id="showLogin" class="active">Entrar</button><button id="showSignup">Criar conta</button></div>
      </div>
      <form id="authForm">
        <label for="email">E-mail</label>
        <input id="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" required>
        <label for="password">Senha</label>
        <input id="password" type="password" autocomplete="current-password" minlength="6" placeholder="Mínimo de 6 caracteres" required>
        <button id="authSubmit" class="btn btn-primary full" type="submit">Entrar</button>
        <p id="authMessage" class="message" role="status"></p>
      </form>
      <p class="fine-print">Sua conta é gerenciada pelo Supabase. Nunca compartilhe sua senha.</p>
    </section>

    <section id="appSection" class="hidden">
      <div class="welcome-row"><div><p class="eyebrow">PAINEL PESSOAL</p><h2>Seus QR Codes</h2><p class="muted">Crie e gerencie os seus links.</p></div><span id="userEmail" class="user-chip"></span></div>
      <div class="dashboard-grid">
        <section class="panel create-panel">
          <div class="panel-heading"><div><p class="eyebrow">NOVO CÓDIGO</p><h3>Criar QR Code</h3></div><span class="icon-bubble">＋</span></div>
          <form id="createForm">
            <label for="qrTitle">Nome do código</label>
            <input id="qrTitle" maxlength="80" placeholder="Ex.: Instagram da loja" required>
            <label for="qrType">Tipo de QR Code</label>
            <select id="qrType"><option value="dynamic">Dinâmico — posso trocar o link depois</option><option value="static">Estático — link fixo</option></select>
            <label for="qrUrl">Link de destino</label>
            <input id="qrUrl" type="url" placeholder="https://exemplo.com" required>
            <p class="hint">Use o endereço completo, começando com https://</p>
            <button class="btn btn-primary full" type="submit">Criar QR Code <span>→</span></button>
            <p id="createMessage" class="message" role="status"></p>
          </form>
        </section>
        <section class="panel preview-panel">
          <p class="eyebrow">PRÉVIA</p><h3>Seu código aparece aqui</h3>
          <div id="qrPreview" class="qr-preview"><div class="empty-qr">▦</div><p>Crie um código para visualizar e baixar.</p></div>
          <a id="downloadBtn" class="btn btn-secondary full disabled" href="#" download="md-qr.png">Baixar PNG</a>
          <p id="previewUrl" class="preview-url"></p>
        </section>
      </div>
      <section class="panel list-panel">
        <div class="panel-heading"><div><p class="eyebrow">BIBLIOTECA</p><h3>Seus códigos salvos</h3></div><button id="refreshBtn" class="btn btn-secondary">Atualizar ↻</button></div>
        <div id="qrList" class="qr-list"><div class="list-empty">Carregando seus códigos…</div></div>
      </section>
    </section>

    <section class="feature-row">
      <article><span class="feature-icon">↗</span><h3>Dinâmico</h3><p>Altere o destino de um QR Code sem precisar imprimir outro.</p></article>
      <article><span class="feature-icon">▦</span><h3>Estático</h3><p>Ideal para links fixos e compartilhamento simples.</p></article>
      <article><span class="feature-icon">⌂</span><h3>Seu painel</h3><p>Seus códigos ficam associados à sua conta.</p></article>
    </section>
    <div id="globalMessage" class="global-message" role="status"></div>
  </main>
  <footer><span class="brand small-brand">MD <b>QR</b></span><span>Feito para simplificar o compartilhamento.</span><span>Os recursos gratuitos dependem dos limites dos provedores.</span></footer>
  <script src="config.js"></script>
  <script src="app.js"></script>
</body>
</html>

# MD QR — gerador de QR Codes estáticos e dinâmicos

Aplicação web em português com cadastro/login via Supabase, painel pessoal, criação de QR Codes estáticos e dinâmicos, edição do destino de QR dinâmico, exclusão e download PNG. A função Cloudflare Pages `functions/r/[id].js` realiza o redirecionamento dinâmico.

## Arquitetura

- **Frontend:** HTML, CSS e JavaScript; hospedagem no Cloudflare Pages.
- **Autenticação e banco:** Supabase (plano gratuito, sujeito aos limites e políticas atuais).
- **QR Code:** biblioteca QRCode.js carregada por CDN.
- **Redirecionamento dinâmico:** Cloudflare Pages Function em `/r/:id`.
- **Banco:** `qr_codes`, com políticas RLS para que cada usuário veja e altere apenas os próprios códigos.

## Antes de publicar

### 1. Criar o projeto Supabase
1. Crie um projeto em https://supabase.com/.
2. No SQL Editor, execute todo o conteúdo de `supabase.sql`.
3. Abra as configurações de API do projeto e copie a Project URL e a chave pública `anon`/`publishable`.
4. Abra `config.js` e substitua `COLE_AQUI_A_URL_DO_SEU_PROJETO` e `COLE_AQUI_SUA_CHAVE_ANON_OU_PUBLISHABLE` pelos valores reais.
5. Em Authentication → URL Configuration, configure o Site URL e os Redirect URLs para o domínio que será usado no Cloudflare Pages. Durante testes, adicione também a URL local ou de pré-visualização necessária.
6. Ajuste o e-mail de confirmação conforme sua preferência de segurança. Em produção, é recomendável manter a confirmação de e-mail ativa e configurar um provedor SMTP confiável.

### 2. Publicar no Cloudflare Pages
1. Crie uma conta em https://dash.cloudflare.com/ e um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. No Cloudflare, acesse Workers & Pages → Create → Pages → Connect to Git.
4. Selecione o repositório. Como é um site HTML simples, deixe o comando de build vazio e defina o diretório de saída como `/` (raiz do projeto, conforme as opções disponíveis no painel).
5. Em Settings → Variables and Secrets (ou configuração equivalente do projeto), adicione estas variáveis para Functions:
   - `SUPABASE_URL`: Project URL do Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave `service_role`/secret do Supabase. Marque como segredo. **Nunca** a coloque no frontend, GitHub, `config.js` ou em qualquer arquivo público.
6. Faça o deploy. A pasta `functions/` deve ser enviada junto com o restante do projeto para ativar o redirecionamento `/r/:id`.
7. No Supabase, inclua o domínio final do Pages na configuração de URLs de autenticação.

### 3. Testar antes de divulgar
1. Abra o site publicado, crie uma conta e confirme o e-mail se solicitado.
2. Entre e crie um QR Code dinâmico com um link que você controla.
3. Baixe a imagem PNG e escaneie com o celular.
4. No painel, use “Editar destino” e escaneie o mesmo QR Code novamente: ele deve abrir o novo destino.
5. Crie um código estático e confirme que ele aponta diretamente ao link original.
6. Teste o logout, login novamente e a exclusão de um código.

## Como funcionam os tipos

- **Estático:** o QR Code contém diretamente o endereço de destino. Depois de impresso, esse endereço não pode ser alterado.
- **Dinâmico:** o QR Code contém `https://SEU-DOMINIO/r/UUID`. A função consulta o banco e redireciona para o destino atual. Alterar o destino não muda a imagem do QR Code.
- **Sem expiração programada:** este projeto não define uma data de expiração automática. Ainda assim, a disponibilidade depende da hospedagem, do banco, do domínio, das cotas e dos termos dos provedores. Não existe garantia de serviço gratuito ou disponibilidade “para sempre”.

## Limitações e próximos passos

Esta é uma primeira versão funcional, não um serviço SaaS pronto para escalar. Antes de oferecer publicamente:
- Configure SMTP, recuperação de senha e política de privacidade/termos.
- Adicione proteção contra abuso, rate limits, limites de criação e validação de URLs.
- Não exponha a chave service role.
- Implemente planos pagos com verificação de assinatura no servidor (por exemplo, Stripe/Mercado Pago) antes de aplicar limites premium.
- Adicione métricas de leitura se forem necessárias; esta versão não registra estatísticas.
- Consi<!doctype html># MD QR — gerador de QR Codes estáticos e dinâmicos

Aplicação web em português com cadastro/login via Supabase, painel pessoal, criação de QR Codes estáticos e dinâmicos, edição do destino de QR dinâmico, exclusão e download PNG. A função Cloudflare Pages `functions/r/[id].js` realiza o redirecionamento dinâmico.

## Arquitetura

- **Frontend:** HTML, CSS e JavaScript; hospedagem no Cloudflare Pages.
- **Autenticação e banco:** Supabase (plano gratuito, sujeito aos limites e políticas atuais).
- **QR Code:** biblioteca QRCode.js carregada por CDN.
- **Redirecionamento dinâmico:** Cloudflare Pages Function em `/r/:id`.
- **Banco:** `qr_codes`, com políticas RLS para que cada usuário veja e altere apenas os próprios códigos.

## Antes de publicar

### 1. Criar o projeto Supabase
1. Crie um projeto em https://supabase.com/.
2. No SQL Editor, execute todo o conteúdo de `supabase.sql`.
3. Abra as configurações de API do projeto e copie a Project URL e a chave pública `anon`/`publishable`.
4. Abra `config.js` e substitua `COLE_AQUI_A_URL_DO_SEU_PROJETO` e `COLE_AQUI_SUA_CHAVE_ANON_OU_PUBLISHABLE` pelos valores reais.
5. Em Authentication → URL Configuration, configure o Site URL e os Redirect URLs para o domínio que será usado no Cloudflare Pages. Durante testes, adicione também a URL local ou de pré-visualização necessária.
6. Ajuste o e-mail de confirmação conforme sua preferência de segurança. Em produção, é recomendável manter a confirmação de e-mail ativa e configurar um provedor SMTP confiável.

### 2. Publicar no Cloudflare Pages
1. Crie uma conta em https://dash.cloudflare.com/ e um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. No Cloudflare, acesse Workers & Pages → Create → Pages → Connect to Git.
4. Selecione o repositório. Como é um site HTML simples, deixe o comando de build vazio e defina o diretório de saída como `/` (raiz do projeto, conforme as opções disponíveis no painel).
5. Em Settings → Variables and Secrets (ou configuração equivalente do projeto), adicione estas variáveis para Functions:
   - `SUPABASE_URL`: Project URL do Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave `service_role`/secret do Supabase. Marque como segredo. **Nunca** a coloque no frontend, GitHub, `config.js` ou em qualquer arquivo público.
6. Faça o deploy. A pasta `functions/` deve ser enviada junto com o restante do projeto para ativar o redirecionamento `/r/:id`.
7. No Supabase, inclua o domínio final do Pages na configuração de URLs de autenticação.

### 3. Testar antes de divulgar
1. Abra o site publicado, crie uma conta e confirme o e-mail se solicitado.
2. Entre e crie um QR Code dinâmico com um link que você controla.
3. Baixe a imagem PNG e escaneie com o celular.
4. No painel, use “Editar destino” e escaneie o mesmo QR Code novamente: ele deve abrir o novo destino.
5. Crie um código estático e confirme que ele aponta diretamente ao link original.
6. Teste o logout, login novamente e a exclusão de um código.

## Como funcionam os tipos

- **Estático:** o QR Code contém diretamente o endereço de destino. Depois de impresso, esse endereço não pode ser alterado.
- **Dinâmico:** o QR Code contém `https://SEU-DOMINIO/r/UUID`. A função consulta o banco e redireciona para o destino atual. Alterar o destino não muda a imagem do QR Code.
- **Sem expiração programada:** este projeto não define uma data de expiração automática. Ainda assim, a disponibilidade depende da hospedagem, do banco, do domínio, das cotas e dos termos dos provedores. Não existe garantia de serviço gratuito ou disponibilidade “para sempre”.

## Limitações e próximos passos

Esta é uma primeira versão funcional, não um serviço SaaS pronto para escalar. Antes de oferecer publicamente:
- Configure SMTP, recuperação de senha e política de privacidade/termos.
- Adicione proteção contra abuso, rate limits, limites de criação e validação de URLs.
- Não exponha a chave service role.
- Implemente planos pagos com verificação de assinatura no servidor (por exemplo, Stripe/Mercado Pago) antes de aplicar limites premium.
- Adicione métricas de leitura se forem necessárias; esta versão não registra estatísticas.
- Considere domínio próprio, monitoramento, backups e um procedimento para indisponibilidade.

## Arquivos
- `index.html`, `styles.css`, `app.js`: interface e painel.
- `config.js`: configuração pública do Supabase.
- `supabase.sql`: tabela e políticas RLS.
- `functions/r/[id].js`: redirecionamento dos QR Codes dinâmicos.
- `_headers`: cabeçalhos de segurança básicos.

## Aviso de segurança
A chave pública Supabase é destinada ao navegador e depende das políticas RLS. A chave `service_role` ignora RLS e deve existir somente como segredo no ambiente servidor da Cloudflare Function. Nunca publique essa chave.

// Configure este arquivo com os dados públicos do seu projeto Supabase.
// A chave anon/publishable pode ser usada no navegador; NUNCA coloque a service_role aqui.
window.MDQR_CONFIG = {
  SUPABASE_URL: "COLE_AQUI_A_URL_DO_SEU_PROJETO",
  SUPABASE_ANON_KEY: "COLE_AQUI_SUA_CHAVE_ANON_OU_PUBLISHABLE"
};

<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101820">
  <title>MD QR — Gerador de QR Code</title>
  <meta name="description" content="Crie QR Codes estáticos e dinâmicos com o MD QR.">
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="#"><span class="brand-icon">▦</span><span>MD <b>QR</b></span></a>
    <span class="tagline">Crie. Personalize. Acompanhe.</span>
    <button id="logoutBtn" class="btn btn-quiet hidden">Sair</button>
  </header>

  <main class="wrap">
    <section class="hero">
      <div>
        <p class="eyebrow">GERADOR DE QR CODE</p>
        <h1>Seus links.<br><span>Em um só código.</span></h1>
        <p class="hero-copy">Crie QR Codes estáticos ou dinâmicos e gerencie tudo em um painel simples.</p>
        <div class="hero-pills"><span>✓ Estáticos</span><span>✓ Dinâmicos editáveis</span><span>✓ Download PNG</span></div>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="qr-art"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span>MD QR</span></div>
    </section>

    <section id="authSection" class="panel auth-panel">
      <div class="panel-heading">
        <div><p class="eyebrow">SUA CONTA</p><h2 id="authTitle">Entre no MD QR</h2></div>
        <div class="switcher"><button id="showLogin" class="active">Entrar</button><button id="showSignup">Criar conta</button></div>
      </div>
      <form id="authForm">
        <label for="email">E-mail</label>
        <input id="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" required>
        <label for="password">Senha</label>
        <input id="password" type="password" autocomplete="current-password" minlength="6" placeholder="Mínimo de 6 caracteres" required>
        <button id="authSubmit" class="btn btn-primary full" type="submit">Entrar</button>
        <p id="authMessage" class="message" role="status"></p>
      </form>
      <p class="fine-print">Sua conta é gerenciada pelo Supabase. Nunca compartilhe sua senha.</p>
    </section>

    <section id="appSection" class="hidden">
      <div class="welcome-row"><div><p class="eyebrow">PAINEL PESSOAL</p><h2>Seus QR Codes</h2><p class="muted">Crie e gerencie os seus links.</p></div><span id="userEmail" class="user-chip"></span></div>
      <div class="dashboard-grid">
        <section class="panel create-panel">
          <div class="panel-heading"><div><p class="eyebrow">NOVO CÓDIGO</p><h3>Criar QR Code</h3></div><span class="icon-bubble">＋</span></div>
          <form id="createForm">
            <label for="qrTitle">Nome do código</label>
            <input id="qrTitle" maxlength="80" placeholder="Ex.: Instagram da loja" required>
            <label for="qrType">Tipo de QR Code</label>
            <select id="qrType"><option value="dynamic">Dinâmico — posso trocar o link depois</option><option value="static">Estático — link fixo</option></select>
            <label for="qrUrl">Link de destino</label>
            <input id="qrUrl" type="url" placeholder="https://exemplo.com" required>
            <p class="hint">Use o endereço completo, começando com https://</p>
            <button class="btn btn-primary full" type="submit">Criar QR Code <span>→</span></button>
            <p id="createMessage" class="message" role="status"></p>
          </form>
        </section>
        <section class="panel preview-panel">
          <p class="eyebrow">PRÉVIA</p><h3>Seu código aparece aqui</h3>
          <div id="qrPreview" class="qr-preview"><div class="empty-qr">▦</div><p>Crie um código para visualizar e baixar.</p></div>
          <a id="downloadBtn" class="btn btn-secondary full disabled" href="#" download="md-qr.png">Baixar PNG</a>
          <p id="previewUrl" class="preview-url"></p>
        </section>
      </div>
      <section class="panel list-panel">
        <div class="panel-heading"><div><p class="eyebrow">BIBLIOTECA</p><h3>Seus códigos salvos</h3></div><button id="refreshBtn" class="btn btn-secondary">Atualizar ↻</button></div>
        <div id="qrList" class="qr-list"><div class="list-empty">Carregando seus códigos…</div></div>
      </section>
    </section>

    <section class="feature-row">
      <article><span class="feature-icon">↗</span><h3>Dinâmico</h3><p>Altere o destino de um QR Code sem precisar imprimir outro.</p></article>
      <article><span class="feature-icon">▦</span><h3>Estático</h3><p>Ideal para links fixos e compartilhamento simples.</p></article>
      <article><span class="feature-icon">⌂</span><h3>Seu painel</h3><p>Seus códigos ficam associados à sua conta.</p></article>
    </section>
    <div id="globalMessage" class="global-message" role="status"></div>
  </main>
  <footer><span class="brand small-brand">MD <b>QR</b></span><span>Feito para simplificar o compartilhamento.</span><span>Os recursos gratuitos dependem dos limites dos provedores.</span></footer>
  <script src="config.js"></script>
  <script src="app.js"></script>
</body>
</html>

<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101820">
  <title>MD QR — Gerador de QR Code</title>
  <meta name="description" content="Crie QR Codes estáticos e dinâmicos com o MD QR.">
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="#"><span class="brand-icon">▦</span><span>MD <b>QR</b></span></a>
    <span class="tagline">Crie. Personalize. Acompanhe.</span>
    <button id="logoutBtn" class="btn btn-quiet hidden">Sair</button>
  </header>

  <main class="wrap">
    <section class="hero">
      <div>
        <p class="eyebrow">GERADOR DE QR CODE</p>
        <h1>Seus links.<br><span>Em um só código.</span></h1>
        <p class="hero-copy">Crie QR Codes estáticos ou dinâmicos e gerencie tudo em um painel simples.</p>
        <div class="hero-pills"><span>✓ Estáticos</span><span>✓ Dinâmicos editáveis</span><span>✓ Download PNG</span></div>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="qr-art"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span>MD QR</span></div>
    </section>

    <section id="authSection" class="panel auth-panel">
      <div class="panel-heading">
        <div><p class="eyebrow">SUA CONTA</p><h2 id="authTitle">Entre no MD QR</h2></div>
        <div class="switcher"><button id="showLogin" class="active">Entrar</button><button id="showSignup">Criar conta</button></div>
      </div>
      <form id="authForm">
        <label for="email">E-mail</label>
        <input id="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" required>
        <label for="password">Senha</label>
        <input id="password" type="password" autocomplete="current-password" minlength="6" placeholder="Mínimo de 6 caracteres" required>
        <button id="authSubmit" class="btn btn-primary full" type="submit">Entrar</button>
        <p id="authMessage" class="message" role="status"></p>
      </form>
      <p class="fine-print">Sua conta é gerenciada pelo Supabase. Nunca compartilhe sua senha.</p>
    </section>

    <section id="appSection" class="hidden">
      <div class="welcome-row"><div><p class="eyebrow">PAINEL PESSOAL</p><h2>Seus QR Codes</h2><p class="muted">Crie e gerencie os seus links.</p></div><span id="userEmail" class="user-chip"></span></div>
      <div class="dashboard-grid">
        <section class="panel create-panel">
          <div class="panel-heading"><div><p class="eyebrow">NOVO CÓDIGO</p><h3>Criar QR Code</h3></div><span class="icon-bubble">＋</span></div>
          <form id="createForm">
            <label for="qrTitle">Nome do código</label>
            <input id="qrTitle" maxlength="80" placeholder="Ex.: Instagram da loja" required>
            <label for="qrType">Tipo de QR Code</label>
            <select id="qrType"><option value="dynamic">Dinâmico — posso trocar o link depois</option><option value="static">Estático — link fixo</option></select>
            <label for="qrUrl">Link de destino</label>
            <input id="qrUrl" type="url" placeholder="https://exemplo.com" required>
            <p class="hint">Use o endereço completo, começando com https://</p>
            <button class="btn btn-primary full" type="submit">Criar QR Code <span>→</span></button>
            <p id="createMessage" class="message" role="status"></p>
          </form>
        </section>
        <section class="panel preview-panel">
          <p class="eyebrow">PRÉVIA</p><h3>Seu código aparece aqui</h3>
          <div id="qrPreview" class="qr-preview"><div class="empty-qr">▦</div><p>Crie um código para visualizar e baixar.</p></div>
          <a id="downloadBtn" class="btn btn-secondary full disabled" href="#" download="md-qr.png">Baixar PNG</a>
          <p id="previewUrl" class="preview-url"></p>
        </section>
      </div>
      <section class="panel list-panel">
        <div class="panel-heading"><div><p class="eyebrow">BIBLIOTECA</p><h3>Seus códigos salvos</h3></div><button id="refreshBtn" class="btn btn-secondary">Atualizar ↻</button></div>
        <div id="qrList" class="qr-list"><div class="list-empty">Carregando seus códigos…</div></div>
      </section>
    </section>

    <section class="feature-row">
      <article><span class="feature-icon">↗</span><h3>Dinâmico</h3><p>Altere o destino de um QR Code sem precisar imprimir outro.</p></article>
      <article><span class="feature-icon">▦</span><h3>Estático</h3><p>Ideal para links fixos e compartilhamento simples.</p></article>
      <article><span class="feature-icon">⌂</span><h3>Seu painel</h3><p>Seus códigos ficam associados à sua conta.</p></article>
    </section>
    <div id="globalMessage" class="global-message" role="status"></div>
  </main>
  <footer><span class="brand small-brand">MD <b>QR</b></span><span>Feito para simplificar o compartilhamento.</span><span>Os recursos gratuitos dependem dos limites dos provedores.</span></footer>
  <script src="config.js"></script>
  <script src="app.js"></script>
</body>
</html>

# MD QR — gerador de QR Codes estáticos e dinâmicos

Aplicação web em português com cadastro/login via Supabase, painel pessoal, criação de QR Codes estáticos e dinâmicos, edição do destino de QR dinâmico, exclusão e download PNG. A função Cloudflare Pages `functions/r/[id].js` realiza o redirecionamento dinâmico.

## Arquitetura

- **Frontend:** HTML, CSS e JavaScript; hospedagem no Cloudflare Pages.
- **Autenticação e banco:** Supabase (plano gratuito, sujeito aos limites e políticas atuais).
- **QR Code:** biblioteca QRCode.js carregada por CDN.
- **Redirecionamento dinâmico:** Cloudflare Pages Function em `/r/:id`.
- **Banco:** `qr_codes`, com políticas RLS para que cada usuário veja e altere apenas os próprios códigos.

## Antes de publicar

### 1. Criar o projeto Supabase
1. Crie um projeto em https://supabase.com/.
2. No SQL Editor, execute todo o conteúdo de `supabase.sql`.
3. Abra as configurações de API do projeto e copie a Project URL e a chave pública `anon`/`publishable`.
4. Abra `config.js` e substitua `COLE_AQUI_A_URL_DO_SEU_PROJETO` e `COLE_AQUI_SUA_CHAVE_ANON_OU_PUBLISHABLE` pelos valores reais.
5. Em Authentication → URL Configuration, configure o Site URL e os Redirect URLs para o domínio que será usado no Cloudflare Pages. Durante testes, adicione também a URL local ou de pré-visualização necessária.
6. Ajuste o e-mail de confirmação conforme sua preferência de segurança. Em produção, é recomendável manter a confirmação de e-mail ativa e configurar um provedor SMTP confiável.

### 2. Publicar no Cloudflare Pages
1. Crie uma conta em https://dash.cloudflare.com/ e um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. No Cloudflare, acesse Workers & Pages → Create → Pages → Connect to Git.
4. Selecione o repositório. Como é um site HTML simples, deixe o comando de build vazio e defina o diretório de saída como `/` (raiz do projeto, conforme as opções disponíveis no painel).
5. Em Settings → Variables and Secrets (ou configuração equivalente do projeto), adicione estas variáveis para Functions:
   - `SUPABASE_URL`: Project URL do Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave `service_role`/secret do Supabase. Marque como segredo. **Nunca** a coloque no frontend, GitHub, `config.js` ou em qualquer arquivo público.
6. Faça o deploy. A pasta `functions/` deve ser enviada junto com o restante do projeto para ativar o redirecionamento `/r/:id`.
7. No Supabase, inclua o domínio final do Pages na configuração de URLs de autenticação.

### 3. Testar antes de divulgar
1. Abra o site publicado, crie uma conta e confirme o e-mail se solicitado.
2. Entre e crie um QR Code dinâmico com um link que você controla.
3. Baixe a imagem PNG e escaneie com o celular.
4. No painel, use “Editar destino” e escaneie o mesmo QR Code novamente: ele deve abrir o novo destino.
5. Crie um código estático e confirme que ele aponta diretamente ao link original.
6. Teste o logout, login novamente e a exclusão de um código.

## Como funcionam os tipos

- **Estático:** o QR Code contém diretamente o endereço de destino. Depois de impresso, esse endereço não pode ser alterado.
- **Dinâmico:** o QR Code contém `https://SEU-DOMINIO/r/UUID`. A função consulta o banco e redireciona para o destino atual. Alterar o destino não muda a imagem do QR Code.
- **Sem expiração programada:** este projeto não define uma data de expiração automática. Ainda assim, a disponibilidade depende da hospedagem, do banco, do domínio, das cotas e dos termos dos provedores. Não existe garantia de serviço gratuito ou disponibilidade “para sempre”.

## Limitações e próximos passos

Esta é uma primeira versão funcional, não um serviço SaaS pronto para escalar. Antes de oferecer publicamente:
- Configure SMTP, recuperação de senha e política de privacidade/termos.
- Adicione proteção contra abuso, rate limits, limites de criação e validação de URLs.
- Não exponha a chave service role.
- Implemente planos pagos com verificação de assinatura no servidor (por exemplo, Stripe/Mercado Pago) antes de aplicar limites premium.
- Adicione métricas de leitura se forem necessárias; esta versão não registra estatísticas.
- Considere domínio próprio, monitoramento, backups e um procedimento para indisponibilidade.

## Arquivos
- `index.html`, `styles.css`, `app.js`: interface e painel.
- `config.js`: configuração pública do Supabase.
- `supabase.sql`: tabela e políticas RLS.
- `functions/r/[id].js`: redirecionamento dos QR Codes dinâmicos.
- `_headers`: cabeçalhos de segurança básicos.

## Aviso de segurança
A chave pública Supabase é destinada ao navegador e depende das políticas RLS. A chave `service_role` ignora RLS e deve existir somente como segredo no ambiente servidor da Cloudflare Function. Nunca publique essa chave.

// Configure este arquivo com os dados públicos do seu projeto Supabase.
// A chave anon/publishable pode ser usada no navegador; NUNCA coloque a service_role aqui.
window.MDQR_CONFIG = {
  SUPABASE_URL: "COLE_AQUI_A_URL_DO_SEU_PROJETO",
  SUPABASE_ANON_KEY: "COLE_AQUI_SUA_CHAVE_ANON_OU_PUBLISHABLE"
};
dere domínio próprio, monitoramento, backups e um procedimento para indisponibilidade.

## Arquivos
- `index.html`, `styles.css`, `app.js`: interface e painel.
- `config.js`: configuração pública do Supabase.
- `supabase.sql`: tabela e políticas RLS.
- `functions/r/[id].js`: redirecionamento dos QR Codes dinâmicos.
- `_headers`: cabeçalhos de segurança básicos.

## Aviso de segurança
A chave pública Supabase é destinada ao navegador e depende das políticas RLS. A chave `service_role` ignora RLS e deve existir somente como segredo no ambiente servidor da Cloudflare Function. Nunca publique essa chave.

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

  function setLoggedIn(user) {
    session = user ? { user } : null;
    authSection.classList.toggle("hidden", !!user);
    appSection.classList.toggle("hidden", !user);
    $("logoutBtn").classList.toggle("hidden", !user);
    if (user) {
      $("userEmail").textContent = user.email || "Conta MD QR";
      loadCodes();
    } else {
      $("qrList").innerHTML = '<div class="list-empty">Entre para ver seus QR Codes.</div>';
      currentCodes = [];
    }
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
    $("qrList").innerHTML = '<div class="list-empty">Carregando seus códigos…</div>';
    const {data, error} = await supabase.from("qr_codes").select("*").order("created_at", {ascending:false});
    if (error) {
      $("qrList").innerHTML = '<div class="list-empty">Não foi possível carregar. Confira a configuração do banco e as políticas RLS.</div>';
      return;
    }
    currentCodes = data || [];
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
    supabase.auth.onAuthStateChange((_event, newSession) => setLoggedIn(newSession?.user || null));
  }@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{--ink:#101820;--green:#4ade80;--green-dark:#159447;--muted:#687580;--line:#e4e9ed;--bg:#f5f8f7;--white:#fff;--radius:20px}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"DM Sans",sans-serif}button,input,select{font:inherit}button,a{ -webkit-tap-highlight-color:transparent}.topbar{height:76px;padding:0 max(24px,calc((100vw - 1120px)/2));display:flex;align-items:center;gap:28px;background:#fff;border-bottom:1px solid var(--line)}.brand{display:inline-flex;align-items:center;gap:10px;color:var(--ink);font:800 22px Manrope,sans-serif;text-decoration:none;letter-spacing:-1px}.brand b{color:#20b65a}.brand-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:var(--green);font-size:25px}.tagline{color:var(--muted);font-size:13px}.topbar #logoutBtn{margin-left:auto}.wrap{max-width:1120px;margin:0 auto;padding:34px 24px 60px}.hero{min-height:280px;border-radius:26px;padding:42px 48px;display:flex;align-items:center;justify-content:space-between;overflow:hidden;background:var(--ink);color:white;position:relative}.eyebrow{font-size:10px;letter-spacing:2px;font-weight:700;color:#20a957;margin:0 0 9px}.hero h1{font:800 clamp(34px,4vw,52px)/1.07 Manrope,sans-serif;letter-spacing:-2px;margin:0}.hero h1 span{color:var(--green)}.hero-copy{max-width:470px;color:#c0cbd2;line-height:1.65;font-size:15px}.hero-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.hero-pills span{font-size:11px;padding:8px 10px;border-radius:99px;border:1px solid #34414a;color:#e0e7eb}.hero-art{width:190px;height:190px;margin-right:36px;border:1px solid #2b3b43;border-radius:28px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;transform:rotate(5deg);background:linear-gradient(145deg,#17262c,#0d151a);box-shadow:0 22px 55px #0004}.hero-art>span{font:800 15px Manrope;color:var(--green);letter-spacing:3px}.qr-art{display:grid;grid-template-columns:repeat(3,20px);gap:5px}.qr-art i{height:20px;width:20px;border:5px solid var(--green);border-radius:3px}.qr-art i:nth-child(2),.qr-art i:nth-child(4),.qr-art i:nth-child(6),.qr-art i:nth-child(8){border:0;background:var(--green)}.panel{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:26px;box-shadow:0 8px 28px #16272d06}.auth-panel{max-width:520px;margin:28px auto}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.panel h2,.panel h3,.welcome-row h2{font-family:Manrope,sans-serif;letter-spacing:-.7px;margin:0}.panel h2,.welcome-row h2{font-size:25px}.panel h3{font-size:19px}.switcher{display:flex;background:#f1f4f4;padding:4px;border-radius:10px}.switcher button{border:0;border-radius:8px;padding:9px 11px;background:transparent;color:var(--muted);font-size:12px;cursor:pointer}.switcher button.active{background:#fff;color:var(--ink);box-shadow:0 1px 4px #0001;font-weight:700}label{display:block;font-size:12px;font-weight:700;margin:16px 0 7px}input,select{width:100%;padding:13px 14px;border:1px solid #dce3e5;border-radius:10px;background:#fff;color:var(--ink);outline:none}input:focus,select:focus{border-color:#26b85c;box-shadow:0 0 0 3px #4ade8026}.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 16px;border:0;border-radius:10px;font-weight:700;font-size:13px;text-decoration:none;cursor:pointer;transition:.15s}.btn-primary{background:var(--green);color:#0d2718}.btn-primary:hover{background:#36d873;transform:translateY(-1px)}.btn-secondary{background:#f0f4f2;color:#1d3427;border:1px solid #e2e9e5}.btn-quiet{background:#f0f4f2;color:#25352d}.full{width:100%;margin-top:20px}.fine-print,.hint{font-size:11px;line-height:1.5;color:var(--muted)}.message{font-size:12px;line-height:1.5;color:#148344;min-height:0}.message.error{color:#c13b3b}.hidden{display:none!important}.welcome-row{display:flex;justify-content:space-between;align-items:center;margin:32px 0 18px}.muted{color:var(--muted);font-size:13px;margin:7px 0}.user-chip{max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#e6f8ec;color:#167b3d;border-radius:99px;padding:9px 13px;font-size:11px}.dashboard-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}.icon-bubble,.feature-icon{display:grid;place-items:center;background:#e3faeb;color:#149447;border-radius:13px;width:42px;height:42px;font-size:23px}.create-panel form label:first-child{margin-top:0}.preview-panel{display:flex;flex-direction:column}.preview-panel .eyebrow{margin-bottom:9px}.qr-preview{min-height:220px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px}.qr-preview canvas,.qr-preview img{max-width:100%;height:auto!important;image-rendering:pixelated}.qr-preview>div{padding:12px;background:white;border:1px solid var(--line);border-radius:12px}.qr-preview p{font-size:12px;color:var(--muted);line-height:1.5}.empty-qr{font-size:64px;color:#b8c6be}.disabled{opacity:.45;pointer-events:none}.preview-url{font-size:11px;overflow-wrap:anywhere;color:var(--muted);text-align:center}.list-panel{margin-top:18px}.qr-list{display:grid;gap:10px}.list-empty{padding:22px;text-align:center;border:1px dashed #d8e1dc;border-radius:12px;color:var(--muted);font-size:13px}.qr-item{display:flex;align-items:center;gap:14px;border:1px solid var(--line);border-radius:13px;padding:14px}.qr-mini{width:46px;height:46px;flex:0 0 46px;display:grid;place-items:center;border-radius:10px;background:#e9faef;color:#159447;font-size:26px}.qr-meta{min-width:0;flex:1}.qr-meta strong{display:block;font-size:13px}.qr-meta small{display:block;color:var(--muted);font-size:11px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.type-badge{display:inline-block;margin-top:6px;border-radius:5px;padding:3px 6px;background:#eef4f0;color:#4d6557;font-size:9px;font-weight:700;text-transform:uppercase}.item-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.item-actions button{border:1px solid var(--line);background:#fff;padding:8px 9px;border-radius:8px;font-size:11px;cursor:pointer}.item-actions .delete{color:#b33a3a}.feature-row{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:24px}.feature-row article{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px}.feature-row h3{font:700 15px Manrope;margin:15px 0 7px}.feature-row p{color:var(--muted);font-size:12px;line-height:1.6;margin:0}.feature-icon{width:38px;height:38px;font-size:20px}footer{display:flex;justify-content:center;align-items:center;gap:22px;flex-wrap:wrap;border-top:1px solid var(--line);background:#fff;padding:22px 18px;color:var(--muted);font-size:10px}.small-brand{font-size:15px}.global-message{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#101820;color:#fff;border-radius:10px;padding:12px 16px;font-size:12px;display:none;max-width:90vw;z-index:10}.global-message.show{display:block}
@media(max-width:760px){.tagline{display:none}.topbar{height:64px;padding:0 18px}.wrap{padding:20px 14px 38px}.hero{padding:30px 24px;min-height:0}.hero-art{display:none}.hero h1{font-size:39px}.dashboard-grid{grid-template-columns:1fr}.feature-row{grid-template-columns:1fr;gap:10px}.feature-row article{display:grid;grid-template-columns:42px 1fr;column-gap:12px;align-items:center}.feature-row h3{margin:0}.feature-row p{grid-column:2}.panel{padding:20px}.panel-heading{align-items:flex-start}.qr-item{flex-wrap:wrap}.item-actions{width:100%;justify-content:flex-start}.welcome-row{align-items:flex-start;gap:10px}.user-chip{max-width:50%}footer{gap:10px;flex-direction:column}.auth-panel{margin:20px auto}}

})();
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
create extension if not exists pgcrypto;

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  destination_url text not null check (destination_url ~* '^https?://'),
  type text not null check (type in ('static', 'dynamic')),
  created_at timestamptz not null default now()
);

create index if not exists qr_codes_user_id_created_at_idx
  on public.qr_codes (user_id, created_at desc);

alter table public.qr_codes enable row level security;

drop policy if exists "Users can read their own QR codes" on public.qr_codes;
create policy "Users can read their own QR codes"
  on public.qr_codes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own QR codes" on public.qr_codes;
create policy "Users can create their own QR codes"
  on public.qr_codes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own QR codes" on public.qr_codes;
create policy "Users can update their own QR codes"
  on public.qr_codes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own QR codes" on public.qr_codes;
create policy "Users can delete their own QR codes"
  on public.qr_codes for delete to authenticated
  using (auth.uid() = user_id);

-- A função de redirecionamento usa a chave service role apenas no servidor.
-- Nunca exponha SUPABASE_SERVICE_ROLE_KEY em index.html, config.js ou app.js.
