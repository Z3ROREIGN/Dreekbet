let chamados = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    const { user, mensagem } = req.body;
    chamados.push({ user, mensagem, quando: new Date() });
    return res.status(200).json({ ok: true, msg: "Chamado registrado" });
  }

  if (req.method === "GET") {
    return res.status(200).json(chamados);
  }

  res.status(405).json({ error: "Método não permitido" });
}
