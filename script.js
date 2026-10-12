
/* =========================================
   GROQCHAT - FRONTEND & DASHBOARD
   File: script.js

   Backend endpoint yang diharapkan:
   POST /api/chat
   GET  /api/usage

   API key Groq disimpan di backend, bukan di sini.
   ========================================= */

"use strict";

// ==========================================
// 1. KONFIGURASI
// ==========================================

// Jika frontend dan backend berjalan pada server yang sama,
// gunakan URL relatif ini.
// Jika backend berbeda server, ubah menjadi URL backend milik kelompok.
const API_BASE_URL = "";

const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;
const USAGE_ENDPOINT = `${API_BASE_URL}/api/usage`;

// Batas tampilan sementara untuk demo.
// Ganti dengan limit resmi dari backend.
// Nilai null berarti limit belum diketahui.
const DEMO_TOKEN_LIMIT = null;

// Riwayat percakapan untuk sesi browser saat ini.
let conversation = [];
let chartInstance = null;
let isSending = false;

const usage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    totalRequests: 0,
    tokenLimit: DEMO_TOKEN_LIMIT,
    history: []
};

// ==========================================
// 2. AMBIL ELEMEN HTML
// ==========================================

const elements = {
    chatForm: document.getElementById("chatForm"),
    userInput: document.getElementById("userInput"),
    sendBtn: document.getElementById("sendBtn"),
    chatMessages: document.getElementById("chatMessages"),
    clearChatBtn: document.getElementById("clearChatBtn"),
    newChatBtn: document.getElementById("newChatBtn"),

    totalTokens: document.getElementById("totalTokens"),
    inputTokens: document.getElementById("inputTokens"),
    outputTokens: document.getElementById("outputTokens"),
    totalRequests: document.getElementById("totalRequests"),

    tokenUsageText: document.getElementById("tokenUsageText"),
    tokenProgress: document.getElementById("tokenProgress"),
    tokenProgressTrack: document.getElementById("tokenProgressTrack"),
    usagePercentage: document.getElementById("usagePercentage"),
    remainingTokens: document.getElementById("remainingTokens"),
    limitStatus: document.getElementById("limitStatus"),

    connectionStatus: document.getElementById("connectionStatus"),
    modelName: document.getElementById("modelName"),
    tokenChart: document.getElementById("tokenChart"),
    chartMessage: document.getElementById("chartMessage")
};

// ==========================================
// 3. FUNGSI BANTU
// ==========================================

function formatNumber(value) {
    return new Intl.NumberFormat("id-ID").format(
        Math.max(0, Number(value) || 0)
    );
}

function getNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0
        ? number
        : fallback;
}

function setConnectionStatus(message, connected = false) {
    if (!elements.connectionStatus) return;

    elements.connectionStatus.textContent = message;

    const dot = elements.connectionStatus.querySelector(".status-dot");
    if (dot) {
        dot.style.backgroundColor = connected
            ? "#16a36a"
            : "#e9a23b";
    }
}

function scrollChatToBottom() {
    elements.chatMessages.scrollTop =
        elements.chatMessages.scrollHeight;
}

// ==========================================
// 4. MENAMPILKAN PESAN CHAT
// ==========================================

// Gunakan textContent, bukan innerHTML, untuk menampilkan
// pesan pengguna dan jawaban AI sebagai teks yang aman.

function addMessage(role, text, options = {}) {
    const isUser = role === "user";
    const isLoading = options.loading === true;

    const wrapper = document.createElement("div");
    wrapper.className = isUser
        ? "message user-message"
        : "message assistant-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = isUser ? "Kamu" : "AI";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = isUser ? "Kamu" : "GroqChat";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    if (isLoading) {
        paragraph.textContent = "AI sedang menyiapkan jawaban...";
        paragraph.setAttribute("aria-live", "polite");
    }

    content.append(name, paragraph);
    wrapper.append(avatar, content);
    elements.chatMessages.appendChild(wrapper);

    scrollChatToBottom();

    return {
        wrapper,
        paragraph,
        setText(value) {
            paragraph.textContent = value;
        },
        remove() {
            wrapper.remove();
        }
    };
}

function clearMessagesFromScreen() {
    elements.chatMessages.replaceChildren();
}

// ==========================================
// 5. MEMPERBARUI ANGKA DASHBOARD
// ==========================================

function updateDashboard() {
    const total =
        usage.inputTokens + usage.outputTokens;

    usage.totalTokens = total;

    elements.totalTokens.textContent = formatNumber(total);
    elements.inputTokens.textContent =
        formatNumber(usage.inputTokens);
    elements.outputTokens.textContent =
        formatNumber(usage.outputTokens);
    elements.totalRequests.textContent =
        formatNumber(usage.totalRequests);

    updateLimitDisplay();
    updateChart();
}

// ==========================================
// 6. INFORMASI LIMIT
// ==========================================

