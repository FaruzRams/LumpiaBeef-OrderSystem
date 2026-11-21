<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useAuthStore } from '../stores/auth'
import { useMenuStore } from '../stores/menu'
import { useOrderStore } from '../stores/orders'
import { useToast } from '../composables/useToast'
import { statusBerikutnya } from '../utils/constants'
import {
  formatJam,
  formatRupiah,
  formatTanggal,
  localDateKey,
} from '../utils/format'

const router = useRouter()
const auth = useAuthStore()
const menuStore = useMenuStore()
const orderStore = useOrderStore()
const toast = useToast()

const tanggalHariIni = formatTanggal(new Date())

const sapaan = computed(() => {
  const jam = new Date().getHours()
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 18) return 'Selamat sore'
  return 'Selamat malam'
})

const namaDepan = computed(() => auth.currentUser?.nama?.split(' ')[0] || 'Sahabat Obami')

const hariIni = computed(() => localDateKey(new Date()))

const pesananHariIni = computed(() =>
  orderStore.orders.filter((order) => localDateKey(order.tanggal) === hariIni.value),
)

const pesananLunasHariIni = computed(() =>
  pesananHariIni.value.filter((order) => order.statusPembayaran === 'Lunas'),
)

const pendapatanHariIni = computed(() =>
  pesananLunasHariIni.value.reduce((total, order) => total + order.total, 0),
)

const pesananBelumDibayar = computed(
  () => pesananHariIni.value.filter((order) => order.statusPembayaran !== 'Lunas').length,
)

const pesananDiproses = computed(
  () => orderStore.pesananAktif.filter((order) => order.status === 'Diproses').length,
)

const pesananSiap = computed(
  () => orderStore.pesananAktif.filter((order) => order.status === 'Siap Diambil').length,
)

const trendHarian = computed(() => {
  const sekarang = new Date()
  const data = Array.from({ length: 7 }, (_, index) => {
    const tanggal = new Date(sekarang)
    tanggal.setDate(sekarang.getDate() - (6 - index))
    const kunci = localDateKey(tanggal)
    const total = orderStore.orders
      .filter(
        (order) =>
          order.statusPembayaran === 'Lunas' && localDateKey(order.tanggal) === kunci,
      )
      .reduce((jumlah, order) => jumlah + order.total, 0)
    return {
      kunci,
      label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(tanggal),
      tanggal: tanggal.getDate(),
      total,
    }
  })
  const maksimum = Math.max(...data.map((item) => item.total), 1)
  return {
    data: data.map((item) => ({
      ...item,
      tinggi:
        item.total > 0 ? Math.max(8, Math.round((item.total / maksimum) * 100)) : 2,
    })),
    maksimum,
  }
})

const totalTujuhHari = computed(() =>
  trendHarian.value.data.reduce((total, item) => total + item.total, 0),
)

const pesananAktif = computed(() => orderStore.pesananAktif.slice(0, 4))
const transaksiTerbaru = computed(() => orderStore.daftarPesanan.slice(0, 6))

function bukaPesanan(order) {
  router.push({ name: 'pesanan', query: { order: order.id } })
}

function majukanStatus(order) {
  const berikutnya = statusBerikutnya(order.status)
  if (!berikutnya) return
  const hasil = orderStore.ubahStatus(order.id, berikutnya)
  if (hasil.ok) {
    toast.sukses(`Pesanan ${order.nomorPesanan} → ${berikutnya}.`)
  } else {
    toast.error(hasil.message)
  }
}
</script>

