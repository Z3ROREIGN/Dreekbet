import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Código 'code' ausente." });

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: "https://dreekbet.shop/api/auth",
    scope: "identify email"
  });

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token)
      return res.status(400).json({ error: "Access token não recebido", data: tokenData });

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Criar JWT com id, username e email (não envie segredo em frontend)
    const jwtToken = jwt.sign(
      { id: userData.id, username: userData.username, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Retorna JWT para frontend
    return res.json({ token: jwtToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno na autenticação." });
  }
}
