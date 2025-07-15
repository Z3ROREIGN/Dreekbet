const chats = new Map();

export default async function handler(req, res) {
  const userId = req.query.userId || (req.body && req.body.userId);
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  if (req.method === 'POST') {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem é obrigatória' });

    if (!chats.has(userId)) chats.set(userId, []);
    chats.get(userId).push({ author: 'user', text: message, timestamp: Date.now() });

    chats.get(userId).push({ author: 'admin', text: 'Recebemos sua mensagem, responderemos em breve.', timestamp: Date.now() });

    return res.status(200).json({ message: 'Mensagem enviada' });
  } else if (req.method === 'GET') {
    const messages = chats.get(userId) || [];
    return res.status(200).json({ messages });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }
}
