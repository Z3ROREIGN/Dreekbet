import fetch from 'node-fetch';
import fs from 'fs/promises';

const DB_PATH = './utils/db.json';
const GUILD_ID = 'SEU_GUILD_ID';

async function loadDB() {
  const file = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(file);
}

async function saveDB(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código não enviado' });

  const {
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI,
    DISCORD_BOT_TOKEN,
    DISCORD_ADMIN_ROLE_ID
  } = process.env;

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: DISCORD_REDIRECT_URI,
    scope: 'identify guilds guilds.join'
  });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(400).json({ error: 'Falha ao obter token' });

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();

  // Adiciona o usuário ao servidor se não estiver
  await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
    },
    body: JSON.stringify({ access_token: tokenData.access_token })
  });

  const db = await loadDB();
  db.users[user.id] = db.users[user.id] || {
    id: user.id,
    username: `${user.username}#${user.discriminator}`,
    avatar: user.avatar,
    plano: null,
    admin: false
  };

  // Verifica se tem cargo admin
  const memberRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
  });
  const member = await memberRes.json();

  db.users[user.id].admin = member.roles.includes(DISCORD_ADMIN_ROLE_ID);
  await saveDB(db);

  res.json({ ok: true, user });
}