function updateLimitDisplay() {
    const limit = usage.tokenLimit;
    const total = usage.totalTokens;

    if (limit === null || limit <= 0) {
        elements.tokenUsageText.textContent =
            `${formatNumber(total)} / — token`;

        elements.tokenProgress.style.width = "0%";
        elements.tokenProgressTrack.setAttribute(
            "aria-valuenow", "0"
        );

        elements.usagePercentage.textContent =
            "Limit belum diketahui";
        elements.remainingTokens.textContent =
            "Menunggu data backend";
        elements.limitStatus.textContent =
            "Belum tersedia";

        return;
    }

    const percentage = Math.min(
        100,
        Math.round((total / limit) * 100)
    );

    const remaining = Math.max(0, limit - total);

    elements.tokenUsageText.textContent =
        `${formatNumber(total)} / ${formatNumber(limit)} token`;

    elements.tokenProgress.style.width = `${percentage}%`;
    elements.tokenProgressTrack.setAttribute(
        "aria-valuenow", String(percentage)
    );

    elements.usagePercentage.textContent =
        `${percentage}% terpakai`;

    elements.remainingTokens.textContent =
        `${formatNumber(remaining)} token tersisa`;

    if (percentage >= 100) {
        elements.limitStatus.textContent = "Limit tercapai";
        elements.limitStatus.style.background = "#ffe9e9";
        elements.limitStatus.style.color = "#c92a2a";
        elements.tokenProgress.style.background = "#e5484d";
    } else if (percentage >= 80) {
        elements.limitStatus.textContent = "Hampir mencapai limit";
        elements.limitStatus.style.background = "#fff5df";
        elements.limitStatus.style.color = "#986414";
        elements.tokenProgress.style.background = "#e9a23b";
    } else {
        elements.limitStatus.textContent = "Dalam batas limit";
        elements.limitStatus.style.background = "#e5f8ee";
        elements.limitStatus.style.color = "#137a4c";
        elements.tokenProgress.style.background =
            "linear-gradient(90deg, #817aff, #5548eb)";
    }
}

// ==========================================
// 7. GRAFIK TOKEN MENGGUNAKAN CHART.JS
// ==========================================

