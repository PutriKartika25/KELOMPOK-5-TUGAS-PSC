# Chatbot AI — Prompt Engineering

## 1. Deskripsi Proyek

Proyek ini merupakan pengembangan aplikasi chatbot berbasis Artificial Intelligence (AI) untuk memenuhi tugas mata kuliah **Pengembangan Sistem Cerdas** pada Program Studi Sistem Informasi.

Aplikasi chatbot ini menggunakan **Groq API** untuk menghasilkan respons berdasarkan pertanyaan pengguna. Proyek ini juga menerapkan teknik *Prompt Engineering* serta menampilkan informasi penggunaan token yang terdiri dari input tokens, output tokens, dan total tokens.

Selain itu, aplikasi dirancang untuk menyediakan pemantauan penggunaan token melalui dashboard dan visualisasi grafik.

## 2. Tujuan Proyek

Tujuan pengembangan aplikasi ini adalah:

- Membangun chatbot berbasis AI menggunakan Groq API.
- Menerapkan teknik Prompt Engineering untuk mengatur respons chatbot.
- Memahami penggunaan token dalam proses interaksi dengan AI.
- Menampilkan jumlah input tokens, output tokens, dan total tokens.
- Menerapkan batas penggunaan token pada aplikasi.
- Menampilkan visualisasi penggunaan token melalui grafik.

## 3. Teknologi yang Digunakan

Teknologi yang direncanakan atau digunakan dalam proyek ini meliputi:

- **Groq API** — Menghubungkan aplikasi dengan model AI.
- **Node.js** — Menjalankan lingkungan JavaScript pada backend.
- **Express.js** — Mengelola server dan endpoint API.
- **HTML** — Membuat struktur halaman aplikasi.
- **CSS** — Mengatur tampilan antarmuka.
- **JavaScript** — Mengatur interaksi chatbot dan pengolahan data.
- **Chart.js** — Menampilkan grafik penggunaan token.
- **Git dan GitHub** — Mengelola versi kode dan kolaborasi tim.

## 4. Fitur Aplikasi

Fitur yang direncanakan dalam proyek ini meliputi:

1. **Chatbot AI** — Pengguna dapat memasukkan pertanyaan dan menerima jawaban dari AI.
2. **Riwayat Chat** — Percakapan tersimpan di browser dan dapat dibuka kembali atau dihapus melalui daftar riwayat.
3. **Prompt Engineering** — Menggunakan instruksi atau prompt untuk mengarahkan gaya dan kualitas respons chatbot.
4. **Informasi Penggunaan Token** — Menampilkan jumlah token input, token output, dan total token dari respons API jika data tersebut tersedia.
5. **Batas Penggunaan Token** — Memantau penggunaan token berdasarkan batas yang ditentukan pada aplikasi.
6. **Dashboard dan Grafik** — Menampilkan visualisasi data penggunaan token agar lebih mudah dipahami.
7. **Penanganan Kesalahan** — Memberikan informasi apabila permintaan gagal, koneksi bermasalah, atau API mengembalikan kesalahan.

*Catatan: Fitur-fitur tersebut perlu disesuaikan dengan implementasi akhir aplikasi.*

## 5. Alur Kerja Sistem

Secara umum, alur kerja chatbot adalah sebagai berikut:

1. Pengguna memasukkan pertanyaan melalui antarmuka chatbot.
2. Frontend mengirimkan pertanyaan ke backend.
3. Backend menyiapkan prompt dan mengirimkan permintaan ke Groq API.
4. Groq API memproses permintaan dan mengembalikan respons.
5. Backend meneruskan jawaban kepada frontend serta mengambil informasi token yang tersedia.
6. Aplikasi menampilkan jawaban dan memperbarui informasi penggunaan token pada dashboard.

## 6. Contoh Prompt Engineering

Berikut contoh instruksi sistem yang dapat digunakan pada chatbot:

> Kamu adalah asisten AI yang membantu pengguna memahami informasi dengan jelas. Jawab menggunakan bahasa Indonesia yang baik, terstruktur, dan mudah dipahami. Gunakan langkah bernomor jika menjelaskan prosedur. Jika tidak mengetahui jawabannya, sampaikan dengan jujur.

Prompt dapat dikembangkan lebih lanjut sesuai kebutuhan dan hasil pengujian kelompok.

