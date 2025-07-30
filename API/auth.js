export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código 'code' ausente na URL.");
  }

  // Parâmetros para troca do código pelo token OAuth2
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,          // ENV variável na Vercel
    client_secret: process.env.DISCORD_CLIENT_SECRET,  // ENV variável segura
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,    // ENV variável (ex: https://dreekbet.shop/api/auth)
    scope: "identify email"
  });

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Não recebeu access_token", data: tokenData });
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userRes.json();

    // Redireciona para a página login.html com o username na query string
    return res.redirect(`/login.html?user=${encodeURIComponent(userData.username)}`);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro interno na autenticação.");
  }
}
