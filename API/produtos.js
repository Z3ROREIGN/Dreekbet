export default function handler(req, res) {
  const produtos = [
    {
      id: 1,
      nome: 'Bot Verificador',
      preco: 49.99,
      descricao: 'Detecta usuários suspeitos e aplica punições automaticamente.',
      zip_url: 'https://seulink.com/botverificador.zip'
    },
    {
      id: 2,
      nome: 'Bot de Vendas',
      preco: 69.99,
      descricao: 'Automatize suas vendas dentro do Discord facilmente.',
      zip_url: 'https://seulink.com/botdevendas.zip'
    }
  ];

  res.status(200).json(produtos);
}