## 7. Informasi Token

Penggunaan token dalam respons API dapat dibedakan menjadi:

- **Input Tokens (`prompt_tokens`)**: jumlah token yang digunakan untuk memproses masukan, sesuai perhitungan yang dilaporkan API.
- **Output Tokens (`completion_tokens`)**: jumlah token yang digunakan untuk menghasilkan jawaban.
- **Total Tokens (`total_tokens`)**: jumlah keseluruhan token input dan output yang dilaporkan API.

Nilai penggunaan token sebaiknya diambil dari metadata respons API, bukan hanya diperkirakan dari jumlah karakter pesan.

Batas penggunaan yang diterapkan oleh aplikasi juga berbeda dari kuota atau batas permintaan yang ditetapkan oleh Groq.

## 8. Struktur Repository

Struktur folder proyek yang direncanakan adalah:

```text
chatbot-prompt-engineering/
├── backend/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
└── README.md
```

Struktur di atas merupakan contoh. Sesuaikan dengan file dan folder yang benar-benar tersedia di repository kelompok.

## 9. Persiapan dan Instalasi

### Prasyarat

Pastikan perangkat telah memiliki:

- Node.js dan npm.
- Git.
- API key Groq yang valid.

### Langkah Instalasi

1. Clone repository:

   ```bash
   git clone URL_REPOSITORY
   ```

2. Masuk ke folder proyek:

   ```bash
   cd KELOMPOK-5-TUGAS-PSC
   ```

3. Instal dependensi:

   ```bash
   npm install
   ```

4. Buat file `.env` di folder proyek, lalu tambahkan konfigurasi:

   ```env
   PORT=3003
   GROQ_API_KEY=masukkan_api_key_anda
   GROQ_MODEL=openai/gpt-oss-20b
   ```

5. Jalankan backend dari folder proyek:

   ```bash
   npm start
   ```

   Backend berjalan pada `http://localhost:3003`. Port ini dibedakan dari server frontend Laragon yang umumnya berjalan pada `http://localhost:3000`.

6. Jalankan frontend melalui Laragon; frontend mengirim permintaan ke backend di `http://localhost:3003`.

**Penting:** Jangan mengunggah file `.env` atau API key ke GitHub. Simpan kredensial secara aman dan gunakan variabel lingkungan pada backend.

## 10. Pengujian Aplikasi

Pengujian dilakukan untuk memeriksa fungsi utama aplikasi, meliputi:

- Memastikan chatbot dapat menerima pertanyaan.
- Memastikan respons AI ditampilkan dengan benar.
- Memeriksa kesesuaian respons dengan prompt yang digunakan.
- Memeriksa informasi input tokens, output tokens, dan total tokens.
- Menguji mekanisme batas penggunaan token.
- Memastikan grafik menampilkan data penggunaan yang sesuai.
- Menguji penanganan kesalahan saat permintaan API gagal.

Hasil pengujian dan tangkapan layar dapat ditambahkan setelah seluruh fitur diuji.

## 11. Pembagian Tugas Kelompok

Pembagian tugas pengembangan proyek:

- **Anggota 1 — Backend dan AI API:** Integrasi Groq API, pengembangan backend, Prompt Engineering, dan pengolahan informasi token.
- **Anggota 2 — Frontend dan Dashboard:** Pengembangan antarmuka chatbot, tampilan penggunaan token, batas penggunaan, dan grafik.
- **Anggota 3 — GitHub, Pengujian, dan Dokumentasi:** Pengelolaan repository, penggabungan kode, pengujian aplikasi, serta penyusunan dokumentasi proyek.

## 12. Hasil dan Kesimpulan

Bagian ini diisi setelah implementasi dan pengujian selesai. Jelaskan hasil integrasi Groq API, penerapan Prompt Engineering, pencatatan token, penerapan batas penggunaan, serta hasil visualisasi pada dashboard berdasarkan pengujian yang benar-benar dilakukan.

## 13. Pengembang

Proyek ini dikembangkan oleh kelompok mahasiswa Program Studi Sistem Informasi untuk mata kuliah **Pengembangan Sistem Cerdas**.

- Anggota 1: [Nama Anggota 1]
- Anggota 2: [Nama Anggota 2]
- Anggota 3: [Nama Anggota 3]
