export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { plano, msg } = req.body;

  if (!plano || !msg) {
    return res.status(400).json({ error: "Parâmetros insuficientes" });
  }

  try {
    const response = await fetch(process.env.SUPPORT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `📩 Novo pedido de plano: ${plano}`,
            description: msg,
            color: 0x3498db,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: "Erro ao enviar mensagem ao suporte", details: errorText });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno do servidor", details: err.message });
  }
}
