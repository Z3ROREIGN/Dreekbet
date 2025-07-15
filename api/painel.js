export default async function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) return res.status(401).send("Not logged in");

  const user = JSON.parse(decodeURIComponent(match[1]));
  if (!user.isAdmin) return res.status(403).send("Forbidden");

  const mockUsuarios = [
    { id: "123", username: "User1", plano: "Carbon", status: "Ativo" },
    { id: "456", username: "User2", plano: "Platinum", status: "Pendente" },
  ];

  const mockPedidos = [
    { usuario: "User2", plano: "Platinum", mensagem: "Mais RAM." },
    { usuario: "User3", plano: "Golden", mensagem: "Quando ativa?" },
  ];

  res.json({
    usuarios: mockUsuarios,
    pedidos: mockPedidos,
    totalUsuarios: mockUsuarios.length,
    totalPedidos: mockPedidos.length,
  });
}
