import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Variáveis de ambiente obrigatórias
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // ex: https://dreekbet.shop
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN; // seu token de bot para consultar cargos e interagir com Discloud
const DISCLOUD_API_KEY = process.env.DISCLOUD_API_KEY; // API key da Discloud para hospedar bots
const GUILD_ID = process.env.DISCORD_GUILD_ID; // ID do seu servidor Discord onde verifica cargos
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID; // ID do cargo que libera admin no painel

// Armazena dados em memória simples (para testar, no real precisa banco de dados)
const userBotMap = new Map(); // userId -> { botId, paymentStatus, ... }
const supportChats = new Map(); // userId -> [{from, message, timestamp}]

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

    // Pega dados do usuário
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Verifica se usuário tem cargo admin no servidor
    const isAdmin = await checkUserAdmin(userData.id);

    res.json({ ...userData, isAdmin });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor" });
  }
});

async function checkUserAdmin(userId) {
  try {
    const res = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) return false;
    const memberData = await res.json();
    return memberData.roles.includes(ADMIN_ROLE_ID);
  } catch {
    return false;
  }
}

// Rota que retorna os bots do usuário (só o bot dele)
app.get("/bots/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userBotMap.has(userId))
    return res.json({ bots: [] });

  const botData = userBotMap.get(userId);
  res.json({ bots: [botData] });
});

// Hospedar bot (só 1 por usuário e precisa pagamento liberado)
app.post("/bots/:userId/host", async (req, res) => {
  const { userId } = req.params;
  // Verifique se tem pagamento válido — aqui só simulo
  const botExist = userBotMap.has(userId);
  if (botExist) return res.status(400).json({ error: "Você já tem um bot hospedado." });

  // TODO: Receber o .zip do bot e enviar para Discloud via API (aqui é só simulação)
  // Exemplo: 
  // const botName = req.body.name;
  // const zipFileBase64 = req.body.zip;
  // ... enviar para Discloud com a API Key ...

  // Simula criação bot
  const botId = `bot_${Date.now()}`;
  const botData = {
    id: botId,
    name: "Meu Bot",
    status: "offline",
    ramUsage: null,
    paymentStatus: true,
  };
  userBotMap.set(userId, botData);
  res.json({ success: true, bot: botData });
});

// Iniciar bot
app.post("/bots/:botId/start", async (req, res) => {
  const botId = req.params.botId;
  const botEntry = [...userBotMap.values()].find(b => b.id === botId);
  if (!botEntry) return res.status(404).json({ error: "Bot não encontrado" });

  // Aqui você deve chamar API da Discloud para iniciar o bot (exemplo)
  // Simulando:
  botEntry.status = "online";
  botEntry.ramUsage = "45MB";
  res.json({ success: true });
});

// Parar bot
app.post("/bots/:botId/stop", async (req, res) => {
  const botId = req.params.botId;
  const botEntry = [...userBotMap.values()].find(b => b.id === botId);
  if (!botEntry) return res.status(404).json({ error: "Bot não encontrado" });

  // Simule parada do bot
  botEntry.status = "offline";
  botEntry.ramUsage = null;
  res.json({ success: true });
});

// Remover bot
app.delete("/bots/:botId", (req, res) => {
  const botId = req.params.botId;
  for (const [userId, botData] of userBotMap.entries()) {
    if (botData.id === botId) {
      userBotMap.delete(userId);
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: "Bot não encontrado" });
});

// Chat suporte - obter mensagens
app.get("/support/:userId", (req, res) => {
  const { userId } = req.params;
  const msgs = supportChats.get(userId) || [];
  res.json({ messages: msgs });
});

// Chat suporte - enviar mensagem
app.post("/support/:userId", (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Mensagem é obrigatória" });

  const msgs = supportChats.get(userId) || [];
  msgs.push({ from: "Cliente", message, timestamp: Date.now() });
  supportChats.set(userId, msgs);

  // Aqui você poderia enviar notificação para admin via Discord, webhook etc (não incluído)

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
