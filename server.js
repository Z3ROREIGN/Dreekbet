import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(".")); // servir index.html diretamente da raiz

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // ex.: https://dreekbet.shop
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID;

const users = {};
const admins = new Set();

// rota /login para iniciar OAuth2 no Discord
app.get("/login", (req, res) => {
  const authURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify`;
  res.redirect(authURL);
});

async function isAdmin(userId) {
  try {
    const res = await fetch(
      `https://discord.com/api/guilds/YOUR_GUILD_ID/members/${userId}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );
    if (!res.ok) return false;
    const member = await res.json();
    return member.roles.includes(ADMIN_ROLE_ID);
  } catch {
    return false;
  }
}

app.post("/auth", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code é obrigatório" });

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", REDIRECT_URI);

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token)
      return res.status(400).json({ error: "Falha no token" });

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const adminCheck = await isAdmin(userData.id);
    if (adminCheck) admins.add(userData.id);

    if (!users[userData.id]) {
      users[userData.id] = {
        paidSlots: 0,
        bots: [],
        accessGranted: false,
        messages: [],
      };
    }

    res.json({
      user: userData,
      isAdmin: adminCheck,
      paidSlots: users[userData.id].paidSlots,
      accessGranted: users[userData.id].accessGranted,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// outras rotas permanecem iguais
// exemplo de rota de fallback pra servir index.html em SPA
app.get("*", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
