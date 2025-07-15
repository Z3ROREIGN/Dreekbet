export default async function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    res.json(user);
  } catch {
    res.status(400).json({ error: "Cookie inválido" });
  }
}
