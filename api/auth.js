import fetch from "node-fetch";

const GUILD_ID = process.env.SEU_GUILD_ID;

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
      response_type: "code",
      scope: "identify guilds guilds.join",
    });
    return res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
  }

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return res.status(400).send("Erro ao obter token");
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();

  await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify({ access_token: tokenData.access_token }),
  });

  res.setHeader("Set-Cookie", `user=${Buffer.from(JSON.stringify(user)).toString("base64")}; Path=/; HttpOnly`);
  res.redirect("/");
}
