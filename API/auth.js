export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código 'code' ausente na URL.");
  }

  const params = new URLSearchParams({
    client_id: "1358987708579709042",
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: "https://dreekbet.shop/api/auth", // FIXO para evitar erro
    scope: "identify email"
  });

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Não recebeu access_token", data: tokenData });
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userRes.json();

    return res.redirect(`/login.html?user=${encodeURIComponent(userData.username)}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro interno na autenticação.");
  }
}