<template>
  <div class="dashboard">
    <section class="welcome-card">
      <span class="welcome-mark" aria-hidden="true">OBAMI</span>
      <div class="welcome-content">
        <span class="welcome-eyebrow">{{ tanggalHariIni }}</span>
        <h2>{{ sapaan }}, {{ namaDepan }}.</h2>
        <p>
          Pantau pesanan yang sedang berjalan dan pastikan seluruh transaksi hari ini
          tercatat dengan rapi.
        </p>
      </div>
      <div class="welcome-actions">
        <router-link :to="{ name: 'pesanan-baru' }" class="btn btn-accent">
          <AppIcon name="plus" :size="17" />
          Pesanan Baru
        </router-link>
        <router-link
          :to="{ name: auth.isPemilik ? 'laporan' : 'pesanan' }"
          class="btn btn-outline-light"
        >
          <AppIcon :name="auth.isPemilik ? 'chart' : 'receipt'" :size="16" />
          {{ auth.isPemilik ? 'Lihat Laporan' : 'Daftar Pesanan' }}
        </router-link>
      </div>
    </section>

    <section class="stat-grid">
      <article class="stat-card">
        <div class="stat-icon stat-amber"><AppIcon name="wallet" :size="19" /></div>
        <div class="stat-copy">
          <span class="stat-label">Penjualan hari ini</span>
          <strong class="stat-value">{{ formatRupiah(pendapatanHariIni) }}</strong>
          <span class="stat-hint">{{ pesananLunasHariIni.length }} transaksi lunas</span>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon stat-rose"><AppIcon name="receipt" :size="19" /></div>
        <div class="stat-copy">
          <span class="stat-label">Transaksi hari ini</span>
          <strong class="stat-value">{{ pesananHariIni.length }}</strong>
          <span class="stat-hint">
            {{ pesananBelumDibayar ? `${pesananBelumDibayar} belum dibayar` : 'Semua sudah dibayar' }}
          </span>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon stat-blue"><AppIcon name="clock" :size="19" /></div>
        <div class="stat-copy">
          <span class="stat-label">Pesanan aktif</span>
          <strong class="stat-value">{{ orderStore.pesananAktif.length }}</strong>
          <span class="stat-hint">{{ pesananDiproses }} diproses · {{ pesananSiap }} siap</span>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon stat-green"><AppIcon name="book" :size="19" /></div>
        <div class="stat-copy">
          <span class="stat-label">Menu tersedia</span>
          <strong class="stat-value">{{ menuStore.jumlahMenuTersedia }}</strong>
          <span class="stat-hint">
            dari {{ menuStore.jumlahMenu }} menu · {{ menuStore.jumlahTopping }} topping
          </span>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="card trend-card">
        <header class="card-head">
          <div>
            <span class="card-eyebrow">7 hari terakhir</span>
            <h3>Tren penjualan</h3>
          </div>
          <div class="trend-total">
            <span>Total</span>
            <strong>{{ formatRupiah(totalTujuhHari) }}</strong>
          </div>
        </header>

        <div class="trend-chart-shell">
          <div class="trend-chart">
            <div
              v-for="item in trendHarian.data"
              :key="item.kunci"
              class="trend-col"
              :title="`${item.label} ${item.tanggal}: ${formatRupiah(item.total)}`"
            >
              <span class="trend-value">{{ item.total ? formatRupiah(item.total) : '' }}</span>
              <div class="trend-track">
                <div
                  class="trend-bar"
                  :class="{ 'is-today': item.kunci === hariIni }"
                  :style="{ height: `${item.tinggi}%` }"
                />
              </div>
              <span class="trend-label" :class="{ 'is-today': item.kunci === hariIni }">
                {{ item.label }}
                <small>{{ item.tanggal }}</small>
              </span>
            </div>
          </div>

          <div v-if="!totalTujuhHari" class="trend-empty">
            <span><AppIcon name="trending" :size="17" /></span>
            <p>Belum ada penjualan lunas dalam 7 hari terakhir.</p>
          </div>
        </div>
      </article>

      <article class="card active-card">
        <header class="card-head">
          <div>
            <span class="card-eyebrow">Dapur &amp; kasir</span>
            <h3>Pesanan aktif</h3>
          </div>
          <router-link :to="{ name: 'pesanan' }" class="text-link">
            Semua
            <AppIcon name="chevronRight" :size="14" />
          </router-link>
        </header>

        <div v-if="pesananAktif.length" class="active-list">
          <div
            v-for="order in pesananAktif"
            :key="order.id"
            class="active-item"
          >
            <button type="button" class="active-info" @click="bukaPesanan(order)">
              <span class="active-number">{{ order.nomorPesanan }}</span>
              <span class="active-meta">
                {{ order.namaPelanggan || order.kanal }} ·
                {{ order.items.reduce((n, item) => n + item.jumlah, 0) }} pcs
              </span>
            </button>
            <StatusBadge :status="order.status" />
            <button
              v-if="statusBerikutnya(order.status)"
              type="button"
              class="mini-action"
              :title="`Tandai ${statusBerikutnya(order.status)}`"
              @click="majukanStatus(order)"
            >
              <AppIcon name="check" :size="13" />
              {{ statusBerikutnya(order.status) === 'Siap Diambil' ? 'Siap' : 'Selesai' }}
            </button>
          </div>
        </div>

        <div v-else class="mini-empty">
          <span><AppIcon name="checkCircle" :size="22" /></span>
          <p>Semua pesanan sudah selesai. Waktunya siapkan pesanan berikutnya.</p>
        </div>
      </article>
    </section>

    <section class="card recent-card">
      <header class="card-head">
        <div>
          <span class="card-eyebrow">Transaksi</span>
          <h3>Pesanan terbaru</h3>
        </div>
        <router-link :to="{ name: 'pesanan' }" class="text-link">
          Lihat semua
          <AppIcon name="arrowRight" :size="14" />
        </router-link>
      </header>

      <div v-if="transaksiTerbaru.length" class="recent-table-wrap">
        <table class="data-table recent-table">
          <thead>
            <tr>
              <th>Nomor</th>
              <th>Waktu</th>
              <th>Pelanggan / kanal</th>
              <th>Total</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th aria-label="Aksi" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in transaksiTerbaru"
              :key="order.id"
              class="clickable-row"
              @click="bukaPesanan(order)"
            >
              <td>
                <span class="order-number">{{ order.nomorPesanan }}</span>
              </td>
              <td class="muted-cell">{{ formatJam(order.tanggal) }}</td>
              <td>
                <span class="customer-name">
                  {{ order.namaPelanggan || `Pelanggan ${order.kanal}` }}
                </span>
                <span class="channel-tag">{{ order.kanal }}</span>
              </td>
              <td class="amount-cell">{{ formatRupiah(order.total) }}</td>
              <td>
                <StatusBadge
                  v-if="order.statusPembayaran === 'Lunas'"
                  :status="order.metodePembayaran"
                  jenis="pembayaran"
                />
                <StatusBadge v-else status="Belum Dibayar" jenis="pembayaran" />
              </td>
              <td><StatusBadge :status="order.status" /></td>
              <td class="row-chevron"><AppIcon name="chevronRight" :size="15" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state compact">
        <span class="empty-icon"><AppIcon name="receipt" :size="26" /></span>
        <h4>Belum ada transaksi</h4>
        <p>Pesanan pertama hari ini akan tampil di sini setelah disimpan.</p>
        <router-link :to="{ name: 'pesanan-baru' }" class="btn btn-primary btn-sm">
          <AppIcon name="plus" :size="15" />
          Buat pesanan
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 178px;
  padding: 26px 30px;
  overflow: hidden;
  border: 1px solid #73201c;
  border-radius: 6px;
  color: #fff4d8;
  background:
    linear-gradient(90deg, transparent 0 68%, rgba(255, 244, 216, 0.07) 68% 68.35%, transparent 68.35%),
    repeating-linear-gradient(135deg, rgba(255, 244, 216, 0.018) 0 1px, transparent 1px 8px),
    #982723;
  box-shadow: 0 16px 32px -28px rgba(89, 27, 23, 0.75);
}

