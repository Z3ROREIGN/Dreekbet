export default async function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) return res.status(401).send("Not logged in");
  const user = JSON.parse(decodeURIComponent(match[1]));
  res.json(user);
}
