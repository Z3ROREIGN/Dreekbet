export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  res.status(200).json({
    usuarios: [
      { id: "123", nome: "Cliente #1", plano: "Carbon", ram: "512MB" }
    ],
    planos: [
      { nome: "Carbon", preco: "R$5", ram: "512MB" },
      { nome: "Golden", preco: "R$10", ram: "1GB" },
      { nome: "Platinum", preco: "R$15", ram: "2GB" }
    ],
    chamados: [
      { user: "Cliente #1", mensagem: "Preciso de ajuda", quando: new Date() }
    ]
  });
}

