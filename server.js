import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve arquivos estáticos da raiz

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // ex: https://dreekbet.vercel.app
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // seu servidor Discord

const users = {};
const admins = new Set();

app.get("/login", (req, res) => {
  const authURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify`;
  res.redirect(authURL);
});

app.get("/logout", (req, res) => {
  // Simples logout — redireciona para a página inicial sem código
  res.redirect("/");
});

async function isAdmin(userId) {
  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`,
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

// Exemplo de rotas para manipular bots (ajuste para integrar com sua API Discloud)

app.get("/bots/:userId", (req, res) => {
  const userId = req.params.userId;
  if (!users[userId]) return res.json({ bots: [] });
  res.json({ bots: users[userId].bots });
});

app.post("/bots/:botId/start", (req, res) => {
  // lógica para iniciar bot via sua API Discloud aqui
  res.json({ message: "Bot iniciado (simulado)" });
});

app.post("/bots/:botId/stop", (req, res) => {
  // lógica para parar bot via sua API Discloud aqui
  res.json({ message: "Bot parado (simulado)" });
});

app.delete("/bots/:botId", (req, res) => {
  // lógica para remover bot via sua API Discloud aqui
  res.json({ message: "Bot removido (simulado)" });
});

// Serve index.html para todas as outras rotas (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
