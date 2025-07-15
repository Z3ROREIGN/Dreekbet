import fs from 'fs/promises';
const DB_PATH = './utils/db.json';

async function loadDB() {
  const file = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(file);
}

export default async function handler(req, res) {
  const { id } = req.query;
  const db = await loadDB();
  const user = db.users[id];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ user });
}
