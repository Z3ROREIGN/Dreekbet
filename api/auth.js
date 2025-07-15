const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código OAuth não fornecido' });

  try {
    // Trocar código pelo token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'guilds.join identify guilds'); // mesmo scope da URL

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('Erro tokenRes:', errorText);
      return res.status(400).json({ error: 'Falha ao trocar código por token' });
    }

    const tokenData = await tokenRes.json();

    // Pegar dados do usuário
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!userRes.ok) throw new Error('Falha ao buscar dados do usuário');
    const user = await userRes.json();

    // Verificar se é membro do servidor
    let memberRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` }
    });

    // Se não for membro, tenta adicionar usando o access_token do usuário
    if (memberRes.status === 404) {
      const addRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: tokenData.access_token })
      });

      if (!addRes.ok) {
        console.error('Erro ao adicionar usuário ao servidor:', await addRes.text());
        return res.status(403).json({ error: 'Não foi possível adicionar o usuário ao servidor' });
      }

      // Buscar membro novamente após adicionar
      memberRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` }
      });
    }

    if (!memberRes.ok) return res.status(403).json({ error: 'Usuário não pertence ao servidor' });

    const member = await memberRes.json();

    // Verificar se tem cargo admin
    const isAdmin = member.roles.includes(ADMIN_ROLE_ID);

    return res.status(200).json({ user, isAdmin });
  } catch (err) {
    console.error('Erro geral:', err);
    return res.status(500).json({ error: err.message });
  }
}