.welcome-card::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(255, 244, 216, 0.2);
  pointer-events: none;
}

.welcome-mark {
  position: absolute;
  right: 16px;
  bottom: -24px;
  color: rgba(255, 244, 216, 0.07);
  font-family: var(--font-display);
  font-size: clamp(76px, 9vw, 118px);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 1;
  pointer-events: none;
}

.welcome-content {
  position: relative;
  z-index: 1;
  max-width: 620px;
}

.welcome-eyebrow {
  display: block;
  width: fit-content;
  margin-bottom: 11px;
  padding-bottom: 5px;
  border-bottom: 2px solid var(--amber);
  color: #ffe5a6;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.welcome-content h2 {
  margin: 0 0 7px;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.welcome-content p {
  margin: 0;
  max-width: 540px;
  color: rgba(255, 244, 216, 0.78);
  font-size: 11px;
  line-height: 1.6;
}

.welcome-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 17px;
  border: 1px solid var(--line);
  border-top: 3px solid var(--brand);
  border-radius: 4px;
  background: var(--surface);
  box-shadow: none;
}

.stat-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 39px;
  height: 39px;
  border-radius: 11px;
}

.stat-amber { color: #9a6316; background: #fdf1dc; }
.stat-rose { color: var(--brand); background: var(--brand-soft); }
.stat-blue { color: #2f6690; background: var(--blue-soft); }
.stat-green { color: var(--green); background: var(--green-soft); }

.stat-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-label {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.stat-value {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 23px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.stat-hint {
  margin-top: 5px;
  color: var(--muted-light);
  font-size: 9.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.85fr);
  gap: 16px;
}

.trend-card,
.active-card,
.recent-card {
  padding: 20px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.card-eyebrow {
  display: block;
  margin-bottom: 4px;
  color: var(--muted-light);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-head h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.trend-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}

.trend-total span {
  color: var(--muted-light);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.trend-total strong {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--brand);
}

.trend-chart-shell {
  position: relative;
}

.trend-chart {
  display: flex;
  align-items: stretch;
  gap: 8px;
  height: 188px;
  padding-top: 4px;
}

.trend-empty {
  position: absolute;
  top: 8px;
  right: 0;
  bottom: 34px;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--muted-light);
  text-align: center;
  pointer-events: none;
}

.trend-empty span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px dashed var(--line-strong);
  border-radius: 50%;
  color: var(--amber-deep);
  background: rgba(253, 243, 227, 0.7);
}

.trend-empty p {
  max-width: 230px;
  margin: 0;
  font-size: 9px;
  line-height: 1.5;
}

.trend-col {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.trend-value {
  min-height: 13px;
  color: var(--muted-light);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.trend-col:hover .trend-value {
  opacity: 1;
}

.trend-track {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  min-height: 0;
}

.trend-bar {
  width: min(32px, 70%);
  border-radius: 6px 6px 3px 3px;
  background: linear-gradient(to top, #e9cba3, #f0dfc8);
  transition: height 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.trend-bar.is-today {
  background: linear-gradient(to top, var(--brand), #d76b4f);
  box-shadow: 0 6px 14px -6px rgba(178, 59, 37, 0.6);
}

.trend-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--muted);
  font-size: 9px;
  font-weight: 600;
  text-transform: capitalize;
  line-height: 1.3;
}

.trend-label small {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 400;
}

.trend-label.is-today {
  color: var(--brand);
  font-weight: 700;
}

.active-list {
  display: flex;
  flex-direction: column;
}

.active-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 0;
  border-top: 1px solid var(--line-soft);
}

.active-item:first-child {
  border-top: 0;
  padding-top: 2px;
}

.active-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.active-number {
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-meta {
  overflow: hidden;
  color: var(--muted-light);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-action {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 7px;
  border: 1px solid rgba(47, 125, 91, 0.22);
  border-radius: 7px;
  color: var(--green);
  background: var(--green-soft);
  font-size: 8.5px;
  font-weight: 700;
  white-space: nowrap;
}

.mini-action:hover {
  background: #d8eee3;
}

.mini-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 26px 16px;
  border: 1px dashed var(--line);
  border-radius: 13px;
  text-align: center;
}

.mini-empty span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: var(--green);
  background: var(--green-soft);
}

.mini-empty p {
  max-width: 210px;
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.55;
}

.recent-table-wrap {
  overflow-x: auto;
}

.recent-table {
  min-width: 700px;
}

.order-number {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
}

.muted-cell {
  color: var(--muted) !important;
  font-variant-numeric: tabular-nums;
}

.customer-name {
  display: block;
  color: var(--ink);
  font-weight: 500;
}

.channel-tag {
  display: block;
  margin-top: 2px;
  color: var(--muted-light);
  font-size: 9px;
}

.amount-cell {
  color: var(--ink) !important;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.row-chevron {
  width: 24px;
  color: var(--muted-light);
  text-align: right;
}

@media (max-width: 1240px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px;
  }

  .welcome-content h2 {
    font-size: 25px;
  }

  .welcome-actions {
    width: 100%;
  }

  .welcome-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .trend-chart {
    height: 155px;
    gap: 4px;
  }

  .trend-value {
    display: none;
  }

  .recent-card,
  .trend-card,
  .active-card {
    padding: 16px;
  }
}

.welcome-card {
  min-height: 190px;
  border: 2px solid var(--brand-dark);
  border-radius: var(--radius-lg);
  background:
    repeating-conic-gradient(from 0deg at 82% 48%, rgba(246, 231, 184, 0.065) 0deg 5deg, transparent 5deg 15deg),
    linear-gradient(100deg, var(--brand-dark) 0%, var(--brand) 66%, #a91f20 100%);
  box-shadow: 0 12px 26px -24px rgba(94, 15, 16, 0.9);
}

.welcome-card::before {
  inset: 10px;
  border: 1px solid rgba(246, 231, 184, 0.42);
}

.welcome-content h2 {
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  text-shadow: 3px 3px 0 var(--brand-dark);
}

.welcome-eyebrow {
  border-bottom: 3px solid var(--amber);
  font-family: var(--font-mono);
  color: var(--amber-light);
  letter-spacing: 0.08em;
}

.welcome-content p {
  color: #fff7df;
  font-size: 12px;
}

.welcome-actions .btn-accent {
  border: 2px solid #fff1b9;
  color: var(--brand-dark);
  background: var(--amber);
  box-shadow: 3px 3px 0 rgba(94, 15, 16, 0.8);
}

.welcome-actions .btn-accent:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(94, 15, 16, 0.8);
}

.stat-grid {
  grid-template-columns: minmax(280px, 1.5fr) repeat(3, minmax(150px, 1fr));
}

.stat-card {
  min-height: 112px;
  border: 1px solid var(--line);
  border-top: 4px solid var(--brand);
  border-radius: var(--radius);
}

.stat-card:first-child {
  grid-row: span 1;
  border-top: 0;
  border-left: 6px solid var(--amber);
  background: var(--brand);
  color: #fff7df;
}

.stat-card:first-child .stat-label,
.stat-card:first-child .stat-hint {
  color: #f8dfab;
}

.stat-card:first-child .stat-value {
  color: #fff7df;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.stat-card:first-child .stat-icon {
  color: var(--brand-dark);
  background: var(--amber);
}

.stat-icon {
  border-radius: 3px;
}

.stat-value {
  font-family: var(--font-display);
  font-weight: 400;
}

.trend-card,
.active-card,
.recent-card {
  border-top: 4px solid var(--brand);
  border-radius: var(--radius);
  box-shadow: none;
}

.card-head h3 {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.trend-track {
  border-left: 1px solid var(--line-soft);
  background:
    repeating-linear-gradient(to bottom, var(--line-soft) 0 1px, transparent 1px 25%);
}

.trend-bar {
  width: 72%;
  margin: 0 auto;
  border: 1px solid var(--brand-dark);
  border-bottom: 0;
  border-radius: 3px 3px 0 0;
  background: var(--brand);
}

.trend-bar.is-today {
  background: var(--amber);
}

.active-item {
  border: 1px solid var(--line);
  border-left: 5px solid var(--amber);
  border-radius: 4px;
  background: #fffdf7;
}

.active-number,
.order-number {
  font-family: var(--font-mono);
  font-weight: 800;
  letter-spacing: 0;
}

.mini-action {
  min-height: 44px;
  border: 2px solid var(--brand-dark);
  border-radius: 4px;
  color: #fff7df;
  background: var(--brand);
  font-weight: 800;
}

@media (max-width: 1080px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-card:first-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .welcome-card {
    min-height: 220px;
  }

  .welcome-content h2 {
    font-size: 29px;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .stat-card:first-child {
    grid-column: auto;
  }
}
</style>
