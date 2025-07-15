const fetch = require("node-fetch");

export default async function handler(req, res) {
  const { plano, msg } = req.body;

  await fetch(process.env.SUPPORT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: `Novo pedido de plano: ${plano}`,
          description: msg,
          color: 3066993,
        },
      ],
    }),
  });

  res.json({ ok: true });
}
