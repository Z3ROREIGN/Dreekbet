import fetch from 'node-fetch';

const DISCLOUD_TOKEN = process.env.DISCLOUD_TOKEN;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { botZipUrl, userId, productName } = req.body;

  if (!botZipUrl || !userId || !productName) {
    return res.status(400).json({ error: 'Faltam dados obrigatórios' });
  }

  try {
    // Cria hospedagem na Discloud
    const response = await fetch('https://api.discloud.app/v1/apps', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DISCLOUD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `dreekbet-${userId}-${Date.now()}`,
        version: 'latest',
        zip_url: botZipUrl,
        region: 'sfo1',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Erro ao hospedar bot' });
    }

    // Enviar DM para usuário confirmando hospedagem
    const dmResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: userId }),
    });

    const dmChannel = await dmResponse.json();

    if (!dmResponse.ok) {
      return res.status(500).json({ error: 'Erro ao criar canal DM' });
    }

    // Enviar mensagem no DM
    await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `Olá! Seu bot **${productName}** foi hospedado com sucesso na DreekBet! 🚀`,
      }),
    });

    return res.status(200).json({ message: 'Bot hospedado e usuário notificado!', data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
      }

