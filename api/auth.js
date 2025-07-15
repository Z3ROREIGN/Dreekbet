export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Código OAuth2 não enviado" });
  }

  const params = new URLSearchParams();
  params.append("client_id", process.env.DISCORD_CLIENT_ID);
  params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  params.append("scope", "identify guilds guilds.join");

  try {
    // Trocar o code pelo token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      return res.status(400).json({ error: "Falha ao trocar código por token", details: errorData });
    }

    const tokenData = await tokenResponse.json();

    // Agora buscar dados do usuário
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `${tokenData.token_type} ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      return res.status(400).json({ error: "Falha ao obter dados do usuário", details: errorData });
    }

    const user = await userResponse.json();

    // Se quiser, também buscar guilds para validar cargos/admin, etc
    const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `${tokenData.token_type} ${tokenData.access_token}`
      }
    });

    const guilds = guildsResponse.ok ? await guildsResponse.json() : [];

    // Retornar dados para o frontend
    return res.status(200).json({ user, guilds, tokenData });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno no servidor", details: err.message });
  }
}
