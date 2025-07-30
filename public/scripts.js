let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

function adicionarAoCarrinho(id, nome, preco, zipUrl) {
  const itemIndex = carrinho.findIndex(i => i.id === id);
  if (itemIndex > -1) {
    carrinho[itemIndex].quantidade++;
  } else {
    carrinho.push({ id, nome, preco, zipUrl, quantidade: 1 });
  }
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  alert(`Adicionado "${nome}" ao carrinho!`);
  atualizarCarrinhoVisual();
}

function atualizarCarrinhoVisual() {
  const div = document.getElementById('itens-carrinho');
  if (!div) return;
  div.innerHTML = '';
  if (carrinho.length === 0) {
    div.innerHTML = '<p>Seu carrinho está vazio.</p>';
    return;
  }
  let total = 0;
  const ul = document.createElement('ul');
  carrinho.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.nome} x${item.quantidade} - R$ ${(item.preco * item.quantidade).toFixed(2)}`;
    ul.appendChild(li);
    total += item.preco * item.quantidade;
  });
  div.appendChild(ul);
  const pTotal = document.createElement('p');
  pTotal.textContent = `Total: R$ ${total.toFixed(2)}`;
  div.appendChild(pTotal);
}

function limparCarrinho() {
  carrinho = [];
  localStorage.removeItem('carrinho');
  atualizarCarrinhoVisual();
}

async function finalizarCompra() {
  const tokenData = JSON.parse(localStorage.getItem('discord_auth'));
  if (!tokenData || !tokenData.user) {
    alert('Você precisa fazer login via Discord antes de finalizar a compra.');
    return;
  }

  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio.');
    return;
  }

  const pedidos = carrinho.map(item => ({
    botZipUrl: item.zipUrl,
    userId: tokenData.user.id,
    productName: item.nome,
  }));

  for (const pedido of pedidos) {
    const res = await fetch('/api/hospedar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(`Erro ao hospedar ${pedido.productName}: ${data.error}`);
      return;
    }
  }

  alert('Todos os bots foram hospedados com sucesso! Confira seu Discord.');
  limparCarrinho();
}

function salvarAuth(discordUser, accessToken) {
  localStorage.setItem('discord_auth', JSON.stringify({ user: discordUser, accessToken }));
}

async function loginDiscord() {
  const code = new URLSearchParams(window.location.search).get('code');
  if (code) {
    const res = await fetch(`/api/auth?code=${code}`);
    const data = await res.json();
    if (data.user) {
      salvarAuth(data.user, data.access_token);
      alert(`Bem-vindo, ${data.user.username}!`);
      window.location.href = 'index.html';
    } else
      
