<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useOrderStore } from '../stores/orders'
import { useToast } from '../composables/useToast'
import {
  KANAL_PESANAN,
  METODE_PEMBAYARAN,
} from '../utils/constants'
import {
  formatAngka,
  formatJam,
  formatRupiah,
  formatTanggal,
  formatTanggalPendek,
  labelBulanDariKey,
  labelTanggalDariKey,
  localDateKey,
  localMonthKey,
  monthInputValue,
  todayInputValue,
} from '../utils/format'

const orderStore = useOrderStore()
const toast = useToast()

const periode = ref('harian')
const tanggal = ref(todayInputValue())
const bulan = ref(monthInputValue())

const pesananPeriode = computed(() => {
  if (periode.value === 'harian') {
    return orderStore.daftarPesanan.filter(
      (order) => localDateKey(order.tanggal) === tanggal.value,
    )
  }
  return orderStore.daftarPesanan.filter(
    (order) => localMonthKey(order.tanggal) === bulan.value,
  )
})

const pesananLunas = computed(() =>
  pesananPeriode.value.filter((order) => order.statusPembayaran === 'Lunas'),
)

const pesananBelumLunas = computed(() =>
  pesananPeriode.value.filter((order) => order.statusPembayaran !== 'Lunas'),
)

const totalPenjualan = computed(() =>
  pesananLunas.value.reduce((total, order) => total + order.total, 0),
)

const totalBelumDibayar = computed(() =>
  pesananBelumLunas.value.reduce((total, order) => total + order.total, 0),
)

const rataRata = computed(() =>
  pesananLunas.value.length ? totalPenjualan.value / pesananLunas.value.length : 0,
)

const itemTerjual = computed(() =>
  pesananLunas.value.reduce(
    (total, order) =>
      total + order.items.reduce((jumlah, item) => jumlah + item.jumlah, 0),
    0,
  ),
)

const labelPeriode = computed(() =>
  periode.value === 'harian'
    ? labelTanggalDariKey(tanggal.value)
    : labelBulanDariKey(bulan.value),
)

const perKanal = computed(() => {
  const data = KANAL_PESANAN.map((kanal) => {
    const daftar = pesananPeriode.value.filter((order) => order.kanal === kanal)
    const lunas = daftar.filter((order) => order.statusPembayaran === 'Lunas')
    return {
      kanal,
      jumlah: daftar.length,
      pendapatan: lunas.reduce((total, order) => total + order.total, 0),
    }
  })
  const maksimum = Math.max(...data.map((item) => item.jumlah), 1)
  return data.map((item) => ({
    ...item,
    persen: item.jumlah ? Math.max(4, Math.round((item.jumlah / maksimum) * 100)) : 0,
  }))
})

const perMetode = computed(() => {
  const data = METODE_PEMBAYARAN.map((metode) => {
    const daftar = pesananLunas.value.filter(
      (order) => order.metodePembayaran === metode,
    )
    const total = daftar.reduce((jumlah, order) => jumlah + order.total, 0)
    return {
      metode,
      jumlah: daftar.length,
      total,
      persen: totalPenjualan.value
        ? Math.round((total / totalPenjualan.value) * 100)
        : 0,
    }
  })
  return data
})

const donutStyle = computed(() => {
  if (!totalPenjualan.value) {
    return { background: 'conic-gradient(var(--line-soft) 0% 100%)' }
  }
  const tunai = perMetode.value.find((item) => item.metode === 'Tunai')
  const porsiTunai = (tunai.total / totalPenjualan.value) * 100
  return {
    background: `conic-gradient(var(--brand) 0% ${porsiTunai}%, #d99a43 ${porsiTunai}% 100%)`,
  }
})

const menuTerlaris = computed(() => {
  const peta = new Map()

  pesananLunas.value.forEach((order) => {
    order.items.forEach((item) => {
      const kunci = item.namaMenuSnapshot
      const data = peta.get(kunci) || { nama: kunci, jumlah: 0, pendapatan: 0 }
      data.jumlah += item.jumlah
      data.pendapatan += item.totalItem
      peta.set(kunci, data)
    })
  })

  const daftar = [...peta.values()].sort((a, b) => b.jumlah - a.jumlah).slice(0, 5)
  const maksimum = Math.max(...daftar.map((item) => item.jumlah), 1)
  return daftar.map((item) => ({
    ...item,
    persen: Math.max(5, Math.round((item.jumlah / maksimum) * 100)),
  }))
})

