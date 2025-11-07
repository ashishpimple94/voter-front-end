# वोटर सर्च एप्लिकेशन - Voter Search Application

यह एक React JS में बनाया गया वोटर सर्च एप्लिकेशन है जो API से वोटर डेटा प्राप्त करता है और उपयोगकर्ताओं को खोजने की सुविधा प्रदान करता है।

## Features (विशेषताएं)

- 🔍 **सर्च फंक्शनैलिटी**: नाम, मतदान कार्ड क्र., मोबाइल नंबर या अनु क्र. से खोजें
- ✏️ **मोबाइल नंबर Edit**: मोबाइल नंबर को inline edit करें और अपडेट करें
- 📊 **वर्गीकरण**: पुरुषों और महिलाओं की संख्या का वर्गीकरण
- 📱 **रिस्पॉन्सिव डिज़ाइन**: मोबाइल और डेस्कटॉप दोनों पर काम करता है
- 🎨 **आधुनिक UI**: सुंदर और आसान इस्तेमाल करने योग्य इंटरफेस

## Installation (स्थापना)

1. Dependencies इंस्टॉल करें:
```bash
npm install
```

2. एप्लिकेशन चलाएं:
```bash
npm start
```

3. ब्राउज़र में खोलें:
```
http://localhost:3000
```

## API

यह एप्लिकेशन निम्नलिखित API का उपयोग करता है:
- `https://xtend.online/Voter/fetch_voter_data.php` - Fetch voter data
- `https://xtend.online/Voter/update_mobile.php` - Update mobile number
- `https://xtend.online/Voter/send_whatsapp.php` - Send WhatsApp message (NEW)

### API Setup

**Mobile number update API:**
1. `api/Voter/update_mobile.php` file को server पर upload करें
2. Database credentials configure करें
3. Detailed setup guide: `api/Voter/README_API_SETUP.md` देखें

**WhatsApp API:**
1. `api/Voter/send_whatsapp.php` file को server पर upload करें
2. WhatsApp Business API credentials configure करें (Meta Cloud API या Twilio)
3. Detailed setup guide: `api/Voter/README_WHATSAPP_API.md` देखें

## Technologies Used

- React 18.2.0
- CSS3 (Modern gradients and animations)
- Fetch API

## Search Options

आप निम्नलिखित तरीकों से खोज सकते हैं:
- नाम (मराठी या इंग्रजी)
- मतदान कार्ड क्र. (EPIC ID)
- मोबाइल नंबर
- अनु क्र. (Serial Number)

## Build for Production

```bash
npm run build
```

## Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

Or connect your GitHub repository directly on [Vercel](https://vercel.com)

### Vercel Configuration

- Framework Preset: Create React App
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

The project includes `vercel.json` with API proxy configuration for CORS handling.

## API Configuration

The app uses Vercel rewrites to proxy API requests:
- `/api/*` → `https://xtend.online/*`

This handles CORS issues in production.

## License

MIT

