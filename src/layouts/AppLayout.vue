<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useAuthStore } from '../stores/auth'
import { useOrderStore } from '../stores/orders'
import { useToast } from '../composables/useToast'
import { formatTanggal, inisial } from '../utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orderStore = useOrderStore()
const toast = useToast()

const navUtama = computed(() => {
  if (auth.isPembeli) {
    return [
      { nama: 'home', label: 'Beranda', icon: 'home' },
      { nama: 'pesan', label: 'Pesan Menu', icon: 'bag' },
      { nama: 'pesanan-saya', label: 'Pesanan Saya', icon: 'receipt' },
    ]
  }

  return [
    { nama: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { nama: 'pesanan-baru', label: 'Pesanan Baru', icon: 'plus' },
    { nama: 'pesanan', label: 'Pesanan', icon: 'receipt' },
  ]
})

const navManajemen = [
  { nama: 'menu', label: 'Menu', icon: 'book', roles: ['pemilik'] },
  { nama: 'laporan', label: 'Laporan', icon: 'chart', roles: ['pemilik'] },
]

const navTampil = computed(() => [
  ...navUtama.value,
  ...navManajemen.filter((item) => item.roles.includes(auth.role)),
])

const jumlahPesananAktif = computed(
  () =>
    orderStore.daftarPesanan.filter(
      (order) =>
        order.pembeliId === auth.currentUser?.id && order.status !== 'Selesai',
    ).length,
)

const judulHalaman = computed(() => route.meta.judul || 'Dashboard')
const subjudulHalaman = computed(() => route.meta.subjudul || '')
const tanggalHariIni = formatTanggal(new Date())
const inisialUser = computed(() => inisial(auth.currentUser?.nama || 'Pengguna'))

function keluar() {
  auth.logout()
  toast.info('Anda telah keluar dari sistem.')
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <header class="top-header">
      <div class="header-main">
        <router-link :to="{ name: auth.homeRoute }" class="brand" aria-label="Kembali ke beranda">
          <span class="brand-sign" aria-hidden="true">
            <span class="brand-sign-top">LUMPIA BEEF</span>
            <span class="brand-sign-bottom">OBAMI <b>DELIMA</b></span>
          </span>
          <span class="brand-copy">
            <small>Sejak 2022</small>
            <strong>Lumpia Beef</strong>
            <em>HALAL INDONESIA</em>
          </span>
        </router-link>

        <div class="header-tools">
          <span class="date-chip">
            <AppIcon name="calendar" :size="14" />
            {{ tanggalHariIni }}
          </span>
          <div class="user-chip">
            <span class="avatar">{{ inisialUser }}</span>
            <span class="user-copy">
              <strong>{{ auth.currentUser?.nama }}</strong>
              <small>{{ auth.labelRole }}</small>
            </span>
            <button type="button" class="logout-btn" aria-label="Keluar" title="Keluar" @click="keluar">
              <AppIcon name="logout" :size="16" />
            </button>
          </div>
        </div>
      </div>

      <nav class="top-nav" aria-label="Navigasi utama">
        <router-link
          v-for="item in navTampil"
          :key="item.nama"
          :to="{ name: item.nama }"
          class="nav-link"
          :class="{ 'is-active': route.name === item.nama }"
        >
          <AppIcon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
          <span v-if="item.nama === 'pesanan-saya' && jumlahPesananAktif" class="nav-count">
            {{ jumlahPesananAktif }}
          </span>
        </router-link>
      </nav>
    </header>

    <main class="page">
      <div class="page-heading">
        <span class="page-kicker">{{ auth.labelRole }}</span>
        <h1>{{ judulHalaman }}</h1>
        <p v-if="subjudulHalaman">{{ subjudulHalaman }}</p>
      </div>
      <router-view />
    </main>

    <footer class="app-footer">
      <span class="footer-brand">LUMPIA BEEF <b>OBAMI DELIMA</b> · EST 2022</span>
      <i />
      <span>Proyek ETS · {{ new Date().getFullYear() }}</span>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 92% 8%, rgba(217, 164, 65, 0.12), transparent 20rem),
    var(--bg);
}

.top-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(120, 65, 45, 0.12);
  background: rgba(251, 243, 228, 0.98);
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px -28px rgba(44, 30, 19, 0.45);
}

.header-main {
  display: flex;
  align-items: center;
  max-width: 1380px;
  height: 72px;
  margin: 0 auto;
  padding: 0 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 236px;
}

