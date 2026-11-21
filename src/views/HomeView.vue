<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import AppIcon from '../components/AppIcon.vue'

const auth = useAuthStore()

const namaDepan = computed(
  () => auth.currentUser?.nama?.split(' ')[0] || 'Sahabat Obami',
)

const linkToko = [
  {
    judul: 'Instagram',
    keterangan: '@lumpiabeefobami_pku',
    deskripsi: 'Lihat menu, promo, dan update terbaru toko.',
    url: 'https://www.instagram.com/lumpiabeefobami_pku/',
    icon: 'sparkles',
    warna: 'instagram',
  },
  {
    judul: 'Google Maps',
    keterangan: 'Lokasi outlet',
    deskripsi: 'Buka rute menuju Lumpia Beef Obami Delima.',
    url: 'https://maps.app.goo.gl/dWGZCbmN7SqXUBh5A',
    icon: 'store',
    warna: 'maps',
  },
  {
    judul: 'Artikel Terkait',
    keterangan: 'Tentang toko',
    deskripsi: 'Baca informasi dan ulasan terkait toko ini.',
    url: 'https://www.google.com/search?q=Lumpia+Beef+Obami+Delima+Pekanbaru',
    icon: 'book',
    warna: 'article',
  },
  {
    judul: 'GoFood',
    keterangan: 'Pesan antar',
    deskripsi: 'Cari toko ini di aplikasi GoFood.',
    url: 'https://gofood.co.id/search?query=Lumpia%20Beef%20Obami%20Delima',
    icon: 'bike',
    warna: 'gofood',
  },
  {
    judul: 'GrabFood',
    keterangan: 'Pesan antar',
    deskripsi: 'Cari toko ini di aplikasi GrabFood.',
    url: 'https://food.grab.com/id/en/restaurants?search=Lumpia%20Beef%20Obami%20Delima',
    icon: 'smartphone',
    warna: 'grabfood',
  },
  {
    judul: 'Instagram DM',
    keterangan: 'Chat langsung',
    deskripsi: 'Kirim pesan langsung ke akun Instagram toko.',
    url: 'https://ig.me/m/lumpiabeefobami_pku',
    icon: 'users',
    warna: 'whatsapp',
  },
]
</script>

