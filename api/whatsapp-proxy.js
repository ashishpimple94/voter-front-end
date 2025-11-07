// Simple Express proxy for development (if Vercel dev is not available)
// This is a fallback solution for local development

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/api/whatsapp-send', async (req, res) => {
  try {
    const { phone_number, message, phone_number_id, api_key } = req.body;

    if (!phone_number || !message || !phone_number_id || !api_key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const whatsappApiUrl = `https://waba.xtendonline.com/v3/${phone_number_id}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phone_number,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await axios.post(whatsappApiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': api_key
      }
    });

    res.json({
      success: true,
      message_id: response.data.messages?.[0]?.id || null,
      phone_number: phone_number,
      data: response.data
    });

  } catch (error) {
    console.error('WhatsApp API Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: error.response?.data?.error?.message || 'WhatsApp API error'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WhatsApp Proxy running on http://localhost:${PORT}`);
});


