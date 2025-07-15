import fetch from "node-fetch";

const GUILD_ID = process.env.SEU_GUILD_ID;
const ADMIN_ROLE_ID = process.env.SEU_ADMIN_ROLE_ID;

const planos = {
  "123": { ram: "512 MB", plano: "Carbon" },
  "456": { ram: "1024 MB", plano: "Golden" },
};

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
  const plano = planos[user.id] || { ram: "N/A", plano: "Nenhum" };
  const roles = member.roles.map(r => `<span class="px-2 py-1 bg-gray-700 rounded">${r}</span>`).join(" ");

  if (isAdmin) {
    const todos = Object.entries(planos).map(
      ([uid, p]) => `<tr><td>${uid}</td><td>${p.plano}</td><td>${p.ram}</td></tr>`
    ).join("");
    return res.send(`
<html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-900 text-white p-8">
<h1 class="text-3xl text-indigo-400 mb-4">Painel do Administrador</h1>
<p>Bem-vindo ${user.username}#${user.discriminator}</p>
<table class="table-auto mt-6 w-full text-left">
<thead><tr><th>ID</th><th>Plano</th><th>RAM</th></tr></thead>
<tbody>${todos}</tbody></table>
<a href="/" class="inline-block mt-6 text-indigo-300">Voltar</a>
</body></html>`);
  }

  res.send(`
<html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-900 text-white p-8">
<h1 class="text-3xl text-indigo-400 mb-4">Seu Painel</h1>
<p>Bem-vindo ${user.username}#${user.discriminator}</p>
<p>ID: ${user.id}</p>
<p>RAM: ${plano.ram}</p>
<p>Plano: ${plano.plano}</p>
<div>Cargos: ${roles}</div>
<a href="/" class="inline-block mt-6 text-indigo-300">Voltar</a>
</body></html>`);
}