<template>
  <div class="home-page">
    <section class="home-hero">
      <div class="hero-orb" />
      <div class="hero-copy">
        <span class="hero-eyebrow">Beranda pembeli</span>
        <h2>Halo, {{ namaDepan }}.</h2>
        <p>
          Selamat datang di <strong>Lumpia Beef Obami Delima</strong>. Temukan informasi
          toko, lokasi, media sosial, dan kanal pemesanan favoritmu di sini.
        </p>
      </div>
      <div class="hero-actions">
        <router-link :to="{ name: 'pesan' }" class="btn btn-accent">
          <AppIcon name="plus" :size="17" />
          Pesan Menu
        </router-link>
        <router-link :to="{ name: 'pesanan-saya' }" class="btn btn-outline-light">
          <AppIcon name="receipt" :size="17" />
          Pesanan Saya
        </router-link>
      </div>
    </section>

    <section class="link-section">
      <header class="section-head">
        <div>
          <span class="section-eyebrow">Tautan toko</span>
          <h3>Terhubung dengan kami</h3>
        </div>
        <p class="section-note">
          Semua tautan membuka halaman baru. Ketersediaan kanal pesan-antar mengikuti
          aplikasi masing-masing.
        </p>
      </header>

      <div class="link-grid">
        <a
          v-for="link in linkToko"
          :key="link.judul"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="link-card"
          :class="`link-${link.warna}`"
        >
          <span class="link-icon">
            <AppIcon :name="link.icon" :size="20" />
          </span>
          <div class="link-copy">
            <div class="link-topline">
              <strong>{{ link.judul }}</strong>
              <span>{{ link.keterangan }}</span>
            </div>
            <p>{{ link.deskripsi }}</p>
          </div>
          <span class="link-arrow">
            <AppIcon name="arrowRight" :size="16" />
          </span>
        </a>
      </div>
    </section>

    <section class="info-grid">
      <article class="card info-card">
        <header class="info-head">
          <span class="info-icon stat-amber">
            <AppIcon name="store" :size="18" />
          </span>
          <h3>Lokasi &amp; Jam</h3>
        </header>
        <dl class="info-list">
          <div>
            <dt>Alamat</dt>
            <dd>Lumpia Beef Obami Delima, Pekanbaru</dd>
          </div>
          <div>
            <dt>Jam buka</dt>
            <dd>Setiap hari, 10.00 - 22.00 WIB</dd>
          </div>
          <div>
            <dt>Mode layanan</dt>
            <dd>Pickup &amp; pesan antar (GoFood/GrabFood)</dd>
          </div>
        </dl>
        <a
          href="https://maps.app.goo.gl/dWGZCbmN7SqXUBh5A"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm"
        >
          <AppIcon name="arrowRight" :size="14" />
          Buka Google Maps
        </a>
      </article>

      <article class="card info-card">
        <header class="info-head">
          <span class="info-icon stat-blue">
            <AppIcon name="bag" :size="18" />
          </span>
          <h3>Cara Pesan</h3>
        </header>
        <ol class="steps">
          <li>Pilih menu, jumlah, dan topping favoritmu.</li>
          <li>Tambahkan catatan bila perlu.</li>
          <li>Konfirmasi pembayaran QRIS simulasi.</li>
          <li>Ambil pesanan di outlet saat status <strong>Siap Diambil</strong>.</li>
        </ol>
        <router-link :to="{ name: 'pesan' }" class="btn btn-primary btn-sm">
          <AppIcon name="plus" :size="14" />
          Mulai pesan
        </router-link>
      </article>

      <article class="card info-card">
        <header class="info-head">
          <span class="info-icon stat-green">
            <AppIcon name="wallet" :size="18" />
          </span>
          <h3>Pembayaran</h3>
        </header>
        <dl class="info-list">
          <div>
            <dt>Di outlet</dt>
            <dd>Tunai atau QRIS</dd>
          </div>
          <div>
            <dt>Online pickup</dt>
            <dd>QRIS simulasi (wajib sebelum pesanan dibuat)</dd>
          </div>
          <div>
            <dt>Pesan antar</dt>
            <dd>Mengikuti metode pembayaran aplikasi</dd>
          </div>
        </dl>
        <span class="info-note">
          <AppIcon name="info" :size="13" />
          Pembayaran pada aplikasi ini bersifat simulasi (demo lokal).
        </span>
      </article>
    </section>

    <section class="available-section">
      <div class="available-card">
        <div class="available-copy">
          <span class="section-eyebrow">Tersedia juga di</span>
          <h3>Pesan lewat aplikasi favoritmu</h3>
          <p>
            Lumpia Beef Obami Delima juga dapat dicari di layanan pesan-antar. Buka
            aplikasi, cari nama toko, lalu pesan seperti biasa.
          </p>
        </div>
        <div class="available-badges">
          <a
            href="https://gofood.co.id/search?query=Lumpia%20Beef%20Obami%20Delima"
            target="_blank"
            rel="noopener noreferrer"
            class="available-badge gofood"
          >
            <AppIcon name="bike" :size="18" />
            <span>GoFood</span>
          </a>
          <a
            href="https://food.grab.com/id/en/restaurants?search=Lumpia%20Beef%20Obami%20Delima"
            target="_blank"
            rel="noopener noreferrer"
            class="available-badge grabfood"
          >
            <AppIcon name="smartphone" :size="18" />
            <span>GrabFood</span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  min-height: 190px;
  padding: 26px 30px;
  overflow: hidden;
  border: 2px solid var(--brand-dark);
  border-radius: var(--radius-lg);
  color: #fbf3e8;
  background:
    repeating-conic-gradient(from 0deg at 82% 48%, rgba(246, 231, 184, 0.065) 0deg 5deg, transparent 5deg 15deg),
    linear-gradient(100deg, var(--brand-dark) 0%, var(--brand) 66%, #a91f20 100%);
  box-shadow: 0 12px 26px -24px rgba(94, 15, 16, 0.9);
}

.home-hero::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(246, 231, 184, 0.42);
  pointer-events: none;
}

