const express = require('express');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_ID = '1098745384848859258';
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esse_segredo';

app.use(express.json());

app.get('/api/auth', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Código 'code' ausente." });

  const redirectUri = 'https://dreekbet.shop/login.html';

  const params = new URLSearchParams({
    client_id: '1391419432257060914',
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    scope: 'identify email'
  });

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return res.status(400).json({ error: `Erro ao obter token: ${text}` });
    }

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Não recebeu access_token", data: tokenData });
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
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
      isAdmin: userData.id === ADMIN_ID
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    return res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno na autenticação." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
