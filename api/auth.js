export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Código não informado" });

  const params = new URLSearchParams();
  params.append("client_id", process.env.DISCORD_CLIENT_ID);
  params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  params.append("code", code);

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = await response.json();

  if (!data.access_token) {
    return res.status(400).json({ error: "Falha ao trocar código por token", detalhes: data });
  }

  const userInfo = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  }).then(r => r.json());

  res.redirect(`/dashboard.html?user=${encodeURIComponent(JSON.stringify(userInfo))}`);
}
