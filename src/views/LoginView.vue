<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { seedUsers } from '../data/seed'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const username = ref('')
const password = ref('')
const tampilkanPassword = ref(false)
const error = ref('')
const sedangMasuk = ref(false)

const metaPeran = {
  pemilik: {
    label: 'Pemilik',
    deskripsi: 'Kelola menu & lihat laporan',
    icon: 'store',
  },
  kasir: {
    label: 'Kasir',
    deskripsi: 'Catat pesanan & pembayaran',
    icon: 'receipt',
  },
  pembeli: {
    label: 'Pembeli',
    deskripsi: 'Pesan, bayar, lalu pickup',
    icon: 'bag',
  },
}

const akunDemo = computed(() =>
  seedUsers
    .filter((user) => user.role === 'pembeli')
    .map((user) => ({
      ...user,
      ...metaPeran[user.role],
    })),
)

function masuk() {
  error.value = ''
  sedangMasuk.value = true

  const hasil = auth.login(username.value, password.value)

  if (!hasil.ok) {
    error.value = hasil.message
    sedangMasuk.value = false
    return
  }

  toast.sukses(`Selamat datang, ${hasil.user.nama}.`)
  const tujuan = typeof route.query.redirect === 'string' ? route.query.redirect : null
  router.replace(tujuan && tujuan.startsWith('/') ? tujuan : { name: auth.homeRoute })
}

function masukDemo(akun) {
  username.value = akun.username
  password.value = akun.passwordDemo
  masuk()
}
</script>