const ringkasanItem = computed(() => {
  const totalPesanan = pesananPeriode.value.length
  const totalPcs = pesananPeriode.value.reduce(
    (total, order) =>
      total + order.items.reduce((jumlah, item) => jumlah + item.jumlah, 0),
    0,
  )
  return { totalPesanan, totalPcs }
})

function aturHariIni() {
  periode.value = 'harian'
  tanggal.value = todayInputValue()
}

function aturBulanIni() {
  periode.value = 'bulanan'
  bulan.value = monthInputValue()
}

function unduhCsv() {
  if (!pesananPeriode.value.length) {
    toast.info('Tidak ada transaksi pada periode ini untuk diunduh.')
    return
  }

  const baris = [
    [
      'Nomor Pesanan',
      'Tanggal',
      'Jam',
      'Kanal',
      'Pelanggan',
      'Item',
      'Jumlah Item',
      'Subtotal',
      'Metode',
      'Status Pembayaran',
      'Status Pesanan',
      'Total',
    ],
    ...pesananPeriode.value.map((order) => [
      order.nomorPesanan,
      formatTanggalPendek(order.tanggal),
      formatJam(order.tanggal),
      order.kanal,
      order.namaPelanggan || '',
      order.items
        .map((item) => `${item.namaMenuSnapshot} x${item.jumlah}`)
        .join('; '),
      order.items.reduce((jumlah, item) => jumlah + item.jumlah, 0),
      order.subtotal,
      order.metodePembayaran || 'Belum dibayar',
      order.statusPembayaran,
      order.status,
      order.total,
    ]),
  ]

  const isi = baris
    .map((row) => row.map((sel) => `"${String(sel).replaceAll('"', '""')}"`).join(';'))
    .join('\r\n')

  const blob = new Blob([`\uFEFF${isi}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const tautan = document.createElement('a')
  const kunci =
    periode.value === 'harian' ? tanggal.value : bulan.value
  tautan.href = url
  tautan.download = `laporan-lbd-${kunci}.csv`
  document.body.appendChild(tautan)
  tautan.click()
  document.body.removeChild(tautan)
  URL.revokeObjectURL(url)
  toast.sukses('Laporan CSV berhasil diunduh.')
}
</script>

<template>
  <div class="report-page">
    <section class="report-toolbar">
      <div class="period-block">
        <span class="filter-label">Periode laporan</span>
        <div class="period-switch">
          <button
            type="button"
            :class="{ 'is-active': periode === 'harian' }"
            @click="periode = 'harian'"
          >
            <AppIcon name="calendar" :size="14" />
            Harian
          </button>
          <button
            type="button"
            :class="{ 'is-active': periode === 'bulanan' }"
            @click="periode = 'bulanan'"
          >
            <AppIcon name="chart" :size="14" />
            Bulanan
          </button>
        </div>
      </div>

      <div class="period-picker">
        <label v-if="periode === 'harian'" class="date-field">
          <span>Tanggal</span>
          <input v-model="tanggal" type="date" class="input" />
        </label>
        <label v-else class="date-field">
          <span>Bulan</span>
          <input v-model="bulan" type="month" class="input" />
        </label>

        <button
          type="button"
          class="btn btn-ghost btn-sm quick-period"
          @click="periode === 'harian' ? aturHariIni() : aturBulanIni()"
        >
          {{ periode === 'harian' ? 'Hari ini' : 'Bulan ini' }}
        </button>
      </div>

      <button type="button" class="btn btn-outline btn-sm export-btn" @click="unduhCsv">
        <AppIcon name="download" :size="15" />
        Unduh CSV
      </button>
    </section>

    <div class="report-context">
      <span>
        Ringkasan untuk <strong>{{ labelPeriode }}</strong>
      </span>
      <span class="report-context-note">
        <AppIcon name="info" :size="13" />
        Penjualan menghitung transaksi berstatus Lunas.
      </span>
    </div>

    <section class="report-stats">
      <article class="report-stat report-stat-primary">
        <span class="report-stat-label">Total penjualan</span>
        <strong>{{ formatRupiah(totalPenjualan) }}</strong>
        <p>{{ pesananLunas.length }} transaksi lunas</p>
        <div class="report-stat-icon"><AppIcon name="wallet" :size="20" /></div>
      </article>

      <article class="report-stat">
        <span class="report-stat-label">Jumlah transaksi</span>
        <strong>{{ ringkasanItem.totalPesanan }}</strong>
        <p>{{ formatAngka(ringkasanItem.totalPcs) }} item tercatat</p>
        <div class="report-stat-icon"><AppIcon name="receipt" :size="19" /></div>
      </article>

      <article class="report-stat">
        <span class="report-stat-label">Belum dibayar</span>
        <strong :class="{ 'is-zero': totalBelumDibayar === 0 }">
          {{ formatRupiah(totalBelumDibayar) }}
        </strong>
        <p>{{ pesananBelumLunas.length }} pesanan menunggu pembayaran</p>
        <div class="report-stat-icon"><AppIcon name="clock" :size="19" /></div>
      </article>

      <article class="report-stat">
        <span class="report-stat-label">Rata-rata transaksi</span>
        <strong>{{ formatRupiah(rataRata) }}</strong>
        <p>{{ itemTerjual }} pcs terjual (lunas)</p>
        <div class="report-stat-icon"><AppIcon name="trending" :size="19" /></div>
      </article>
    </section>

    <section class="analysis-grid">
      <article class="card analysis-card">
        <header class="card-head">
          <div>
            <span class="card-eyebrow">Distribusi</span>
            <h3>Kanal pesanan</h3>
          </div>
          <span class="analysis-total">{{ ringkasanItem.totalPesanan }} trx</span>
        </header>

        <div class="channel-bars">
          <div v-for="kanal in perKanal" :key="kanal.kanal" class="bar-item">
            <div class="bar-head">
              <span class="bar-label">{{ kanal.kanal }}</span>
              <span class="bar-value">
                {{ kanal.jumlah }} trx · {{ formatRupiah(kanal.pendapatan) }}
              </span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :class="`bar-${kanal.kanal.toLowerCase()}`"
                :style="{ width: `${kanal.persen}%` }"
              />
            </div>
          </div>
        </div>

        <p class="analysis-note">
          Pendapatan per kanal hanya menghitung transaksi yang sudah lunas.
        </p>
      </article>

      <article class="card analysis-card">
        <header class="card-head">
          <div>
            <span class="card-eyebrow">Komposisi</span>
            <h3>Metode pembayaran</h3>
          </div>
        </header>

        <div v-if="totalPenjualan" class="payment-analysis">
          <div class="donut" :style="donutStyle">
            <div class="donut-center">
              <span>Lunas</span>
              <strong>{{ formatRupiah(totalPenjualan) }}</strong>
            </div>
          </div>
          <div class="payment-legend">
            <div
              v-for="(metode, index) in perMetode"
              :key="metode.metode"
              class="legend-item"
            >
              <span class="legend-dot" :class="`legend-${index}`" />
              <div>
                <strong>{{ metode.metode }}</strong>
                <span>{{ metode.jumlah }} trx · {{ metode.persen }}%</span>
              </div>
              <span class="legend-total">{{ formatRupiah(metode.total) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="analysis-empty">
          <span><AppIcon name="wallet" :size="22" /></span>
          <p>Belum ada pembayaran lunas pada periode ini.</p>
        </div>
      </article>

      <article class="card analysis-card">
        <header class="card-head">
          <div>
            <span class="card-eyebrow">Terlaris</span>
            <h3>Menu favorit</h3>
          </div>
        </header>

        <div v-if="menuTerlaris.length" class="top-menu-list">
          <div
            v-for="(menu, index) in menuTerlaris"
            :key="menu.nama"
            class="top-menu-item"
          >
            <span class="top-menu-rank">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="top-menu-copy">
              <div class="top-menu-head">
                <strong>{{ menu.nama }}</strong>
                <span>{{ menu.jumlah }} pcs</span>
              </div>
              <div class="top-menu-track">
                <div
                  class="top-menu-fill"
                  :style="{ width: `${menu.persen}%` }"
                />
              </div>
              <span class="top-menu-revenue">{{ formatRupiah(menu.pendapatan) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="analysis-empty">
          <span><AppIcon name="utensils" :size="21" /></span>
          <p>Menu terlaris muncul setelah ada transaksi lunas.</p>
        </div>
      </article>
    </section>

    <section class="card report-table-card">
      <header class="card-head">
        <div>
          <span class="card-eyebrow">Rincian</span>
          <h3>Transaksi pada periode ini</h3>
        </div>
        <span class="analysis-total">{{ pesananPeriode.length }} baris</span>
      </header>

      <div v-if="pesananPeriode.length" class="report-table-wrap">
        <table class="data-table report-table">
          <thead>
            <tr>
              <th>Nomor</th>
              <th>Tanggal</th>
              <th>Pelanggan / kanal</th>
              <th>Item</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in pesananPeriode" :key="order.id">
              <td>
                <span class="order-number">{{ order.nomorPesanan }}</span>
              </td>
              <td class="muted-cell">
                {{ formatTanggalPendek(order.tanggal) }}
                <small>{{ formatJam(order.tanggal) }}</small>
              </td>
              <td>
                <span class="customer-name">
                  {{ order.namaPelanggan || `Pelanggan ${order.kanal}` }}
                </span>
                <span class="channel-tag">{{ order.kanal }}</span>
              </td>
              <td class="muted-cell">
                {{ order.items.reduce((n, item) => n + item.jumlah, 0) }} pcs
              </td>
              <td>
                <StatusBadge
                  :status="order.statusPembayaran"
                  jenis="pembayaran"
                />
                <span v-if="order.metodePembayaran" class="payment-method">
                  {{ order.metodePembayaran }}
                </span>
              </td>
              <td><StatusBadge :status="order.status" /></td>
              <td class="amount-cell">{{ formatRupiah(order.total) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6">Total penjualan lunas</td>
              <td class="amount-cell">{{ formatRupiah(totalPenjualan) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-else class="empty-state compact report-empty">
        <span class="empty-icon"><AppIcon name="chart" :size="26" /></span>
        <h4>Belum ada transaksi</h4>
        <p>
          Tidak ada pesanan pada {{ labelPeriode }}. Pilih periode lain atau catat
          pesanan baru terlebih dahulu.
        </p>
        <router-link :to="{ name: 'pesanan-baru' }" class="btn btn-primary btn-sm">
          <AppIcon name="plus" :size="15" />
          Buat pesanan
        </router-link>
      </div>
    </section>

    <p class="report-footnote">
      <AppIcon name="info" :size="14" />
      Laporan dihitung dari data Local Storage browser ini. Data tidak termasuk
      transaksi yang belum dibayar pada angka penjualan.
    </p>
  </div>
</template>

<style scoped>
.report-page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.report-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 17px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.period-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.period-switch {
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-alt);
}

.period-switch button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 5px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
}

.period-switch button.is-active {
  color: var(--brand);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.period-picker {
  display: flex;
  align-items: flex-end;
  gap: 7px;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-field > span {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.date-field .input {
  padding: 7px 9px;
  font-size: 10px;
  color: var(--ink);
}

.quick-period {
  padding: 7px 9px;
  font-size: 9px;
}

.export-btn {
  margin-left: auto;
}

.report-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
  color: var(--muted);
  font-size: 10px;
}

.report-context strong {
  color: var(--ink);
  font-weight: 600;
}

.report-context-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted-light);
  font-size: 8.5px;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.report-stat {
  position: relative;
  padding: 17px 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.report-stat-primary {
  color: #fbf3e8;
  border-color: transparent;
  background:
    radial-gradient(circle at 95% 0%, rgba(233, 162, 59, 0.25), transparent 45%),
    linear-gradient(130deg, #2d1f15, #24180f);
}

.report-stat-label {
  display: block;
  margin-bottom: 7px;
  color: var(--muted);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.report-stat-primary .report-stat-label {
  color: rgba(248, 239, 228, 0.55);
}

.report-stat > strong {
  display: block;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.report-stat-primary > strong {
  color: #fff8ef;
}

.report-stat > strong.is-zero {
  color: var(--muted-light);
}

.report-stat p {
  margin: 6px 0 0;
  color: var(--muted-light);
  font-size: 8.5px;
  line-height: 1.4;
}

.report-stat-primary p {
  color: rgba(248, 239, 228, 0.45);
}

.report-stat-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: var(--muted-light);
  background: var(--surface-alt);
}

.report-stat-primary .report-stat-icon {
  color: var(--amber);
  background: rgba(255, 255, 255, 0.07);
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.analysis-card {
  padding: 17px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 15px;
}

.card-eyebrow {
  display: block;
  margin-bottom: 3px;
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.card-head h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.analysis-total {
  padding: 4px 7px;
  border-radius: 5px;
  color: var(--muted);
  background: var(--surface-alt);
  font-size: 8px;
  font-weight: 700;
}

.channel-bars {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding-top: 2px;
}

.bar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.bar-label {
  color: var(--ink);
  font-size: 9.5px;
  font-weight: 600;
}

.bar-value {
  color: var(--muted-light);
  font-size: 8px;
  font-variant-numeric: tabular-nums;
}

.bar-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-alt);
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--brand);
  transition: width 0.4s ease;
}

.bar-gofood {
  background: #2f8a67;
}

.bar-grabfood {
  background: #d99a43;
}

.bar-pickup {
  background: #2f6690;
}

.analysis-note {
  margin: 15px 0 0;
  padding-top: 11px;
  border-top: 1px solid var(--line-soft);
  color: var(--muted-light);
  font-size: 8px;
  line-height: 1.5;
}

.payment-analysis {
  display: flex;
  align-items: center;
  gap: 16px;
}

.donut {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 108px;
  height: 108px;
  border-radius: 50%;
}

.donut::before {
  position: absolute;
  inset: 13px;
  border-radius: 50%;
  background: var(--surface);
  content: '';
}

.donut-center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  text-align: center;
}

.donut-center span {
  color: var(--muted-light);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.donut-center strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 600;
}

.payment-legend {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 11px;
  min-width: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand);
}

.legend-1 {
  background: #d99a43;
}

.legend-item > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.legend-item strong {
  color: var(--ink);
  font-size: 9.5px;
  font-weight: 600;
}

.legend-item div span {
  color: var(--muted-light);
  font-size: 8px;
}

.legend-total {
  margin-left: auto;
  color: var(--ink);
  font-size: 9px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.top-menu-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.top-menu-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.top-menu-rank {
  margin-top: 1px;
  color: var(--muted-light);
  font-family: var(--font-mono);
  font-size: 8px;
}

.top-menu-copy {
  flex: 1;
  min-width: 0;
}

.top-menu-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.top-menu-head strong {
  overflow: hidden;
  color: var(--ink);
  font-size: 9px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-menu-head span {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 8px;
}

.top-menu-track {
  height: 4px;
  margin-top: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-alt);
}

.top-menu-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(to right, var(--amber), #e3b16c);
}

.top-menu-revenue {
  display: block;
  margin-top: 2px;
  color: var(--muted-light);
  font-size: 7.5px;
  font-variant-numeric: tabular-nums;
}

.analysis-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 10px;
  text-align: center;
}

.analysis-empty span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--muted-light);
  background: var(--surface-alt);
}

.analysis-empty p {
  max-width: 180px;
  margin: 0;
  color: var(--muted-light);
  font-size: 8.5px;
  line-height: 1.55;
}

.report-table-card {
  padding: 18px;
}

.report-table-wrap {
  overflow-x: auto;
}

.report-table {
  min-width: 780px;
}

.order-number {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
}

.muted-cell {
  color: var(--muted) !important;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.muted-cell small {
  display: block;
  color: var(--muted-light);
  font-size: 8px;
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
  font-size: 8px;
}

.payment-method {
  display: block;
  margin-top: 3px;
  color: var(--muted-light);
  font-size: 8px;
}

.amount-cell {
  color: var(--ink) !important;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.report-table tfoot td {
  border-top: 1px solid var(--line);
  color: var(--ink);
  background: var(--surface-alt);
  font-weight: 700;
}

.report-table tfoot td:first-child {
  text-align: right;
}

.report-empty {
  padding: 40px 20px;
}

.report-empty h4 {
  margin: 10px 0 4px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.report-empty p {
  max-width: 360px;
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
}

.report-footnote {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  padding: 0 4px;
  color: var(--muted-light);
  font-size: 8.5px;
  line-height: 1.55;
}

.report-footnote svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

@media (max-width: 1080px) {
  .report-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .analysis-grid {
    grid-template-columns: 1fr 1fr;
  }

  .analysis-card:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 800px) {
  .report-toolbar {
    flex-wrap: wrap;
    align-items: stretch;
  }

  .period-picker {
    flex: 1;
  }

  .date-field {
    flex: 1;
  }

  .date-field .input {
    width: 100%;
  }

  .export-btn {
    margin-left: 0;
  }
}

@media (max-width: 720px) {
  .report-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .period-switch {
    width: 100%;
  }

  .period-switch button {
    flex: 1;
    justify-content: center;
  }

  .period-picker {
    width: 100%;
  }

  .quick-period {
    flex: 0 0 auto;
  }

  .export-btn {
    justify-content: center;
  }

  .report-context-note {
    display: none;
  }

  .report-stats {
    grid-template-columns: 1fr;
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .analysis-card:last-child {
    grid-column: span 1;
  }

  .payment-analysis {
    justify-content: center;
  }

  .report-table-card {
    padding: 14px;
  }
}
</style>
