import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db.js';

const router = Router();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * POST /api/ai/assistant
 * Grounded AI Shopping Assistant for AKASH STORE
 */
router.post('/assistant', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Gather fresh catalog & policy context
  const products = db.getProducts().filter(p => p.status === 'ACTIVE');
  const settings = db.getSettings();

  const catalogContext = products.map(p => ({
    name: p.name,
    category: p.category,
    price: `৳${p.price.toLocaleString()}`,
    stock: p.stock > 0 ? `${p.stock} available` : 'Out of stock',
    specs: p.specifications,
    tags: p.tags,
  }));

  const systemInstruction = `
You are the official AI Shopping Assistant for "AKASH STORE", a premier Bangladesh e-commerce platform.
Owner: ${settings.ownerName}
Headquarters: ${settings.headquarters}
Contact: ${settings.contactEmail}
Official bKash Receiving Number: ${settings.bkashNumber}
Delivery Fees: Inside Dhaka ৳${settings.insideDhakaFee}, Outside Dhaka ৳${settings.outsideDhakaFee}. Free delivery on orders over ৳${settings.freeDeliveryThreshold}.

CRITICAL RULES:
1. ONLY recommend real products from the catalog below. Never invent products, prices, or fake stock.
2. Prices must strictly match catalog values in BDT (৳).
3. If an order status or payment is queried, politely remind the customer to check the "Track Order" page with their Order ID (e.g. AKS-...) and never confirm payment completion manually.
4. Keep answers friendly, professional, concise, and helpful.

CURRENT AVAILABLE CATALOG:
${JSON.stringify(catalogContext, null, 2)}
`;

  try {
    const ai = getAiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nCustomer question: ${message}` }] },
        ],
      });

      const reply = response.text || 'I am here to help you find products at AKASH STORE!';
      return res.json({ reply });
    }
  } catch (err) {
    console.warn('Gemini API call failed or not configured, using smart rule-based fallback', err);
  }

  // Smart intelligent fallback if API key is not configured
  const q = message.toLowerCase();
  let fallbackReply = `Welcome to AKASH STORE! We are headquartered in ${settings.headquarters}. `;

  if (q.includes('bkash') || q.includes('payment') || q.includes('pay') || q.includes('nagad')) {
    fallbackReply += `For online payments, our official bKash receiving number is ${settings.bkashNumber}. We also offer Cash on Delivery across Bangladesh. Delivery is ৳${settings.insideDhakaFee} in Dhaka and ৳${settings.outsideDhakaFee} outside Dhaka (Free over ৳${settings.freeDeliveryThreshold}).`;
  } else if (q.includes('track') || q.includes('order')) {
    fallbackReply += `You can track your order status in real time by clicking the "Track Order" button in the top navigation and entering your Order ID (e.g. AKS-20260902-000101) or registered phone number.`;
  } else if (q.includes('phone') || q.includes('samsung') || q.includes('mobile')) {
    const p = products.find(prod => prod.category === 'Electronics');
    fallbackReply += p 
      ? `We have the ${p.name} for ${p.price.toLocaleString()} BDT in stock. Would you like to check out its full specifications?`
      : `We offer certified electronic devices with official warranty. Browse our Electronics section for more details.`;
  } else if (q.includes('headphone') || q.includes('sony') || q.includes('audio')) {
    fallbackReply += `Check out our Sony WH-1000XM5 Wireless Noise-Cancelling Headphones (৳36,500) featuring industry-leading ANC and 30-hour battery life.`;
  } else if (q.includes('honey') || q.includes('grocery') || q.includes('sundarban')) {
    fallbackReply += `Our 100% natural, unfiltered raw wild Sundarban Honey starts at ৳850 for a 500g glass jar.`;
  } else {
    fallbackReply += `We have a wide range of Electronics, Fashion, Gadgets, Beauty, and Groceries. How can I help you discover the perfect item today?`;
  }

  return res.json({ reply: fallbackReply });
});

export default router;
