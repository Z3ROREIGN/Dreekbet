export default async function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) return res.status(401).send("Not logged in");

  const user = JSON.parse(decodeURIComponent(match[1]));
  if (!user.isAdmin) return res.status(403).send("Forbidden");

  // Mock de dados
  const mockUsuarios = [
    { id: "123456789", username: "User1", plano: "Carbon", status: "Ativo" },
    { id: "987654321", username: "User2", plano: "Platinum", status: "Pendente" },
    { id: "456789123", username: "User3", plano: "Golden", status: "Ativo" },
  ];

  const mockPedidos = [
    { usuario: "User2", plano: "Platinum", mensagem: "Gostaria de mais RAM." },
    { usuario: "User3", plano: "Golden", mensagem: "Quanto tempo para ativar?" },
  ];

  res.json({
    usuarios: mockUsuarios,
    pedidos: mockPedidos,
    totalUsuarios: mockUsuarios.length,
    totalPedidos: mockPedidos.length,
  });
}
