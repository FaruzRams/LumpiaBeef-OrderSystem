<script setup>
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const tujuan = computed(() =>
  auth.isAuthenticated
    ? { name: auth.homeRoute }
    : { name: 'login' },
)
const labelTujuan = computed(() =>
  !auth.isAuthenticated
    ? 'Masuk ke Aplikasi'
    : auth.isPembeli
      ? 'Kembali ke Pesan Menu'
      : 'Kembali ke Dashboard',
)
</script>

<template>
  <div class="notfound-page">
    <div class="notfound-card">
      <div class="brand-mark">
        <span>L</span>
      </div>
      <span class="notfound-code">404</span>
      <h1>Halaman tidak ditemukan</h1>
      <p>
        Alamat yang Anda buka tidak tersedia pada aplikasi pesanan Lumpia Beef
        Obami Delima.
      </p>
      <router-link :to="tujuan" class="btn btn-primary">
        <AppIcon name="arrowLeft" :size="16" />
        {{ labelTujuan }}
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.notfound-page {
  display: grid;
  min-height: 100vh;
  padding: 24px;
  place-items: center;
  background:
    radial-gradient(circle at 30% 20%, rgba(233, 162, 59, 0.12), transparent 30%),
    var(--bg);
}

.notfound-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 420px;
  padding: 42px 34px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  text-align: center;
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 20px;
  border-radius: 13px;
  color: #2a1b10;
  background: linear-gradient(145deg, var(--amber), #f4c67e);
  transform: rotate(-4deg);
}

.brand-mark span {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  transform: rotate(4deg);
}

.notfound-code {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.notfound-card h1 {
  margin: 8px 0 8px;
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.notfound-card p {
  max-width: 320px;
  margin: 0 0 20px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}
</style>
