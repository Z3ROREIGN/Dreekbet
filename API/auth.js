import fetch from 'node-fetch';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    // Redireciona para o Discord OAuth2
    const discordAuthURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds`;
    return res.redirect(discordAuthURL);
  }

  // Troca o code pelo token de acesso
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('scope', 'identify email guilds');

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return res.status(400).json({ error: 'Erro na autenticação' });
  }

  // Busca dados do usuário
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  const userData = await userRes.json();

  // Retorna JSON com dados do usuário e token de acesso
  return res.status(200).json({ user: userData, access_token: tokenData.access_token });
}

