import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const ADMIN_ID = '1098745384848859258';
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esse_segredo';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Código 'code' ausente." });

  const redirectUri = 'https://dreekbet.shop/api/auth';

  const params = new URLSearchParams({
    client_id: '1391419432257060914',
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    scope: 'identify email',
  });

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return res.status(400).json({ error: `Erro ao obter token: ${text}` });
    }

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Não recebeu access_token' });
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      return res.status(400).json({ error: `Erro ao obter dados do usuário: ${text}` });
    }

    const userData = await userRes.json();

    const payload = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      isAdmin: userData.id === ADMIN_ID,
    };

    const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    // Redireciona para painel com token JWT
    return res.redirect(`https://dreekbet.shop/painel.html?token=${jwtToken}`);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno na autenticação.' });
  }
}
