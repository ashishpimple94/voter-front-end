// Vercel Serverless Function for WhatsApp API Proxy
// This avoids CORS issues by making server-side API call
// File: api/whatsapp-send.js (Vercel automatically routes /api/whatsapp-send to this file)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone_number, message, phone_number_id, api_key } = req.body;

    // Validate input
    if (!phone_number || !message || !phone_number_id || !api_key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone_number, message, phone_number_id, api_key'
      });
    }

    // WhatsApp API URL - Official WhatsApp Business API
    // Format: https://waba.xtendonline.com/v3/{phone_number_id}/messages
    const whatsappApiUrl = `https://waba.xtendonline.com/v3/${phone_number_id}/messages`;

    // Prepare payload for WhatsApp API (Official Format)
    // Format: { to, type, text: { body }, messaging_product }
    // Example: { to: "919090385555", type: "text", text: { body: "Message" }, messaging_product: "whatsapp" }
    const payload = {
      messaging_product: 'whatsapp',
      to: phone_number, // Format: 919090385555 (with country code 91)
      type: 'text',
      text: {
        body: message
      }
    };

    // Call WhatsApp API
    const response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': api_key
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    // Check if WhatsApp API returned an error
    if (!response.ok || responseData.error) {
      return res.status(response.status || 400).json({
        success: false,
        error: responseData.error?.message || 'WhatsApp API error',
        message: responseData.error?.message || 'Failed to send WhatsApp message'
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message_id: responseData.messages?.[0]?.id || null,
      phone_number: phone_number,
      data: responseData
    });

  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Failed to send WhatsApp message'
    });
  }
}

