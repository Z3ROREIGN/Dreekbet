const bots = new Map();

export default async function handler(req, res) {
  const userId = req.query.userId || (req.body && req.body.userId);

  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  switch (req.method) {
    case 'GET': {
      const bot = bots.get(userId) || null;
      return res.status(200).json({ bot });
    }
    case 'POST': {
      if (bots.has(userId)) {
        return res.status(400).json({ error: 'Você já tem um bot hospedado' });
      }
      const { botData } = req.body;
      if (!botData) return res.status(400).json({ error: 'botData é obrigatório' });

      bots.set(userId, { botData, status: 'online', createdAt: Date.now() });
      return res.status(201).json({ message: 'Bot hospedado com sucesso' });
    }
    case 'DELETE': {
      bots.delete(userId);
      return res.status(200).json({ message: 'Bot removido' });
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}
