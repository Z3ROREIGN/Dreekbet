const fetch = require("node-fetch");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { plano, msg } = req.body;

  if (!plano || !msg) return res.status(400).json({ error: "Parâmetros insuficientes" });

  try {
    await fetch(process.env.SUPPORT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `Novo pedido de plano: ${plano}`,
            description: msg,
            color: 3066993,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao enviar mensagem ao suporte" });
  }
}