.brand-sign {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 104px;
  height: 48px;
  padding: 5px 9px 5px 11px;
  border: 3px solid #f8e6bd;
  border-radius: 9px;
  color: #fff1cf;
  background: var(--brand);
  box-shadow:
    0 0 0 1px var(--brand-dark),
    0 8px 18px -12px rgba(117, 25, 23, 0.9);
  line-height: 0.9;
  text-transform: uppercase;
  transform: rotate(-1deg);
}

.brand-sign::after {
  content: '';
  position: absolute;
  right: 7px;
  bottom: 7px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff1cf;
  box-shadow: -5px -5px 0 -3px var(--brand);
}

.brand-sign-top {
  font-size: 7.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.brand-sign-bottom {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.brand-sign-bottom b {
  color: var(--amber);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.brand-copy small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.brand-copy strong {
  margin-top: 4px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.04em;
}

.brand-copy em {
  margin-top: 3px;
  color: var(--brand);
  font-size: 7.5px;
  font-style: normal;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.date-chip,
.user-chip {
  display: flex;
  align-items: center;
  height: 42px;
  border: 1px solid var(--line);
  background: #fff;
}

.date-chip {
  gap: 7px;
  padding: 0 12px;
  border-radius: 10px;
  color: var(--muted);
  font-size: 10.5px;
  font-weight: 600;
}

.user-chip {
  gap: 9px;
  min-width: 188px;
  padding: 5px 6px 5px 7px;
  border-radius: 12px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 9px;
  color: #fff;
  background: var(--ink);
  font-size: 9.5px;
  font-weight: 800;
}

.user-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.user-copy strong {
  max-width: 112px;
  overflow: hidden;
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-copy small {
  color: var(--muted);
  font-size: 8.5px;
}

.logout-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: auto;
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
}

.logout-btn:hover {
  color: var(--brand);
  background: var(--brand-soft);
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 28px;
  border-top: 1px solid rgba(88, 67, 48, 0.07);
  background: var(--brand);
  border-top: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.top-nav::-webkit-scrollbar {
  display: none;
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 48px;
  padding: 0 17px;
  color: #f6dfbd;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  right: 17px;
  bottom: 0;
  left: 17px;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: transparent;
}

.nav-link:hover {
  color: #fff8e8;
  background: rgba(255, 248, 232, 0.08);
}

.nav-link.is-active {
  color: #fff8e8;
}

.nav-link.is-active::after {
  background: var(--amber);
}

.nav-count {
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  color: var(--brand-dark);
  background: var(--amber);
  border: 1px solid #fff1b9;
  font-size: 8.5px;
}

.page {
  max-width: 1380px;
  min-height: calc(100vh - 177px);
  margin: 0 auto;
  padding: 24px 28px 38px;
}

.page-heading {
  display: flex;
  align-items: baseline;
  min-height: 52px;
  margin-bottom: 14px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--line);
}

.page-kicker {
  display: inline-flex;
  align-items: center;
  align-self: center;
  margin-right: 12px;
  color: var(--brand);
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.page-heading p {
  margin: 0 0 0 auto;
  color: var(--muted);
  font-size: 10.5px;
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  color: var(--muted-light);
  border-top: 1px solid var(--line-soft);
  font-size: 9.5px;
}

.app-footer i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--amber);
}

@media (max-width: 900px) {
  .header-main {
    height: 64px;
    padding: 0 16px;
  }

  .brand {
    min-width: 0;
  }

  .brand-sign {
    width: 94px;
    height: 44px;
  }

  .brand-sign-bottom {
    font-size: 9.5px;
  }

  .brand-copy strong {
    font-size: 14px;
  }

  .date-chip {
    display: none;
  }

  .top-nav {
    justify-content: flex-start;
    padding: 0 8px;
  }

  .nav-link {
    padding: 0 12px;
  }

  .page {
    min-height: calc(100vh - 161px);
    padding: 18px 16px 32px;
  }

  .page-heading h1 {
    font-size: 24px;
  }
}

@media (max-width: 560px) {
  .brand-copy small {
    display: none;
  }

  .brand-copy strong {
    width: 74px;
    font-size: 11px;
  }

  .user-chip {
    min-width: 42px;
    width: 42px;
    padding: 5px;
  }

  .user-copy {
    display: none;
  }

  .logout-btn {
    display: none;
  }

  .nav-link {
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    height: 58px;
    min-width: 72px;
    padding: 0 8px;
    font-size: 9px;
  }

  .nav-link::after {
    right: 8px;
    left: 8px;
  }

  .nav-count {
    position: absolute;
    top: 7px;
    right: 10px;
  }

  .page-heading {
    min-height: 46px;
    flex-wrap: wrap;
  }

  .page-heading p {
    width: 100%;
    margin: 4px 0 0;
    max-width: 330px;
  }

  .app-footer {
    font-size: 8.5px;
  }
}
</style>
