const fetch = require("node-fetch");

export default async function handler(req, res) {
  const { code } = req.query;

  const params = new URLSearchParams();
  params.append("client_id", process.env.DISCORD_CLIENT_ID);
  params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const tokenData = await tokenRes.json();

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
  });

  const userData = await userRes.json();

  await fetch(`https://discord.com/api/guilds/${process.env.SEU_GUILD_ID}/members/${userData.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify({ access_token: tokenData.access_token }),
  });

  const rolesRes = await fetch(`https://discord.com/api/users/@me/guilds/${process.env.SEU_GUILD_ID}/member`, {
    headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
  });

  const rolesData = await rolesRes.json();
  const roles = rolesData.roles || [];

  const user = {
    ...userData,
    roles,
    isAdmin: roles.includes(process.env.SEU_ADMIN_ROLE_ID),
  };

  res.setHeader("Set-Cookie", `user=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly;`);
  res.json(user);
}