.hero-orb {
  position: absolute;
  right: 16px;
  bottom: -50px;
  width: 230px;
  height: 230px;
  border: 1px solid rgba(246, 231, 184, 0.08);
  border-radius: 50%;
  pointer-events: none;
}

.hero-orb::after {
  position: absolute;
  inset: 38px;
  border: 1px solid rgba(246, 231, 184, 0.08);
  border-radius: 50%;
  content: '';
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 640px;
}

.hero-eyebrow {
  display: block;
  width: fit-content;
  margin-bottom: 11px;
  padding-bottom: 2px;
  border-bottom: 3px solid var(--amber);
  color: var(--amber-light);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h2 {
  margin: 0 0 7px;
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  text-shadow: 3px 3px 0 var(--brand-dark);
}

.hero-copy p {
  margin: 0;
  color: #fff7df;
  font-size: 12px;
  line-height: 1.65;
}

.hero-copy p strong {
  color: #f5c98f;
  font-weight: 600;
}

.hero-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
}

.link-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-eyebrow {
  display: block;
  margin-bottom: 4px;
  color: var(--brand);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.section-head h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
}

.section-note {
  max-width: 360px;
  color: var(--muted-light);
  font-size: 9px;
  line-height: 1.5;
  text-align: right;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 15px;
  border: 1px solid var(--line);
  border-top: 3px solid var(--brand);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.link-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow-md);
}

.link-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
}

.link-instagram .link-icon {
  color: #c13584;
  background: #fce4f1;
}

.link-maps .link-icon {
  color: var(--blue);
  background: var(--blue-soft);
}

.link-article .link-icon {
  color: var(--amber-deep);
  background: #fdf3e3;
}

.link-gofood .link-icon {
  color: #196b52;
  background: #e0f1e9;
}

.link-grabfood .link-icon {
  color: #0f7a3d;
  background: #e3f3ea;
}

.link-whatsapp .link-icon {
  color: #1f8a4c;
  background: #e6f4ec;
}

.link-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.link-topline {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.link-topline strong {
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.link-topline span {
  color: var(--muted-light);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.link-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.5;
}

.link-arrow {
  flex: 0 0 auto;
  color: var(--muted-light);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
}

.info-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-head h3 {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.info-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 9px;
}

.stat-amber {
  color: #9a6316;
  background: #fdf1dc;
}

.stat-blue {
  color: var(--blue);
  background: var(--blue-soft);
}

.stat-green {
  color: var(--green);
  background: var(--green-soft);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
}

.info-list > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--surface-alt);
}

.info-list dt {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.info-list dd {
  margin: 0;
  color: var(--ink);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-left: 18px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.steps li {
  padding-left: 2px;
}

.steps strong {
  color: var(--ink);
}

.info-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted-light);
  font-size: 8.5px;
  line-height: 1.5;
}

.info-note svg {
  flex: 0 0 auto;
  color: var(--amber-deep);
}

.available-section {
  margin-top: 2px;
}

.available-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 92% 10%, rgba(233, 162, 59, 0.1), transparent 34%),
    linear-gradient(120deg, #fffdf9, #f9f2e7);
}

.available-copy {
  max-width: 560px;
}

.available-copy h3 {
  margin: 4px 0 6px;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  color: var(--ink);
}

.available-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
}

.available-badges {
  display: flex;
  gap: 10px;
  flex: 0 0 auto;
}

.available-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 11px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s ease;
}

.available-badge:hover {
  transform: translateY(-2px);
}

.available-badge.gofood {
  background: #196b52;
}

.available-badge.grabfood {
  background: #0f7a3d;
}

@media (max-width: 960px) {
  .home-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-actions {
    flex-direction: row;
    align-items: center;
  }

  .link-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .info-grid .info-card:last-child {
    grid-column: span 2;
  }

  .available-card {
    flex-direction: column;
    align-items: stretch;
  }

  .available-badges {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .home-hero {
    min-height: 220px;
    padding: 21px;
  }

  .hero-copy h2 {
    font-size: 29px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-note {
    text-align: left;
    max-width: none;
  }

  .link-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-grid .info-card:last-child {
    grid-column: auto;
  }
}
</style>