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

const API_BASE_URL = "http://localhost:3003";

const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;
const USAGE_ENDPOINT = `${API_BASE_URL}/api/usage`;
const CHAT_HISTORY_STORAGE_KEY = "groqchat-history-v1";

const DEMO_TOKEN_LIMIT = null;

let conversation = [];
let chatHistories = [];
let activeChatId = null;
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
    chatHistoryList: document.getElementById("chatHistoryList"),
    chatHistoryEmpty: document.getElementById("chatHistoryEmpty"),
    chatHistoryStatus: document.getElementById("chatHistoryStatus"),

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

function loadChatHistories() {
    try {
        const savedHistories = JSON.parse(
            localStorage.getItem(CHAT_HISTORY_STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(savedHistories)) {
            throw new Error("Format data riwayat chat tidak valid.");
        }

        return savedHistories.filter(chat =>
            chat &&
            typeof chat.id === "string" &&
            typeof chat.title === "string" &&
            Array.isArray(chat.messages)
        ).map(chat => ({
            ...chat,
            messages: chat.messages.filter(message =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string"
            )
        }));
    } catch (error) {
        showChatHistoryError("Riwayat chat tidak dapat dimuat.");
        console.error("Gagal memuat riwayat chat:", error);
        return [];
    }
}

function showChatHistoryError(message) {
    elements.chatHistoryStatus.textContent = message;
    elements.chatHistoryStatus.hidden = false;
}

function saveChatHistories() {
    renderChatHistory();
    try {
        localStorage.setItem(
            CHAT_HISTORY_STORAGE_KEY,
            JSON.stringify(chatHistories)
        );
        elements.chatHistoryStatus.textContent = "";
        elements.chatHistoryStatus.hidden = true;
    } catch (error) {
        showChatHistoryError("Riwayat chat gagal disimpan di browser.");
        console.error("Gagal menyimpan riwayat chat:", error);
    }
}

function createChatId() {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getChatTitle(message) {
    const title = message.trim();
    return title.length > 36 ? `${title.slice(0, 36)}...` : title;
}

function renderChatHistory() {
    elements.chatHistoryList.replaceChildren();
    elements.chatHistoryEmpty.hidden = chatHistories.length > 0;

    chatHistories.forEach(chat => {
        const item = document.createElement("div");
        item.className = "chat-history-item";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "chat-history-open";
        openButton.classList.toggle("active", chat.id === activeChatId);
        openButton.textContent = chat.title;
        openButton.title = chat.title;
        openButton.addEventListener("click", () => openChat(chat.id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "chat-history-delete";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", `Hapus riwayat ${chat.title}`);
        deleteButton.addEventListener("click", () => deleteChat(chat.id));

        item.append(openButton, deleteButton);
        elements.chatHistoryList.appendChild(item);
    });
}

function ensureActiveChat(firstMessage) {
    let chat = chatHistories.find(item => item.id === activeChatId);

    if (!chat) {
        chat = {
            id: createChatId(),
            title: getChatTitle(firstMessage),
            updatedAt: new Date().toISOString(),
            messages: []
        };
        chatHistories.unshift(chat);
        activeChatId = chat.id;
    }

    return chat;
}

function moveChatToFront(chat) {
    chat.updatedAt = new Date().toISOString();
    chatHistories = [
        chat,
        ...chatHistories.filter(item => item.id !== chat.id)
    ];
}

function openChat(chatId) {
    if (isSending) return;

    const chat = chatHistories.find(item => item.id === chatId);
    if (!chat) return;

    activeChatId = chat.id;
    conversation = chat.messages.map(message => ({ ...message }));
    clearMessagesFromScreen();
    chat.messages.forEach(message => addMessage(message.role, message.content));
    elements.userInput.value = "";
    renderChatHistory();
}

function deleteChat(chatId) {
    if (isSending) return;

    chatHistories = chatHistories.filter(chat => chat.id !== chatId);
    if (activeChatId === chatId) {
        activeChatId = null;
        conversation = [];
        clearMessagesFromScreen();
        addMessage(
            "assistant",
            "Halo! Saya asisten AI. Silakan tuliskan pertanyaanmu di kolom pesan untuk memulai percakapan."
        );
    }
    saveChatHistories();
}

// ==========================================
// 5. MEMPERBARUI ANGKA DASHBOARD
// ==========================================

function updateDashboard() {
    const total = usage.inputTokens + usage.outputTokens;
    usage.totalTokens = total;

    elements.totalTokens.textContent = formatNumber(total);
    elements.inputTokens.textContent = formatNumber(usage.inputTokens);
    elements.outputTokens.textContent = formatNumber(usage.outputTokens);
    elements.totalRequests.textContent = formatNumber(usage.totalRequests);

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
        elements.tokenUsageText.textContent = `${formatNumber(total)} / — token`;
        elements.tokenProgress.style.width = "0%";
        elements.tokenProgressTrack.setAttribute("aria-valuenow", "0");
        elements.usagePercentage.textContent = "Limit belum diketahui";
        elements.remainingTokens.textContent = "Menunggu data backend";
        elements.limitStatus.textContent = "Belum tersedia";
        return;
    }

    const percentage = Math.min(100, Math.round((total / limit) * 100));
    const remaining = Math.max(0, limit - total);

    elements.tokenUsageText.textContent = `${formatNumber(total)} / ${formatNumber(limit)} token`;
    elements.tokenProgress.style.width = `${percentage}%`;
    elements.tokenProgressTrack.setAttribute("aria-valuenow", String(percentage));
    elements.usagePercentage.textContent = `${percentage}% terpakai`;
    elements.remainingTokens.textContent = `${formatNumber(remaining)} token tersisa`;

    if (percentage >= 100) {
        elements.limitStatus.textContent = "Limit tercapai";
    } else if (percentage >= 80) {
        elements.limitStatus.textContent = "Hampir mencapai limit";
    } else {
        elements.limitStatus.textContent = "Dalam batas limit";
    }
}

// ==========================================
// 7. GRAFIK TOKEN MENGGUNAKAN CHART.JS
// ==========================================

function initializeChart() {
    if (!elements.tokenChart || typeof Chart === "undefined") {
        if (elements.chartMessage) {
            elements.chartMessage.textContent = "Library grafik belum tersedia.";
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
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
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
    const activeChat = ensureActiveChat(cleanMessage);
    activeChat.messages.push({ role: "user", content: cleanMessage });
    moveChatToFront(activeChat);
    saveChatHistories();

    const loadingMessage = addMessage("assistant", "", { loading: true });

    setConnectionStatus("Menghubungi backend...");

    try {
        const response = await fetch(CHAT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: cleanMessage,
                messages: conversation
            })
        });

        const responseText = await response.text();
        let data;

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            if (!response.ok) {
                throw new Error(`Permintaan gagal (HTTP ${response.status})`);
            }

            throw new Error(
                "Backend tidak mengirim JSON. Pastikan server Node.js berjalan di http://localhost:3003."
            );
        }

        console.log("DATA DARI BACKEND:", data);

        if (!response.ok) {
            const message = data.detail
                ? `${data.error || "Permintaan gagal"} ${data.detail}`
                : data.error || `Permintaan gagal (HTTP ${response.status})`;
            throw new Error(message);
        }

        const reply = [data.reply, data.answer, data.content, data.message]
            .find(value => typeof value === "string" && value.trim());

        if (!reply) {
            throw new Error(
                "Backend tidak mengirim teks jawaban. Periksa log server Node.js."
            );
        }

        loadingMessage.setText(reply);

        conversation.push({
            role: "assistant",
            content: reply
        });
        activeChat.messages.push({ role: "assistant", content: reply });
        moveChatToFront(activeChat);
        saveChatHistories();

        const tokenData = data.usage || {};
        const input = getNumber(tokenData.prompt_tokens ?? tokenData.input_tokens);
        const output = getNumber(tokenData.completion_tokens ?? tokenData.output_tokens);
        const total = getNumber(tokenData.total_tokens, input + output);

        usage.inputTokens += input;
        usage.outputTokens += output;
        usage.totalTokens = usage.inputTokens + usage.outputTokens;
        usage.totalRequests += 1;

        if (data.model && elements.modelName) {
            elements.modelName.textContent = data.model;
        }

        setConnectionStatus("Backend terhubung", true);
        updateDashboard();

    } catch (error) {
        loadingMessage.setText(`Maaf, pesan gagal diproses.\n${error.message}`);
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
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.inputTokens !== undefined) usage.inputTokens = getNumber(data.inputTokens);
        if (data.outputTokens !== undefined) usage.outputTokens = getNumber(data.outputTokens);
        if (data.totalTokens !== undefined) usage.totalTokens = getNumber(data.totalTokens);
        if (data.totalRequests !== undefined) usage.totalRequests = getNumber(data.totalRequests);
        if (data.tokenLimit !== null && data.tokenLimit !== undefined) usage.tokenLimit = getNumber(data.tokenLimit);

        updateDashboard();
    } catch (error) {
        console.info("Data limit belum tersedia dari backend:", error.message);
    }
}

// ==========================================
// 10. EVENT FORM CHAT & INISIALISASI
// ==========================================

elements.chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = elements.userInput.value.trim();
    if (!message || isSending) return;
    elements.userInput.value = "";
    await sendMessage(message);
});

elements.userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        elements.chatForm.requestSubmit();
    }
});

function startNewChat() {
    if (isSending) return;
    activeChatId = null;
    conversation = [];
    clearMessagesFromScreen();
    addMessage("assistant", "Halo! Percakapan baru dimulai. Apa yang ingin kamu tanyakan?");
    elements.userInput.value = "";
    renderChatHistory();
    elements.userInput.focus();
}

function clearCurrentChat() {
    if (isSending) return;
    if (activeChatId) {
        deleteChat(activeChatId);
        return;
    }
    startNewChat();
}

elements.newChatBtn?.addEventListener("click", startNewChat);
elements.clearChatBtn?.addEventListener("click", clearCurrentChat);

function initializeApp() {
    chatHistories = loadChatHistories();
    renderChatHistory();
    initializeChart();
    updateDashboard();
    setConnectionStatus("Memeriksa backend");
    refreshUsage();
    console.info("GroqChat frontend berhasil dimuat.");
}

initializeApp();