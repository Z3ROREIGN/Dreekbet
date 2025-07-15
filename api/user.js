export default function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Não autenticado" });

  const user = JSON.parse(Buffer.from(match[1], "base64").toString());
  res.status(200).json(user);
}
