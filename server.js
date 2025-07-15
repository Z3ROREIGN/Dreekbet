import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID;

const users = {};
const admins = new Set();

async function isAdmin(userId) {
  try {
    const res = await fetch(
      `https://discord.com/api/guilds/YOUR_GUILD_ID_HERE/members/${userId}`,
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

app.get("/bots/:userId", (req, res) => {
  const { userId } = req.params;
  const user = users[userId];
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  res.json({ bots: user.bots });
});

app.post("/admin/grant", (req, res) => {
  const { adminId, targetUserId } = req.body;
  if (!admins.has(adminId))
    return res.status(403).json({ error: "Não autorizado" });

  if (!users[targetUserId])
    return res.status(404).json({ error: "Usuário alvo não encontrado" });

  users[targetUserId].accessGranted = true;
  users[targetUserId].paidSlots = 1;

  res.json({ message: "Acesso liberado para usuário", targetUserId });
});

app.post("/bot/upload", (req, res) => {
  const { userId, botName } = req.body;
  const user = users[userId];
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!user.accessGranted || user.bots.length >= user.paidSlots) {
    return res
      .status(403)
      .json({ error: "Acesso não liberado ou limite de bots atingido" });
  }

  const newBot = {
    id: `bot_${Date.now()}`,
    name: botName,
    status: "offline",
    ramUsage: "0MB",
  };

  user.bots.push(newBot);
  res.json({ message: "Bot hospedado com sucesso", bot: newBot });
});

app.post("/bot/start", (req, res) => {
  const { userId, botId } = req.body;
  const user = users[userId];
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  const bot = user.bots.find((b) => b.id === botId);
  if (!bot) return res.status(404).json({ error: "Bot não encontrado" });

  bot.status = "online";
  bot.ramUsage = "50MB";
  res.json({ message: "Bot iniciado", bot });
});

app.post("/bot/stop", (req, res) => {
  const { userId, botId } = req.body;
  const user = users[userId];
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  const bot = user.bots.find((b) => b.id === botId);
  if (!bot) return res.status(404).json({ error: "Bot não encontrado" });

  bot.status = "offline";
  bot.ramUsage = "0MB";
  res.json({ message: "Bot parado", bot });
});

app.post("/support/send", (req, res) => {
  const { userId, message, isAdmin } = req.body;
  if (!users[userId]) return res.status(404).json({ error: "Usuário não encontrado" });

  const entry = { fromAdmin: !!isAdmin, message, date: new Date().toISOString() };
  users[userId].messages.push(entry);
  res.json({ message: "Mensagem enviada" });
});

app.get("/support/messages/:userId", (req, res) => {
  const { userId } = req.params;
  if (!users[userId]) return res.status(404).json({ error: "Usuário não encontrado" });

  res.json({ messages: users[userId].messages || [] });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
