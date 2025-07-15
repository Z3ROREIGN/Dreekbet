const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, json: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, json: null, text };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método não permitido, use POST' });

  const { code } = req.body;
  if (!code)
    return res.status(400).json({ error: 'Código OAuth2 não fornecido' });

  try {
    // Troca código por token
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      scope: 'guilds.join identify guilds',
    });

    const tokenResponse = await fetchJSON('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!tokenResponse.ok) {
      console.error('Erro token:', tokenResponse.status, tokenResponse.text);
      return res.status(400).json({ error: 'Falha ao trocar código por token' });
    }

    const tokenData = tokenResponse.json;

    // Busca dados do usuário
    const userResponse = await fetchJSON('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Erro user:', userResponse.status, userResponse.text);
      return res.status(400).json({ error: 'Falha ao buscar dados do usuário' });
    }

    const user = userResponse.json;

    // Verifica se é membro do servidor
    let memberResponse = await fetchJSON(
      `https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (memberResponse.status === 404) {
      // Tenta adicionar
      const addMemberResponse = await fetchJSON(
        `https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: tokenData.access_token }),
        }
      );

      if (!addMemberResponse.ok) {
        console.error('Erro ao adicionar membro:', addMemberResponse.status, addMemberResponse.text);
        return res.status(403).json({ error: 'Não foi possível adicionar o usuário ao servidor. Por favor, entre manualmente.' });
      }

      // Buscar de novo
      memberResponse = await fetchJSON(
        `https://discord.com/api/guilds/${GUILD_ID}/members/${user.id}`,
        { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
      );

      if (!memberResponse.ok) {
        console.error('Erro após adicionar membro:', memberResponse.status, memberResponse.text);
        return res.status(403).json({ error: 'Usuário não pertence ao servidor mesmo após tentar adicionar' });
      }
    }

    if (!memberResponse.ok) {
      return res.status(403).json({ error: 'Usuário não pertence ao servidor' });
    }

    const member = memberResponse.json;

    // Verifica se tem cargo admin
    const isAdmin = Array.isArray(member.roles) && member.roles.includes(ADMIN_ROLE_ID);

    return res.status(200).json({ user, isAdmin });
  } catch (err) {
    console.error('Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
