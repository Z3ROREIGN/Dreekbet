export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código ausente na URL.");
  }

  const params = new URLSearchParams();
  params.append("client_id", process.env.DISCORD_CLIENT_ID);
  params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  params.append("scope", "identify email");

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json(tokenData);
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Aqui você pode redirecionar ou salvar o token em cookie
    // ou armazenar no localStorage via frontend, como preferir
    return res.redirect(`/login.html?user=${encodeURIComponent(userData.username)}`);
  } catch (err) {
    return res.status(500).send("Erro ao autenticar.");
  }
}
