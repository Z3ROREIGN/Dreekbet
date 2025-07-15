import fetch from 'node-fetch';

const GUILD_ID = 'SEU_GUILD_ID';
const SUPPORT_CHANNEL_ID = 'SEU_SUPORTE_CANAL_ID';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { mensagem, usuario } = req.body;
  if (!mensagem || !usuario) return res.status(400).json({ error: 'Mensagem ou usuário ausente' });

  const { DISCORD_BOT_TOKEN } = process.env;

  await fetch(`https://discord.com/api/channels/${SUPPORT_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
    },
    body: JSON.stringify({
      content: `📩 Nova mensagem de suporte de **${usuario}**:\n> ${mensagem}`
    })
  });

  res.json({ ok: true, message: 'Mensagem enviada ao suporte!' });
}