<template>
  <div class="login-page">
    <section class="login-visual">
      <!-- Foto: taruh di public/images/gerobak-obami.png -->
      <img
        class="visual-photo"
        src="/images/gerobak-obami.png"
        width="1200"
        height="992"
        fetchpriority="high"
        alt="Gerobak Lumpia Beef Obami dengan spanduk Cemilan Viral dan papan menu"
      />

      <header class="visual-brand">
        <div class="brand-sign" aria-label="Lumpia Beef Obami Delima">
          <span class="brand-sign-top">LUMPIA BEEF</span>
          <span class="brand-sign-bottom">OBAMI <b>DELIMA</b></span>
        </div>
      </header>

      <div class="disc-wrap" aria-hidden="true">
        <div class="disc-badge">
          <small>DISKON</small>
          <strong>20%</strong>
        </div>
      </div>

      <div class="order-receipt" aria-hidden="true">
        <div class="receipt-paper">
          <div class="receipt-head">
            <span>Contoh struk</span>
            <b class="receipt-stamp">Diproses</b>
          </div>
          <strong class="receipt-no">LBD-261121-004</strong>
          <div class="receipt-line">
            <div>
              <b>Lumpia Beef Patty Spesial</b>
              <span>1 × Rp19.000 + keju</span>
            </div>
            <span>Rp21.000</span>
          </div>
          <div class="receipt-line">
            <div>
              <b>Lumpia Beef Original</b>
              <span>1 × Rp11.000</span>
            </div>
            <span>Rp11.000</span>
          </div>
          <div class="receipt-total">
            <span>Total</span>
            <strong>Rp32.000</strong>
          </div>
        </div>
      </div>

      <div class="visual-copy">
        <h1>
          <span>Cemilan viral,</span>
          <span>pesanan rapi.</span>
        </h1>
        <p>Catat pesanan, hitung topping, rekap jualan. Beres di satu tempat.</p>
      </div>

      <footer class="visual-footer">
        <AppIcon name="info" :size="14" />
        Prototipe akademik · data tersimpan lokal di browser
      </footer>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <span class="login-eyebrow">Masuk</span>
        <h2>Masuk dulu, yuk.</h2>
        <p class="login-subtitle">Mau pesan lumpia? Masuk atau pilih akun demo di bawah.</p>

        <Transition name="fade">
          <div v-if="error" class="alert alert-error login-alert" role="alert">
            <AppIcon name="alert" :size="17" />
            <span>{{ error }}</span>
          </div>
        </Transition>

        <form class="login-form" @submit.prevent="masuk">
          <label class="field">
            <span class="field-label">Username</span>
            <span class="input-with-icon">
              <AppIcon name="user" :size="18" />
              <input
                v-model.trim="username"
                type="text"
                class="input"
                placeholder="Masukkan username"
                autocomplete="username"
                required
              />
            </span>
          </label>

          <label class="field">
            <span class="field-label">Password</span>
            <span class="input-with-icon">
              <AppIcon name="lock" :size="18" />
              <input
                v-model="password"
                :type="tampilkanPassword ? 'text' : 'password'"
                class="input"
                placeholder="Masukkan password demo"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="input-action"
                :aria-label="tampilkanPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                :aria-pressed="tampilkanPassword"
                @click="tampilkanPassword = !tampilkanPassword"
              >
                <AppIcon :name="tampilkanPassword ? 'eyeOff' : 'eye'" :size="18" />
              </button>
            </span>
          </label>

          <button type="submit" class="btn btn-primary btn-block" :disabled="sedangMasuk">
            <span v-if="sedangMasuk" class="spinner" aria-hidden="true"></span>
            <AppIcon v-else name="arrowRight" :size="18" />
            {{ sedangMasuk ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>

        <div class="login-divider"><span>Akun demo</span></div>

        <div class="demo-accounts">
          <button
            v-for="akun in akunDemo"
            :key="akun.id"
            type="button"
            class="demo-account"
            @click="masukDemo(akun)"
          >
            <span class="demo-icon"><AppIcon :name="akun.icon" :size="20" /></span>
            <span class="demo-meta">
              <strong>{{ akun.label }}</strong>
              <small>{{ akun.deskripsi }}</small>
              <span class="demo-credentials">
                {{ akun.username }} · {{ akun.passwordDemo }}
              </span>
            </span>
            <AppIcon name="chevronRight" :size="18" class="demo-chevron" />
          </button>
        </div>

        <p class="login-note">
          <AppIcon name="info" :size="14" />
          Autentikasi demo untuk simulasi akademik, bukan pengamanan produksi.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(480px, 1.15fr) minmax(440px, 0.85fr);
  min-height: 100vh;
  background: var(--bg);
}

/* ---------- Panel kiri: foto gerobak yang memudar ke marun ---------- */
.login-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 40px 48px 28px;
  overflow: hidden;
  color: var(--amber-light);
  background-color: var(--brand);
  border-right: 8px solid var(--amber);
  isolation: isolate;
}

/* sunburst tipis, memancar dari belakang gerobak */
.login-visual::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: repeating-conic-gradient(
    from 0deg at 68% 30%,
    rgba(233, 166, 43, 0.1) 0deg 5deg,
    transparent 5deg 10deg
  );
  content: '';
  pointer-events: none;
}

