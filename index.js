const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- Dados em memória ---
const users = {};   // { id: { email, passwordHash, saldo } }
const sessions = {}; // { sessionId: userId }
const apostas = [];
const saques = [];

// --- Helpers ---
function requireAuth(req, res, next) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  const userId = sessions[sessionId];
  req.user = users[userId];
  req.userId = userId;
  next();
}

// --- Registro ---
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Dados insuficientes' });
  const exists = Object.values(users).find(u => u.email === email);
  if (exists) return res.status(400).json({ error: 'Email já cadastrado' });
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  users[userId] = { email, passwordHash, saldo: 0 };
  res.json({ success: true });
});

// --- Login ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const userEntry = Object.entries(users).find(([id, u]) => u.email === email);
  if (!userEntry) return res.status(400).json({ error: 'Usuário não encontrado' });
  const [userId, user] = userEntry;
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ error: 'Senha incorreta' });
  const sessionId = uuidv4();
  sessions[sessionId] = userId;
  res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true, email: user.email, saldo: user.saldo });
});

// --- Logout ---
app.post('/api/logout', requireAuth, (req, res) => {
  const sessionId = req.cookies.sessionId;
  delete sessions[sessionId];
  res.clearCookie('sessionId');
  res.json({ success: true });
});

// --- Saldo ---
app.get('/api/saldo', requireAuth, (req, res) => {
  res.json({ email: req.user.email, saldo: req.user.saldo });
});

// --- Produtos (fixos para exemplo) ---
const produtos = [
  { id: '1', nome: 'Aposta Simples', preco: 10 },
  { id: '2', nome: 'Aposta Dupla', preco: 20 },
  { id: '3', nome: 'Aposta Tripla', preco: 30 }
];

app.get('/api/produtos', requireAuth, (req, res) => {
  res.json(produtos);
});

// --- Apostas ---
app.post('/api/apostar', requireAuth, (req, res) => {
  const valor = parseFloat(req.body.valor);
  if (!valor || valor <= 0) return res.status(400).json({ error: 'Valor inválido' });
  if (req.user.saldo < valor) return res.status(400).json({ error: 'Saldo insuficiente' });
  req.user.saldo -= valor;
  const ganhou = Math.random() < 0.5;
  if (ganhou) req.user.saldo += valor * 2;
  apostas.push({ userId: req.user.email, valor, resultado: ganhou ? 'Ganhou' : 'Perdeu' });
  res.json({ success: true, ganhou });
});

// --- Pedir saque ---
app.post('/api/saque', requireAuth, (req, res) => {
  const valor = parseFloat(req.body.valor);
  if (!valor || valor <= 0) return res.status(400).json({ error: 'Valor inválido' });
  if (req.user.saldo < valor) return res.status(400).json({ error: 'Saldo insuficiente' });
  const taxa = valor * 0.1;
  const liquido = valor - taxa;
  req.user.saldo -= valor;
  saques.push({ id: uuidv4(), userId: req.user.email, valorBruto: valor, valorLiquido: liquido, status: 'pendente' });
  res.json({ success: true, valorLiquido: liquido });
});

// --- Listar saques ---
app.get('/api/saques', requireAuth, (req, res) => {
  res.json(saques.filter(s => s.userId === req.user.email));
});

// --- Admin middlewares e rotas ---
function requireAdmin(req, res, next) {
  if (req.user.email !== 'admin@dreekbet.com') return res.status(403).json({ error: 'Proibido' });
  next();
}

app.get('/api/admin/usuarios', requireAuth, requireAdmin, (req, res) => {
  res.json(Object.values(users));
});

app.post('/api/admin/alterar-saldo', requireAuth, requireAdmin, (req, res) => {
  const { userId, saldo } = req.body;
  if (!users[userId]) return res.status(400).json({ error: 'Usuário não encontrado' });
  users[userId].saldo = saldo;
  res.json({ success: true });
});

app.get('/api/admin/apostas', requireAuth, requireAdmin, (req, res) => {
  res.json(apostas);
});

app.get('/api/admin/resumo', requireAuth, requireAdmin, (req, res) => {
  const totalArrecadado = apostas.reduce((a,c)=>a+c.valor,0);
  const totalPago = saques.filter(s=>s.status==='pago').reduce((a,c)=>a+c.valorLiquido,0);
  const pendente = saques.filter(s=>s.status==='pendente').reduce((a,c)=>a+c.valorLiquido,0);
  res.json({ totalArrecadado, totalPago, pendente });
});

app.post('/api/saques/:id/pago', requireAuth, requireAdmin, (req, res) => {
  const saque = saques.find(s => s.id === req.params.id);
  if (!saque) return res.status(404).json({ error: 'Saque não encontrado' });
  saque.status = 'pago';
  res.json({ success: true });
});

// --- Server listen ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
         
