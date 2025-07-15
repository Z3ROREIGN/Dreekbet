import fetch from "node-fetch";

const GUILD_ID = process.env.SEU_GUILD_ID;
const ADMIN_ROLE_ID = process.env.SEU_ADMIN_ROLE_ID;

export default async function handler(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) return res.redirect("/");

  const user = JSON.parse(Buffer.from(match[1], "base64").toString());

  const memberRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  const member = await memberRes.json();

  const isAdmin = member.roles.includes(ADMIN_ROLE_ID);

  const planos = [
    { nome: "Carbon", preco: 5, vantagens: ["512MB RAM", "1 Bot", "Suporte básico"] },
    { nome: "Golden", preco: 10, vantagens: ["1GB RAM", "2 Bots", "Suporte prioritário"] },
    { nome: "Platinum", preco: 15, vantagens: ["2GB RAM", "3 Bots", "Suporte VIP"] },
  ];

  const planoCards = planos
    .map(
      (p) => `
      <div class="bg-gray-800 p-4 rounded shadow">
        <h3 class="text-xl text-indigo-300">${p.nome}</h3>
        <p class="text-lg">💸 R$ ${p.preco},00</p>
        <ul class="text-sm mt-2">
          ${p.vantagens.map(v => `<li>✅ ${v}</li>`).join("")}
        </ul>
        <button class="mt-4 bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded">Adquirir</button>
      </div>
      `
    )
    .join("");

  res.send(`
<html>
<head><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-gray-900 text-white p-4">
<header class="flex justify-between items-center mb-6">
  <div class="text-2xl text-indigo-400 font-bold">DreekBet 🌐</div>
  <div class="flex items-center gap-4">
    <span>${user.username}#${user.discriminator}</span>
    <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" class="w-10 h-10 rounded-full">
    <a href="/api/painel" class="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded">Painel</a>
  </div>
</header>

<main class="grid grid-cols-1 md:grid-cols-3 gap-6">
  ${planoCards}
</main>

${isAdmin ? `
<section class="mt-10">
  <h2 class="text-xl text-yellow-400">Administração</h2>
  <p>Aqui você poderá gerenciar os usuários e bots.</p>
  <a href="/api/admin" class="bg-yellow-500 px-3 py-1 rounded mt-4 inline-block">Painel Admin</a>
</section>` : ""}

</body></html>
  `);
}