.visual-photo {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  height: 76%;
  object-fit: cover;
  object-position: center top;
  opacity: 0.62;
  filter: saturate(0.92) contrast(1.05);
  /* memudar ke bawah (ke marun solid) dan ke tepi kanan (ke garis kuning) */
  -webkit-mask-image:
    linear-gradient(to bottom, #000 0%, #000 36%, transparent 100%),
    linear-gradient(to left, transparent 0, #000 16%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to bottom, #000 0%, #000 36%, transparent 100%),
    linear-gradient(to left, transparent 0, #000 16%);
  mask-composite: intersect;
}

.visual-brand {
  position: relative;
  display: flex;
  align-items: center;
}

.brand-sign {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 160px;
  height: 70px;
  padding: 8px 14px;
  border: 4px solid #f7dfaa;
  border-radius: 10px;
  color: #fff1cf;
  background: var(--brand-dark);
  box-shadow: 4px 4px 0 var(--brand-dark);
  line-height: 0.9;
  transform: rotate(-1deg);
}

.brand-sign::after {
  position: absolute;
  right: 10px;
  bottom: 9px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff1cf;
  content: '';
}

.brand-sign-top {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.brand-sign-bottom {
  margin-top: 7px;
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.brand-sign-bottom b {
  color: var(--amber);
  font-weight: inherit;
}

/* badge hexagon diskon, seperti di spanduk asli */
.disc-wrap {
  position: absolute;
  top: 36px;
  right: 40px;
  filter: drop-shadow(4px 4px 0 var(--brand-dark));
  transform: rotate(8deg);
}

.disc-badge {
  display: grid;
  place-content: center;
  width: 92px;
  height: 104px;
  color: var(--brand-dark);
  background: var(--amber);
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  line-height: 1;
  text-align: center;
}

.disc-badge small {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.disc-badge strong {
  margin-top: 3px;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 400;
}

/* struk kertas, bukan kaca */
.order-receipt {
  position: absolute;
  right: 48px;
  bottom: 104px;
  z-index: 2;
  width: 292px;
  filter: drop-shadow(6px 6px 0 var(--brand-dark));
  transform: rotate(1.8deg);
}

.receipt-paper {
  position: relative;
  padding: 16px 18px 18px;
  color: var(--ink);
  background: var(--surface);
  font-family: var(--font-mono);
}

.receipt-paper::after {
  position: absolute;
  right: 0;
  bottom: -7px;
  left: 0;
  height: 7px;
  background: conic-gradient(
      from -45deg at bottom,
      transparent,
      var(--surface) 1deg 90deg,
      transparent 91deg
    )
    0 0 / 14px 100%;
  content: '';
}

.receipt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.receipt-stamp {
  padding: 2px 6px;
  border: 2px solid var(--amber-deep);
  border-radius: 3px;
  color: var(--amber-deep);
  letter-spacing: 0.06em;
  transform: rotate(-4deg);
}

.receipt-no {
  display: block;
  margin: 6px 0 12px;
  padding-bottom: 12px;
  border-bottom: 2px dashed var(--line-strong);
  font-size: 15px;
}

.receipt-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 11.5px;
}

.receipt-line div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.receipt-line span {
  white-space: nowrap;
}

.receipt-line div span {
  color: var(--muted);
  font-size: 10.5px;
}

.receipt-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 2px dashed var(--line-strong);
  font-size: 12px;
  font-weight: 700;
}

.receipt-total strong {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.01em;
}

/* judul ala spanduk */
.visual-copy {
  position: relative;
  max-width: 560px;
  margin-top: auto;
}

.visual-copy h1 {
  margin: 0 0 14px;
  color: #fff8ef;
  font-family: var(--font-display);
  font-size: clamp(44px, 5vw, 76px);
  font-weight: 400;
  letter-spacing: 0.01em;
  line-height: 1.04;
  text-shadow: 3px 3px 0 var(--brand-dark);
  text-transform: uppercase;
}

.visual-copy h1 span {
  display: block;
}

.visual-copy p {
  max-width: 440px;
  margin: 0;
  color: rgba(251, 243, 228, 0.9);
  font-size: 15px;
  line-height: 1.6;
}

.visual-footer {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 28px;
  color: rgba(251, 243, 228, 0.72);
  font-size: 12px;
}

/* ---------- Panel kanan: form ---------- */
.login-panel {
  display: grid;
  place-items: center;
  padding: 42px 40px;
  background: var(--bg);
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.login-eyebrow {
  display: block;
  color: var(--brand);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.login-card h2 {
  margin: 8px 0 10px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 400;
  letter-spacing: 0.01em;
  line-height: 1.05;
  text-transform: uppercase;
}

.login-subtitle {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.login-alert {
  margin-bottom: 16px;
  border-width: 2px;
  font-size: 13px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-form .field {
  gap: 7px;
}

.login-form .field-label {
  color: var(--ink);
  font-size: 13px;
}

.login-form .input {
  height: 50px;
  padding-top: 0;
  padding-bottom: 0;
  border: 2px solid var(--line-strong);
  border-radius: 8px;
  font-size: 14px;
}

.login-form .input::placeholder {
  color: var(--muted);
  opacity: 0.75;
}

.login-form .input:hover {
  border-color: var(--brand);
}

.login-form .input:focus {
  border-color: var(--brand-dark);
  box-shadow: 0 0 0 3px var(--amber);
  background: #fffdfa;
}

.login-form .input-with-icon > svg {
  left: 14px;
  color: var(--muted);
}

.login-form .input-with-icon .input {
  padding-left: 44px;
  padding-right: 48px;
}

.login-form .input-action {
  right: 7px;
  width: 36px;
  height: 36px;
  color: var(--muted);
}

.login-form .btn-primary {
  gap: 9px;
  height: 54px;
  margin-top: 4px;
  border: 2px solid var(--brand-dark);
  border-radius: 8px;
  color: var(--amber-light);
  background: var(--brand);
  box-shadow: 0 4px 0 var(--brand-dark);
  font-size: 15px;
  letter-spacing: 0.02em;
}

.login-form .btn-primary:hover:not(:disabled) {
  background: var(--brand-bright);
  transform: none;
}

.login-form .btn-primary:active:not(:disabled) {
  box-shadow: 0 1px 0 var(--brand-dark);
  transform: translateY(3px);
}

.login-form .btn-primary:disabled {
  opacity: 0.8;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(246, 231, 184, 0.35);
  border-top-color: var(--amber-light);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 28px 0 16px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.login-divider::before,
.login-divider::after {
  flex: 1;
  height: 2px;
  background: var(--line);
  content: '';
}

.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* kartu akun demo bergaya tiket */
.demo-account {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 72px;
  padding: 12px 14px;
  border: 2px dashed var(--line-strong);
  border-radius: 8px;
  background: var(--surface);
  text-align: left;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.demo-account:hover {
  border-color: var(--brand);
  border-style: solid;
  box-shadow: 4px 4px 0 var(--amber);
  transform: translate(-2px, -2px);
}

.demo-account:active {
  box-shadow: 1px 1px 0 var(--amber);
  transform: translate(1px, 1px);
}

.demo-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border: 2px solid var(--brand-dark);
  border-radius: 6px;
  color: var(--brand);
  background: var(--amber-light);
}

.demo-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.demo-meta strong {
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.demo-meta small {
  color: var(--muted);
  font-size: 12.5px;
}

.demo-credentials {
  margin-top: 2px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
}

.demo-chevron {
  margin-left: auto;
  color: var(--muted);
}

.login-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 22px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.55;
}

.login-note svg {
  flex: 0 0 auto;
  margin-top: 2px;
}

/* ---------- Responsif ---------- */
@media (max-width: 1399px) {
  .order-receipt {
    display: none;
  }
}

@media (max-width: 980px) {
  .login-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  /* panel kiri jadi banner foto di atas form */
  .login-visual {
    min-height: 250px;
    padding: 20px 20px 18px;
    border-right: 0;
    border-bottom: 6px solid var(--amber);
  }

  .visual-photo {
    height: 100%;
  }

  .brand-sign {
    width: 140px;
    height: 62px;
  }

  .disc-wrap {
    top: 20px;
    right: 20px;
  }

  .disc-badge {
    width: 70px;
    height: 79px;
  }

  .disc-badge small {
    font-size: 8px;
  }

  .disc-badge strong {
    font-size: 25px;
  }

  .visual-copy h1 {
    margin: 0;
    font-size: 32px;
    text-shadow: 2px 2px 0 var(--brand-dark);
  }

  .visual-copy p,
  .visual-footer {
    display: none;
  }

  .login-panel {
    align-items: start;
    padding: 28px 22px 44px;
  }

  .login-card h2 {
    font-size: 36px;
  }
}

@media (max-width: 420px) {
  .login-panel {
    padding: 24px 16px 34px;
  }

  .login-card h2 {
    font-size: 32px;
  }
}
</style>