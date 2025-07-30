const express = require('express');
const fetch = require('node-fetch'); // versão 2.x para require
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/auth', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Código 'code' ausente.");

  const redirectUri = 'https://dreekbet.shop/api/auth'; // seu redirect_uri registrado no Discord

  const params = new URLSearchParams({
    client_id: '1391419432257060914', // Client ID fixo
    client_secret: process.env.DISCORD_CLIENT_SECRET, // Seu segredo da env
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    scope: 'identify email'
  });

  try {
    // Troca o code pelo token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return res.status(400).send(`Erro ao obter token: ${text}`);
    }

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: "Não recebeu access_token", data: tokenData });
    }

    // Pega os dados do usuário
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      return res.status(400).send(`Erro ao obter dados do usuário: ${text}`);
    }

    const userData = await userRes.json();

    // Aqui você pode criar e assinar JWT, mas vamos retornar o usuário direto pra teste
    // Depois no frontend você pode salvar isso e seguir com seu sistema

    return res.json({ user: userData });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro interno na autenticação.");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
