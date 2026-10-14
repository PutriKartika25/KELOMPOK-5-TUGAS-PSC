import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import cors from 'cors';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const tokenLimit = Number(process.env.TOKEN_LIMIT) || 10000;

app.use(cors());
app.use(express.json());

if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY belum diisi di file .env.');
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

let globalUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalRequests: 0,
  tokenLimit,
  model
};

app.post('/api/chat', async (req, res) => {
  console.log("-> Menerima permintaan POST di /api/chat dengan body:", req.body);

  try {
    const message = typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : '';

    if (!message) {
      return res.status(400).json({ error: "Pesan (message) tidak boleh kosong." });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model,
    });

    const replyText = chatCompletion.choices?.[0]?.message?.content;

    if (typeof replyText !== 'string' || !replyText.trim()) {
      throw new Error("Groq API tidak mengembalikan teks jawaban.");
    }

    const usageData = chatCompletion.usage || {};
    const promptTokens = usageData.prompt_tokens || 0;
    const completionTokens = usageData.completion_tokens || 0;
    const totalTokens = usageData.total_tokens || (promptTokens + completionTokens);

    globalUsage.inputTokens += promptTokens;
    globalUsage.outputTokens += completionTokens;
    globalUsage.totalTokens = globalUsage.inputTokens + globalUsage.outputTokens;
    globalUsage.totalRequests += 1;

    return res.json({
      reply: replyText,
      model,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens
      }
    });

  } catch (error) {
    console.error("=== DETAIL ERROR GROQ ===", error);
    return res.status(502).json({
      error: "Groq gagal memproses permintaan.",
      detail: error.message
    });
  }
});

app.get('/api/usage', (req, res) => {
  res.json(globalUsage);
});

app.listen(port, () => {
  console.log(`Backend aktif: http://localhost:${port}`);
  console.log(`Model: ${model}`);
  console.log(`API Key terbaca: ${!!process.env.GROQ_API_KEY}`);
});