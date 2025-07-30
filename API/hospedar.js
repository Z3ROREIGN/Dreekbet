// api/hospedar.js (Node.js + Express para Vercel)

import fetch from 'node-fetch';

const DISCLOUD_TOKEN = process.env.DISCLOUD_TOKEN; // seu token secreto da Discloud

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { botZipUrl, userId, productName } = req.body;

  if (!botZipUrl || !userId || !productName) {
    return res.status(400).json({ error: 'Faltam parâmetros obrigatórios' });
  }

  try {
    // Monta payload para API da Discloud
    const payload = {
      name: `${productName}-${userId}`,
      repo: botZipUrl,
      env: {},
      // outros dados conforme API da Discloud
    };

    const discloudRes = await fetch('https://api.discloud.app/v1/app', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DISCLOUD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const discloudData = await discloudRes.json();

    if (!discloudRes.ok) {
      return res.status(400).json({ error: discloudData.message || 'Erro ao hospedar bot' });
    }

    // Retorna sucesso e dados para front
    res.status(200).json({ success: true, app: discloudData });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
