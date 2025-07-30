// api/auth.js (Node.js + Express para Vercel)

import fetch from 'node-fetch';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = 'https://dreekbet.shop/login.html'; // ou sua URL de login
const SCOPE = 'identify';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    // Redirecionar para o Discord OAuth
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPE}`;
    res.writeHead(302, { Location: discordAuthUrl });
    return res.end();
  }

  try {
    // Trocar code por access_token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', SCOPE);

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Falha ao obter token' });
    }

    // Pega dados do usuário
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Retorna dados do usuário e token para o front-end
    res.status(200).json({
      user: userData,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno na autenticação' });
  }
}
