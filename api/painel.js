export default async function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Não autenticado" });

  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    if (!user.isAdmin) return res.status(403).json({ error: "Acesso negado" });

    // Aqui você implementa integração real com banco ou api para trazer os dados reais.
    // Por enquanto, mock para testes:

    const usuarios = [
      { id: "123", username: "User1", plano: "Carbon", status: "Ativo" },
      { id: "456", username: "User2", plano: "Platinum", status: "Pendente" },
    ];

    const pedidos = [
      { usuario: "User2", plano: "Platinum", mensagem: "Mais RAM" },
      { usuario: "User3", plano: "Golden", mensagem: "Quando ativa?" },
    ];

    res.json({
      usuarios,
      pedidos,
      totalUsuarios: usuarios.length,
      totalPedidos: pedidos.length,
    });
  } catch {
    res.status(400).json({ error: "Cookie inválido" });
  }
}
