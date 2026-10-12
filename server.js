
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");
const path = require("path");

// Memuat backend/.env secara eksplisit
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const TOKEN_LIMIT = Number(process.env.TOKEN_LIMIT) || 10000;
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY belum diisi di backend/.env");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "20kb" }));

// Menampilkan frontend jika file tersedia
app.use(express.static(path.join(__dirname, "../frontend")));

let usedTokens = 0;
const tokenHistory = [];

const SYSTEM_PROMPT = `
Kamu adalah asisten AI untuk membantu pengguna belajar.
Jawab dalam bahasa Indonesia yang jelas, sopan, dan terstruktur.
Jika menjelaskan prosedur, gunakan langkah bernomor.
Jangan mengarang fakta atau sumber.
Jika tidak mengetahui jawaban, katakan dengan jujur.
`;

function getUsage() {
  return {
    maxTokens: TOKEN_LIMIT,
    usedTokens,
    remainingTokens: Math.max(0, TOKEN_LIMIT - usedTokens),
    usagePercent: Math.min(100, (usedTokens / TOKEN_LIMIT) * 100),
    history: tokenHistory
  };
}

// Memeriksa backend
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend chatbot aktif",
    model: MODEL
  });
});

// Statistik token untuk dashboard
app.get("/api/usage", (req, res) => {
  res.json(getUsage());
});

// Mengirim pertanyaan ke Groq
app.post("/api/chat", async (req, res) => {
  const question =
    typeof req.body?.message === "string"
      ? req.body.message.trim()
      : "";

  if (!question) {
    return res.status(400).json({
      error: "Pertanyaan tidak boleh kosong."
    });
  }

  if (question.length > 10000) {
    return res.status(400).json({
      error: "Pertanyaan maksimal 10.000 karakter."
    });
  }

  if (usedTokens >= TOKEN_LIMIT) {
    return res.status(429).json({
      error: "Limit token aplikasi sudah tercapai.",
      limit: getUsage()
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question }
      ],
      max_completion_tokens: 2048,
      temperature: 0.7
    });

    const answer =
      completion.choices?.[0]?.message?.content || "";

    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;
    const totalTokens =
      completion.usage?.total_tokens ??
      inputTokens + outputTokens;

    // Simpan penggunaan token dari respons Groq
    usedTokens += totalTokens;

    const record = {
      time: new Date().toISOString(),
      inputTokens,
      outputTokens,
      totalTokens,
      usedTokens
    };

    tokenHistory.push(record);

    return res.json({
      answer,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens
      },
      limit: getUsage()
    });
  } catch (error) {
    // Detail error dicatat di terminal, bukan dikirim ke pengguna
    console.error("=== GROQ API ERROR ===");
    console.error("Status:", error.status || "Tidak tersedia");
    console.error("Pesan:", error.message || "Kesalahan tidak diketahui");

    if (error.status === 401) {
      return res.status(502).json({
        error: "Autentikasi Groq gagal. Periksa API Key di backend/.env."
      });
    }

    if (error.status === 429) {
      return res.status(502).json({
        error: "Permintaan ke Groq dibatasi. Periksa rate limit atau kuota API."
      });
    }

    return res.status(502).json({
      error: "Groq gagal memproses permintaan. Periksa error di terminal backend."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend aktif: http://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`API Key terbaca: ${Boolean(process.env.GROQ_API_KEY)}`);
});
