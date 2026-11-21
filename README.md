# Lumpia Beef Obami Delima — Sistem Pesanan, Pickup & Kasir

Aplikasi web untuk memesan menu, membayar, memantau pesanan pickup, mencatat pesanan kasir, mengelola menu, dan merekap penjualan Lumpia Beef Obami Delima. Dibuat berdasarkan `PRD_Lumpia_Beef_Obami_Delima.docx` (versi 1.0, 21 November 2026) dengan tambahan alur pembeli.

Aplikasi ini adalah **prototipe akademik** berbasis Local Storage, tanpa backend, tanpa pembayaran nyata, dan tanpa integrasi langsung dengan GoFood/GrabFood.

## Demo

Tiga akun demo tersedia dan dapat dipilih langsung dari halaman login:

| Peran | Username | Password | Hak akses |
| --- | --- | --- | --- |
| Pemilik | `pemilik` | `pemilik` | Dashboard, pesanan, menu & topping, laporan penjualan |
| Kasir | `kasir` | `kasir` | Dashboard, pesanan baru, daftar pesanan, pembayaran, status |
| Pembeli | `pembeli` | `pembeli` | Pesan menu, bayar, dan melihat pesanan pickup miliknya sendiri |

Pembeli hanya dapat melihat pesanan dengan `pembeliId` miliknya. Menu & Topping dan Laporan Penjualan hanya dapat dibuka oleh pemilik.

## Fitur

- **Tiga peran** — Pemilik, Kasir, dan Pembeli dengan navigasi serta hak akses berbeda.
- **Pemesanan pembeli** — pilih menu, jumlah, topping, dan catatan; pembayaran QRIS simulasi wajib dilakukan sebelum pesanan dibuat.
- **Bayar dulu, baru diproses** — pesanan pembeli tersimpan berstatus **Lunas** dan **Diproses** setelah pembayaran berhasil, lalu kasir memprosesnya hingga **Siap Diambil**.
- **Pesanan saya (pembeli)** — status pickup, nomor pesanan, rincian item, pembayaran, dan riwayat pesanan milik sendiri.
- **Dashboard** — penjualan hari ini, transaksi, pesanan aktif, menu tersedia, tren 7 hari, dan transaksi terbaru.
- **Pesanan baru kasir** — kanal Langsung/GoFood/GrabFood, pilihan menu, jumlah, topping, catatan, dan validasi pesanan kosong.
- **Topping otomatis** — harga item dihitung dari harga menu + seluruh topping, lalu dikalikan jumlah.
- **Pembayaran kasir** — Tunai (dengan kembalian) atau QRIS, serta opsi mencatat pembayaran nanti.
- **Status pesanan** — Diproses → Siap Diambil → Selesai, dapat diubah dari dashboard, daftar, atau detail pesanan.
- **Daftar pesanan** — pencarian, filter status/kanal/pembayaran, detail item, pembayaran, dan status.
- **Manajemen menu & topping (khusus pemilik)** — tambah, edit harga/komposisi, dan nonaktifkan item.
- **Laporan penjualan (khusus pemilik)** — rekap harian/bulanan, total penjualan lunas, transaksi belum dibayar, kanal (termasuk Pickup), metode pembayaran, menu terlaris, dan unduh CSV.
- **Persistensi Local Storage** — sesi, katalog, dan transaksi tetap ada setelah halaman dimuat ulang pada browser yang sama.
- **Snapshot harga** — perubahan harga menu/topping tidak mengubah riwayat transaksi lama.
- **Responsif** — tata letak untuk desktop dan ponsel.

## Teknologi

- Vue 3 (Composition API, `<script setup>`)
- Vue Router
- Pinia
- Vite
- CSS murni (tanpa framework UI)
- Browser Local Storage

## Menjalankan Proyek

Prasyarat: Node.js 18+ dan npm.

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite (biasanya `http://localhost:5173`).

Build produksi:

```bash
npm run build
npm run preview
```

## Alur Penggunaan

### Alur pembeli (pickup)

1. Masuk dengan akun **Pembeli**.
2. Pilih menu, jumlah, dan topping. Total dihitung otomatis.
3. Tambahkan catatan bila perlu, lalu klik **Bayar & Pesan**.
4. Konfirmasi pembayaran pada modal **QRIS simulasi**. Pesanan tidak dibuat sebelum pembayaran dikonfirmasi.
5. Pesanan tersimpan sebagai **Lunas** dan masuk status **Diproses**.
6. Pantau **Pesanan Saya**. Saat status menjadi **Siap Diambil**, tunjukkan nomor pesanan di outlet.
7. Kasir atau pemilik menandai pesanan **Selesai** setelah pembeli mengambilnya.

