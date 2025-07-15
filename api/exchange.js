const fetch = require("node-fetch");

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Código não fornecido" });
  }

  const params = new URLSearchParams();
  params.append("client_id", process.env.DISCORD_CLIENT_ID);
  params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      return res.status(400).json({ error: "Falha ao trocar código por token", details: err });
    }

    const tokenData = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
    });

    const userData = await userRes.json();

    // Tenta colocar o usuário no servidor (guild) automaticamente
    await fetch(`https://discord.com/api/guilds/${process.env.SEUS_GUILD_ID}/members/${userData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify({ access_token: tokenData.access_token }),
    });

    // Pega os cargos do usuário no servidor
    const memberRes = await fetch(`https://discord.com/api/guilds/${process.env.SEUS_GUILD_ID}/members/${userData.id}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });

    const memberData = await memberRes.json();

    const roles = memberData.roles || [];

    const user = {
      ...userData,
      roles,
      isAdmin: roles.includes(process.env.SEUS_ADMIN_ROLE_ID),
    };

    // Armazena cookie para sessão simples
    res.setHeader("Set-Cookie", `user=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; Max-Age=86400`);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro interno", details: error.message });
  }
}
