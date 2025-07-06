import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, BOT_TOKEN, GUILD_ID } = process.env;
const PORT = process.env.PORT || 3000;

app.get('/login', (req, res) => {
  const scope = 'identify guilds.join';
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
  res.redirect(url);
});

app.post('/auth', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code não fornecido' });

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      scope: 'identify guilds.join'
    });

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return res.status(500).json({ error: `Erro ao trocar código por token: ${text}` });
    }

    const tokenJson = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      return res.status(500).json({ error: `Erro ao obter dados do usuário: ${text}` });
    }

    const user = await userRes.json();

    // Adicionar usuário no servidor
    const addRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ access_token: tokenJson.access_token })
    });

    if (!addRes.ok) {
      const text = await addRes.text();
      return res.status(500).json({ error: `Erro ao adicionar usuário no servidor: ${text}` });
    }

    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