### Alur kasir/pemilik

1. Masuk dengan akun **Kasir** atau **Pemilik**.
2. Buka **Pesanan Baru** untuk mencatat pesanan langsung atau pesanan dari aplikasi pesan-antar.
3. Pilih **Tunai** atau **QRIS**. Centang **Catat pembayaran nanti** bila pembayaran belum diterima.
4. Simpan pesanan. Pesanan tampil dengan status awal **Diproses**.
5. Perbarui status menjadi **Siap Diambil** lalu **Selesai**.
6. Jika belum dibayar, buka detail pesanan dan klik **Catat Pembayaran**.
7. Sebagai pemilik, kelola katalog di **Menu & Topping** dan lihat rekap di **Laporan Penjualan**.

## Aturan Perhitungan

- Harga item = harga menu + total harga topping yang dipilih.
- Total item = harga item × jumlah.
- Subtotal = jumlah total seluruh item.
- Total transaksi = subtotal (belum ada pajak/biaya tambahan pada MVP).
- Pembayaran Tunai: nominal diterima harus ≥ total, kembalian dihitung otomatis.
- Pembayaran QRIS: nominal dicatat sebesar total transaksi (simulasi, bukan integrasi QRIS nyata).
- Pesanan pembeli wajib lunas sebelum dibuat dan selalu menggunakan kanal **Pickup**.

## Kanal Pesanan

| Kanal | Keterangan |
| --- | --- |
| Langsung | Pelanggan datang langsung ke outlet dan dicatat kasir |
| GoFood | Input manual pesanan GoFood oleh kasir |
| GrabFood | Input manual pesanan GrabFood oleh kasir |
| Pickup | Pesanan online pembeli yang dibayar dulu lalu diambil sendiri |

## Data Awal

Enam menu dan empat topping mengikuti PRD:

| Menu | Harga |
| --- | ---: |
| Lumpia Telur Original | Rp11.000 |
| Lumpia Beef Original | Rp11.000 |
| Lumpia Beef Patty | Rp15.000 |
| Lumpia Beef Patty Spesial | Rp19.000 |
| Lumpia Beef Patty Brutal | Rp21.000 |
| Lumpia Beef Patty Maksimal | Rp22.000 |

| Topping | Harga |
| --- | ---: |
| Telur | Rp3.000 |
| Keju | Rp2.000 |
| Nugget | Rp2.000 |
| Sosis | Rp2.000 |

## Struktur Folder

```text
src/
├── assets/main.css          # Token desain, komponen dasar, modal, toast, tabel
├── components/              # AppIcon, BaseModal, StatusBadge, ToastHost, dll.
├── composables/useToast.js  # Notifikasi ringan
├── data/seed.js             # Akun demo, menu, topping, informasi outlet
├── layouts/AppLayout.vue    # Sidebar, topbar, navigasi berbasis peran
├── router/index.js          # Rute dan guard autentikasi/peran
├── stores/
│   ├── auth.js              # Login demo, sesi, dan peran
│   ├── menu.js              # Katalog menu & topping + persistensi
│   └── orders.js            # Pesanan, snapshot harga, pembayaran, status
├── utils/
│   ├── constants.js         # Status, kanal, metode pembayaran
│   ├── format.js            # Format rupiah, tanggal, kunci periode
│   └── storage.js           # Helper Local Storage
├── views/
│   ├── LoginView.vue
│   ├── DashboardView.vue    # Dashboard kasir & pemilik
│   ├── NewOrderView.vue     # Pesanan baru kasir + pemesanan pembeli
│   ├── OrdersView.vue       # Daftar pesanan kasir & pemilik
│   ├── MyOrdersView.vue     # Pesanan pickup milik pembeli
│   ├── MenuView.vue
│   ├── ReportsView.vue
│   └── NotFoundView.vue
├── App.vue
└── main.js
```

## Penyimpanan Local Storage

Data disimpan dengan prefiks `lbd_v1_`:

| Kunci | Isi |
| --- | --- |
| `lbd_v1_session` | Sesi pengguna yang sedang login |
| `lbd_v1_catalog` | Menu dan topping (dibuat setelah ada perubahan katalog) |
| `lbd_v1_orders` | Seluruh pesanan, pembayaran, dan data pembeli |

Pesanan baru menyimpan `sumber` (`kasir`/`online`), `pembeliId`, `pembeliNama`, snapshot harga, dan waktu pembayaran.

Untuk mengosongkan data demo: buka DevTools browser → **Application** → **Local Storage** → hapus kunci berawalan `lbd_v1_`, lalu muat ulang halaman.
