import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

const DATA_FILE = path.resolve("./data.json");

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCLOUD_API_KEY = process.env.DISCLOUD_API_KEY;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID;

if (
  !CLIENT_ID ||
  !CLIENT_SECRET ||
  !REDIRECT_URI ||
  !BOT_TOKEN ||
  !DISCLOUD_API_KEY ||
  !GUILD_ID ||
  !ADMIN_ROLE_ID
) {
  console.error("⚠️ Faltam variáveis de ambiente obrigatórias!");
  process.exit(1);
}

let data = {
  users: {}, // userId: { bot, paymentDone, approved, supportMessages, requestedHost }
};

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE);
    data = JSON.parse(raw);
  }
} catch (e) {
  console.error("Erro ao ler data.json:", e);
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function checkUserAdmin(userId) {
  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );
    if (!res.ok) return false;
    const memberData = await res.json();
    return memberData.roles.includes(ADMIN_ROLE_ID);
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

    const isAdmin = await checkUserAdmin(userData.id);

    res.json({ ...userData, isAdmin });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor" });
  }
});

app.get("/bots/:userId", (req, res) => {
  const userId = req.params.userId;
  const user = data.users[userId];
  if (!user || !user.bot) return res.json({ bots: [] });
  res.json({ bots: [user.bot] });
});

app.post("/bots/:userId/request-host", (req, res) => {
  const userId = req.params.userId;
  let user = data.users[userId] || { supportMessages: [] };

  if (user.bot) {
    return res.status(400).json({ error: "Você já tem um bot hospedado." });
  }
  if (user.paymentDone !== true) {
    return res
      .status(400)
      .json({
        error:
          "Pagamento não confirmado. Faça o pagamento via PIX e envie mensagem no suporte.",
      });
  }

  user.requestedHost = true;
  data.users[userId] = user;
  saveData();

  res.json({
    success: true,
    message: "Solicitação de hospedagem enviada, aguarde aprovação no chat.",
  });
});

// Upload bot e criar no Discloud
app.post(
  "/bots/:userId/upload",
  upload.single("botzip"),
  async (req, res) => {
    const userId = req.params.userId;
    const user = data.users[userId] || { supportMessages: [] };

    if (!user.requestedHost) {
      return res.status(400).json({
        error: "Você precisa solicitar hospedagem antes de enviar o bot.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo .zip do bot é obrigatório." });
    }

    // Aqui você pode validar o zip, mas vamos assumir que o usuário mandou o zip correto

    // Vamos simular criação do bot na Discloud com a API Key

    try {
      // Enviar para Discloud API (exemplo simples)
      const formData = new FormData();

      // Forçar criação do discloud.config.json com python
      // Normalmente precisaria editar o zip antes de enviar, mas aqui simulamos

      // Como não tem acesso a manipulação do zip no backend sem libs extras (não indicadas na Vercel),
      // assumiremos que o usuário envia o zip correto com o bot.py e faremos um upload simples.

      // POST para https://api.discloudbot.com/bot
      // com headers: Authorization: Bearer DISCLOUD_API_KEY
      // fields: file (arquivo zip), config.json opcional

      // Como node-fetch não suporta FormData nativo, precisa do pacote form-data
      // para simplificar vou mandar só código base aqui, você pode adaptar

      res.status(200).json({
        success: true,
        message:
          "Bot recebido! O upload real para Discloud precisa ser implementado na sua infra.",
      });
    } catch (err) {
      res.status(500).json({ error: "Erro ao enviar para Discloud." });
    }
  }
);

app.post("/admin/approve-host/:userId", async (req, res) => {
  const adminId = req.headers["x-admin-id"];
  if (!adminId) return res.status(401).json({ error: "Sem autenticação de admin" });
  const isAdmin = await checkUserAdmin(adminId);
  if (!isAdmin) return res.status(403).json({ error: "Acesso negado" });

  const userId = req.params.userId;
  const user = data.users[userId];
  if (!user || !user.requestedHost)
    return res.status(400).json({ error: "Solicitação não encontrada" });

  user.bot = {
    id: `bot_${Date.now()}`,
    name: `BotDeUsuario_${userId}`,
    status: "offline",
    ramUsage: null,
    approved: true,
  };
  user.requestedHost = false;
  user.approved = true;

  saveData();

  res.json({ success: true, message: "Hospedagem aprovada e bot criado." });
});

app.post("/bots/:botId/start", (req, res) => {
  const botId = req.params.botId;
  let botUser = null;
  for (const uid in data.users) {
    if (data.users[uid].bot && data.users[uid].bot.id === botId) {
      botUser = data.users[uid];
      break;
    }
  }
  if (!botUser) return res.status(404).json({ error: "Bot não encontrado" });
  if (!botUser.approved) return res.status(403).json({ error: "Bot não aprovado" });
  botUser.bot.status = "online";
  saveData();
  res.json({ success: true });
});

app.post("/bots/:botId/stop", (req, res) => {
  const botId = req.params.botId;
  let botUser = null;
  for (const uid in data.users) {
    if (data.users[uid].bot && data.users[uid].bot.id === botId) {
      botUser = data.users[uid];
      break;
    }
  }
  if (!botUser) return res.status(404).json({ error: "Bot não encontrado" });
  botUser.bot.status = "offline";
  saveData();
  res.json({ success: true });
});

app.delete("/bots/:botId", (req, res) => {
  const botId = req.params.botId;
  for (const uid in data.users) {
    if (data.users[uid].bot && data.users[uid].bot.id === botId) {
      delete data.users[uid].bot;
      delete data.users[uid].approved;
      delete data.users[uid].requestedHost;
      saveData();
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: "Bot não encontrado" });
});

app.post("/admin/confirm-payment/:userId", async (req, res) => {
  const adminId = req.headers["x-admin-id"];
  if (!adminId) return res.status(401).json({ error: "Sem autenticação de admin" });
  const isAdmin = await checkUserAdmin(adminId);
  if (!isAdmin) return res.status(403).json({ error: "Acesso negado" });

  const userId = req.params.userId;
  const user = data.users[userId] || {};
  user.paymentDone = true;
  data.users[userId] = user;
  saveData();

  res.json({ success: true, message: "Pagamento confirmado." });
});

app.get("/support/:userId", (req, res) => {
  const userId = req.params.userId;
  const user = data.users[userId] || { supportMessages: [] };
  res.json({ messages: user.supportMessages || [] });
});

app.post("/support/:userId", (req, res) => {
  const userId = req.params.userId;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Mensagem é obrigatória" });

  const user = data.users[userId] || { supportMessages: [] };
  const timestamp = Date.now();

  user.supportMessages = user.supportMessages || [];
  user.supportMessages.push({ from: "User", message, timestamp });

  // Aqui poderia mandar notificação para admins (Discord webhook/email) - opcional

  data.users[userId] = user;
  saveData();

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
