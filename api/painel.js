import fetch from "node-fetch";

const GUILD_ID = "SEU_GUILD_ID";
const ADMIN_ROLE_ID = "SEU_ADMIN_ROLE_ID";

// Demo: "banco de dados" fake
const planos = {
  "1234567890": { ram: "512 MB", plano: "Carbon" },
  "0987654321": { ram: "1024 MB", plano: "Golden" }
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

  if (isAdmin) {
    return res.send(`
      <h1>Painel do Administrador</h1>
      <p>Bem-vindo ${user.username}#${user.discriminator}</p>
      <h2>Usuários e Planos</h2>
      <pre>${JSON.stringify(planos, null, 2)}</pre>
      <a href="/">Voltar</a>
    `);
  }

  const plano = planos[user.id] || { ram: "N/A", plano: "Nenhum" };
  const roles = member.roles.map(r => `<li>${r}</li>`).join("");

  res.send(`
    <h1>Seu Painel</h1>
    <p>Bem-vindo ${user.username}#${user.discriminator}</p>
    <h2>Seu Perfil</h2>
    <ul>
      <li>ID: ${user.id}</li>
      <li>RAM: ${plano.ram}</li>
      <li>Plano: ${plano.plano}</li>
      <li>Cargos:</li>
      <ul>${roles}</ul>
    </ul>
    <a href="/">Voltar</a>
  `);
}