function initializeChart() {
    if (!elements.tokenChart || typeof Chart === "undefined") {
        if (elements.chartMessage) {
            elements.chartMessage.textContent =
                "Library grafik belum tersedia. Periksa koneksi internet.";
        }
        return;
    }

    const context = elements.tokenChart.getContext("2d");

    chartInstance = new Chart(context, {
        type: "bar",

        data: {
            labels: ["Input Token", "Output Token"],

            datasets: [{
                label: "Penggunaan Token",
                data: [0, 0],
                backgroundColor: ["#635bff", "#21b981"],
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 75
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label(context) {
                            return ` ${formatNumber(context.raw)} token`;
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    title: {
                        display: true,
                        text: "Jumlah Token"
                    },
                    grid: {
                        color: "#edf0f6"
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!chartInstance) return;

    chartInstance.data.datasets[0].data = [
        usage.inputTokens,
        usage.outputTokens
    ];

    chartInstance.update();

    if (elements.chartMessage) {
        elements.chartMessage.textContent =
            "Grafik menunjukkan akumulasi input dan output token yang tercatat.";
    }
}

// ==========================================
// 8. MENGIRIM PESAN KE BACKEND
// ==========================================

async function sendMessage(message) {
    const cleanMessage = message.trim();

    if (!cleanMessage || isSending) return;

    isSending = true;
    elements.sendBtn.disabled = true;
    elements.userInput.disabled = true;

    addMessage("user", cleanMessage);

    conversation.push({
        role: "user",
        content: cleanMessage
    });

    const loadingMessage = addMessage(
        "assistant",
        "",
        { loading: true }
    );

    setConnectionStatus("Menghubungi backend...");

    try {
        const response = await fetch(CHAT_ENDPOINT, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            // Riwayat dikirim agar AI dapat memahami konteks.
            // Backend harus memvalidasi isi dan panjang riwayat.
            body: JSON.stringify({
                message: cleanMessage,
                messages: conversation
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error || data.message ||
                `Permintaan gagal (HTTP ${response.status})`
            );
        }

        // Kontrak respons backend yang diharapkan:
        // {
        //   "reply": "Jawaban AI",
        //   "usage": {
        //     "prompt_tokens": 20,
        //     "completion_tokens": 50,
        //     "total_tokens": 70
        //   },
        //   "model": "nama-model"
        // }

        const reply =
            data.reply ??
            data.answer ??
            data.content ??
            data.choices?.[0]?.message?.content;

        if (typeof reply !== "string" || !reply.trim()) {
            throw new Error(
                "Jawaban tidak ditemukan. Periksa format respons backend."
            );
        }

        loadingMessage.setText(reply);

        conversation.push({
            role: "assistant",
            content: reply
        });

        // Mengambil penggunaan token dari respons backend.
        // Jangan menebak penggunaan token dari jumlah karakter.
        const tokenData = data.usage || {};

        const input = getNumber(
            tokenData.prompt_tokens ??
            tokenData.input_tokens ??
            tokenData.promptTokens
        );

        const output = getNumber(
            tokenData.completion_tokens ??
            tokenData.output_tokens ??
            tokenData.completionTokens
        );

        const total = getNumber(
            tokenData.total_tokens ??
            tokenData.totalTokens,
            input + output
        );

        usage.inputTokens += input;
        usage.outputTokens += output;
        usage.totalTokens =
            usage.inputTokens + usage.outputTokens;
        usage.totalRequests += 1;

        // Catat penggunaan untuk grafik tren per permintaan.
        usage.history.push({
            request: usage.totalRequests,
            input,
            output,
            total
        });

        if (data.model && elements.modelName) {
            elements.modelName.textContent = data.model;
        }

        setConnectionStatus("Backend terhubung", true);

        updateDashboard();

        // Ambil limit dan penggunaan otoritatif dari backend,
        // jika endpoint tersebut disediakan.
        await refreshUsage();

    } catch (error) {
        loadingMessage.setText(
            `Maaf, pesan gagal diproses.\n${error.message}\n\n` +
            "Pastikan backend berjalan dan endpoint /api/chat benar."
        );

        setConnectionStatus("Koneksi bermasalah");
        console.error("Kesalahan chatbot:", error);

    } finally {
        isSending = false;
        elements.sendBtn.disabled = false;
        elements.userInput.disabled = false;
        elements.userInput.focus();
        scrollChatToBottom();
    }
}

// ==========================================
// 9. MENGAMBIL LIMIT DAN PENGGUNAAN BACKEND
// ==========================================

async function refreshUsage() {
    try {
        const response = await fetch(USAGE_ENDPOINT, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) return;

        const data = await response.json();

        // Contoh respons:
        // {
        //   "inputTokens": 100,
        //   "outputTokens": 200,
        //   "totalTokens": 300,
        //   "totalRequests": 5,
        //   "tokenLimit": 10000
        // }

        const input = data.inputTokens ?? data.input_tokens;
        const output = data.outputTokens ?? data.output_tokens;
        const total = data.totalTokens ?? data.total_tokens;
        const requests = data.totalRequests ?? data.total_requests;
        const limit = data.tokenLimit ?? data.token_limit;

        if (input !== undefined) {
            usage.inputTokens = getNumber(input);
        }

        if (output !== undefined) {
            usage.outputTokens = getNumber(output);
        }

        if (total !== undefined) {
            usage.totalTokens = getNumber(total);
        } else {
            usage.totalTokens =
                usage.inputTokens + usage.outputTokens;
        }

        if (requests !== undefined) {
            usage.totalRequests = getNumber(requests);
        }

        if (limit !== undefined && limit !== null) {
            usage.tokenLimit = getNumber(limit);
        }

        if (data.model && elements.modelName) {
            elements.modelName.textContent = data.model;
        }

        updateDashboard();

    } catch (error) {
        // Endpoint usage boleh belum tersedia saat frontend
        // sedang dikerjakan. Chat tetap bisa berjalan jika
        // endpoint chat tersedia.
        console.info(
            "Data limit belum tersedia dari backend:",
            error.message
        );
    }
}

// ==========================================
// 10. EVENT FORM CHAT
// ==========================================

elements.chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = elements.userInput.value.trim();

    if (!message || isSending) return;

    elements.userInput.value = "";

    await sendMessage(message);
});

// Enter untuk mengirim, Shift + Enter untuk baris baru.
elements.userInput.addEventListener("keydown", (event) => {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();
        elements.chatForm.requestSubmit();
    }
});

// ==========================================
// 11. CHAT BARU DAN HAPUS CHAT
// ==========================================

function startNewChat() {
    if (isSending) return;

    conversation = [];
    clearMessagesFromScreen();

    addMessage(
        "assistant",
        "Halo! Percakapan baru dimulai. Apa yang ingin kamu tanyakan?"
    );

    elements.userInput.value = "";
    elements.userInput.focus();
}

elements.newChatBtn?.addEventListener("click", startNewChat);
elements.clearChatBtn?.addEventListener("click", startNewChat);

// ==========================================
// 12. NAVIGASI SIDEBAR
// ==========================================

document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach((nav) => {
            nav.classList.remove("active");
        });

        item.classList.add("active");
    });
});

// ==========================================
// 13. INISIALISASI APLIKASI
// ==========================================

function initializeApp() {
    initializeChart();
    updateDashboard();

    setConnectionStatus("Memeriksa backend");

    // Memeriksa data limit dari backend.
    refreshUsage();

    console.info("GroqChat frontend berhasil dimuat.");
}

initializeApp();
