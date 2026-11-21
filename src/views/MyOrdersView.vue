<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import BaseModal from '../components/BaseModal.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useAuthStore } from '../stores/auth'
import { useOrderStore } from '../stores/orders'
import { useToast } from '../composables/useToast'
import {
  formatJam,
  formatRupiah,
  formatTanggal,
  formatTanggalPendek,
} from '../utils/format'

const LANGKAH = [
  {
    status: 'Diproses',
    judul: 'Diproses',
    keterangan: 'Dibayar & disiapkan',
    icon: 'utensils',
  },
  {
    status: 'Siap Diambil',
    judul: 'Siap Diambil',
    keterangan: 'Ambil di outlet',
    icon: 'bag',
  },
  {
    status: 'Selesai',
    judul: 'Selesai',
    keterangan: 'Pesanan diterima',
    icon: 'checkCircle',
  },
]

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orderStore = useOrderStore()
const toast = useToast()

const statusFilter = ref('Semua')
const detailOpen = ref(false)
const selectedId = ref(null)

const namaDepan = computed(
  () => auth.currentUser?.nama?.split(' ')[0] || 'Sahabat Obami',
)

const pesananSaya = computed(() =>
  orderStore.daftarPesanan.filter(
    (order) => order.pembeliId === auth.currentUser?.id,
  ),
)

const pesananAktif = computed(() =>
  pesananSaya.value.filter((order) => order.status !== 'Selesai'),
)

const pesananSiap = computed(
  () => pesananSaya.value.filter((order) => order.status === 'Siap Diambil').length,
)

const totalBelanja = computed(() =>
  pesananSaya.value
    .filter((order) => order.statusPembayaran === 'Lunas')
    .reduce((total, order) => total + order.total, 0),
)

const tabStatus = computed(() => [
  { value: 'Semua', label: 'Semua', jumlah: pesananSaya.value.length },
  {
    value: 'Diproses',
    label: 'Diproses',
    jumlah: pesananSaya.value.filter((order) => order.status === 'Diproses').length,
  },
  {
    value: 'Siap Diambil',
    label: 'Siap Diambil',
    jumlah: pesananSaya.value.filter((order) => order.status === 'Siap Diambil')
      .length,
  },
  {
    value: 'Selesai',
    label: 'Selesai',
    jumlah: pesananSaya.value.filter((order) => order.status === 'Selesai').length,
  },
])

const pesananTerfilter = computed(() => {
  if (statusFilter.value === 'Semua') return pesananSaya.value
  return pesananSaya.value.filter((order) => order.status === statusFilter.value)
})

const selectedOrder = computed(() =>
  selectedId.value
    ? pesananSaya.value.find((order) => order.id === selectedId.value) || null
    : null,
)

function indeksStatus(status) {
  return LANGKAH.findIndex((langkah) => langkah.status === status)
}

function keadaanLangkah(order, langkah) {
  const sekarang = indeksStatus(order.status)
  const posisi = indeksStatus(langkah.status)

  if (posisi < sekarang) return 'is-done'
  if (posisi === sekarang) return 'is-current'
  return 'is-upcoming'
}

function ringkasanItem(order) {
  const jumlah = order.items.reduce((total, item) => total + item.jumlah, 0)
  const nama = order.items.map((item) => item.namaMenuSnapshot)
  if (!nama.length) return 'Tidak ada item'
  return `${nama[0]}${nama.length > 1 ? ` +${nama.length - 1} menu lain` : ''} · ${jumlah} pcs`
}

function bukaDetail(order) {
  if (!order || order.pembeliId !== auth.currentUser?.id) return
  selectedId.value = order.id
  detailOpen.value = true
}

function tutupDetail() {
  detailOpen.value = false
  selectedId.value = null

  if (route.query.order) {
    const query = { ...route.query }
    delete query.order
    router.replace({ query })
  }
}

function pesanLagi() {
  router.push({ name: 'pesan' })
}

watch(
  () => route.query.order,
  (id) => {
    if (!id) return
    const order = pesananSaya.value.find((item) => item.id === String(id))
    if (order) {
      bukaDetail(order)
    } else {
      toast.error('Pesanan yang diminta tidak ditemukan.')
      const query = { ...route.query }
      delete query.order
      router.replace({ query })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="my-orders">
    <section class="buyer-hero">
      <div class="hero-orb" />
      <div class="hero-copy">
        <span class="hero-eyebrow">Pesanan pickup</span>
        <h2>Halo, {{ namaDepan }}.</h2>
        <p>
          Semua pesanan di sini sudah dibayar. Pantau prosesnya dan ambil di outlet
          saat status berubah menjadi <strong>Siap Diambil</strong>.
        </p>
      </div>
      <div class="hero-actions">
        <router-link :to="{ name: 'pesan' }" class="btn btn-accent">
          <AppIcon name="plus" :size="17" />
          Pesan Menu
        </router-link>
        <span v-if="pesananSiap" class="hero-ready">
          <span class="status-dot" />
          {{ pesananSiap }} pesanan siap diambil
        </span>
      </div>
    </section>

    <section class="buyer-stats">
      <article class="buyer-stat">
        <span class="buyer-stat-icon stat-amber">
          <AppIcon name="receipt" :size="18" />
        </span>
        <div>
          <span>Pesanan aktif</span>
          <strong>{{ pesananAktif.length }}</strong>
          <small>Diproses atau siap diambil</small>
        </div>
      </article>
      <article class="buyer-stat">
        <span class="buyer-stat-icon stat-blue">
          <AppIcon name="bag" :size="18" />
        </span>
        <div>
          <span>Siap diambil</span>
          <strong>{{ pesananSiap }}</strong>
          <small>Silakan ambil di outlet</small>
        </div>
      </article>
      <article class="buyer-stat">
        <span class="buyer-stat-icon stat-green">
          <AppIcon name="wallet" :size="18" />
        </span>
        <div>
          <span>Total belanja</span>
          <strong class="stat-amount">{{ formatRupiah(totalBelanja) }}</strong>
          <small>Dari {{ pesananSaya.length }} pesanan</small>
        </div>
      </article>
    </section>

    <section class="orders-panel">
      <div class="status-tabs">
        <button
          v-for="tab in tabStatus"
          :key="tab.value"
          type="button"
          class="status-tab"
          :class="{ 'is-active': statusFilter === tab.value }"
          @click="statusFilter = tab.value"
        >
          {{ tab.label }}
          <span class="tab-count">{{ tab.jumlah }}</span>
        </button>
      </div>

      <div class="orders-caption">
        <span>
          Menampilkan <strong>{{ pesananTerfilter.length }}</strong> dari
          {{ pesananSaya.length }} pesanan
        </span>
        <span class="caption-note">
          <AppIcon name="lock" :size="12" />
          Pesanan hanya dapat dilihat oleh akun pembeli ini.
        </span>
      </div>
    </section>

    <div v-if="pesananTerfilter.length" class="buyer-order-list">
      <article
        v-for="order in pesananTerfilter"
        :key="order.id"
        class="buyer-order"
      >
        <header class="order-head">
          <div class="order-identity">
            <div class="order-topline">
              <span class="order-number">{{ order.nomorPesanan }}</span>
              <span class="channel-tag">Pickup</span>
            </div>
            <span class="order-date">
              {{ formatTanggalPendek(order.tanggal) }} · {{ formatJam(order.tanggal) }}
            </span>
          </div>
          <div class="order-head-badges">
            <StatusBadge :status="order.statusPembayaran" jenis="pembayaran" />
            <StatusBadge :status="order.status" />
          </div>
        </header>

        <div class="order-body">
          <div class="order-items">
            <div
              v-for="item in order.items.slice(0, 3)"
              :key="item.id"
              class="order-item"
            >
              <span class="order-qty">{{ item.jumlah }}×</span>
              <div class="order-item-copy">
                <strong>{{ item.namaMenuSnapshot }}</strong>
                <span v-if="item.toppings.length">
                  {{ item.toppings.map((topping) => topping.namaToppingSnapshot).join(', ') }}
                </span>
                <span v-else>Tanpa topping</span>
              </div>
              <span class="order-item-total">{{ formatRupiah(item.totalItem) }}</span>
            </div>
            <span v-if="order.items.length > 3" class="order-more">
              +{{ order.items.length - 3 }} menu lain
            </span>
          </div>

          <div class="order-total-box">
            <span>Total dibayar</span>
            <strong>{{ formatRupiah(order.total) }}</strong>
            <span class="paid-mark">
              <AppIcon name="check" :size="11" />
              {{ order.metodePembayaran }} · Lunas
            </span>
          </div>
        </div>

        <div class="order-track">
          <div
            v-for="(langkah, index) in LANGKAH"
            :key="langkah.status"
            class="track-step"
            :class="keadaanLangkah(order, langkah)"
          >
            <span class="track-marker">
              <AppIcon
                :name="keadaanLangkah(order, langkah) === 'is-done' ? 'check' : langkah.icon"
                :size="14"
              />
            </span>
            <div class="track-copy">
              <strong>{{ langkah.judul }}</strong>
              <small>{{ langkah.keterangan }}</small>
            </div>
            <span v-if="index < LANGKAH.length - 1" class="track-line" />
          </div>
        </div>

        <div v-if="order.status === 'Siap Diambil'" class="pickup-ready">
          <span class="pickup-ready-icon"><AppIcon name="store" :size="19" /></span>
          <div>
            <strong>Pesanan siap diambil</strong>
            <p>
              Tunjukkan nomor <strong>{{ order.nomorPesanan }}</strong> di outlet
              Lumpia Beef Obami Delima.
            </p>
          </div>
        </div>
        <div v-else-if="order.status === 'Diproses'" class="order-message">
          <AppIcon name="clock" :size="15" />
          <p>
            Pembayaran sudah diterima. Pesanan sedang disiapkan dan akan berubah
            menjadi <strong>Siap Diambil</strong> jika sudah matang.
          </p>
        </div>
        <div v-else class="order-message is-done">
          <AppIcon name="checkCircle" :size="15" />
          <p>Pesanan sudah selesai diambil. Terima kasih sudah memesan!</p>
        </div>

        <footer class="order-foot">
          <span>{{ ringkasanItem(order) }}</span>
          <button type="button" class="btn btn-ghost btn-sm" @click="bukaDetail(order)">
            Lihat detail
            <AppIcon name="chevronRight" :size="14" />
          </button>
        </footer>
      </article>
    </div>

    <div v-else class="card empty-state orders-empty">
      <span class="empty-icon"><AppIcon name="bag" :size="28" /></span>
      <h3>
        {{ pesananSaya.length ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan' }}
      </h3>
      <p>
        {{
          pesananSaya.length
            ? 'Coba pilih tab status lain untuk melihat pesanan kamu.'
            : 'Pilih menu favorit, bayar dengan QRIS simulasi, lalu ambil pesanan di outlet.'
        }}
      </p>
      <button
        v-if="!pesananSaya.length"
        type="button"
        class="btn btn-primary btn-sm"
        @click="pesanLagi"
      >
        <AppIcon name="plus" :size="15" />
        Pesan menu sekarang
      </button>
    </div>

    <BaseModal
      :open="detailOpen"
      :title="selectedOrder?.nomorPesanan || 'Detail pesanan'"
      :subtitle="
        selectedOrder
          ? formatTanggal(selectedOrder.tanggal, { denganWaktu: true })
          : ''
      "
      size="lg"
      @close="tutupDetail"
    >
      <div v-if="selectedOrder" class="order-detail">
        <div class="detail-badges">
          <StatusBadge :status="selectedOrder.status" />
          <StatusBadge
            :status="selectedOrder.statusPembayaran"
            jenis="pembayaran"
          />
          <span class="detail-channel">Pickup</span>
        </div>

        <div class="pickup-ticket">
          <span>Nomor pickup</span>
          <strong>{{ selectedOrder.nomorPesanan }}</strong>
          <small>Lumpia Beef Obami Delima · ambil sendiri</small>
        </div>

        <div class="detail-meta-grid">
          <div>
            <span>Pemesan</span>
            <strong>{{ selectedOrder.namaPelanggan || auth.currentUser?.nama }}</strong>
          </div>
          <div>
            <span>Waktu pesanan</span>
            <strong>{{ formatTanggal(selectedOrder.tanggal, { denganWaktu: true }) }}</strong>
          </div>
          <div>
            <span>Jumlah item</span>
            <strong>
              {{ selectedOrder.items.reduce((n, item) => n + item.jumlah, 0) }} pcs ·
              {{ selectedOrder.items.length }} menu
            </strong>
          </div>
        </div>

        <div class="detail-section">
          <h4>Rincian pesanan</h4>
          <div class="detail-items">
            <div
              v-for="item in selectedOrder.items"
              :key="item.id"
              class="detail-item"
            >
              <span class="detail-qty">{{ item.jumlah }}×</span>
              <div class="detail-item-copy">
                <strong>{{ item.namaMenuSnapshot }}</strong>
                <span>
                  {{ formatRupiah(item.hargaMenuSnapshot) }} / item
                  <template v-if="item.toppings.length">
                    · Topping:
                    {{
                      item.toppings
                        .map(
                          (topping) =>
                            `${topping.namaToppingSnapshot} (+${formatRupiah(topping.hargaToppingSnapshot)})`,
                        )
                        .join(', ')
                    }}
                  </template>
                </span>
              </div>
              <strong class="detail-item-total">{{ formatRupiah(item.totalItem) }}</strong>
            </div>
          </div>
          <p v-if="selectedOrder.catatan" class="detail-note">
            <AppIcon name="info" :size="14" />
            <span><strong>Catatan:</strong> {{ selectedOrder.catatan }}</span>
          </p>
        </div>

        <div class="detail-section">
          <h4>Status pesanan</h4>
          <div class="order-track detail-track">
            <div
              v-for="(langkah, index) in LANGKAH"
              :key="langkah.status"
              class="track-step"
              :class="keadaanLangkah(selectedOrder, langkah)"
            >
              <span class="track-marker">
                <AppIcon
                  :name="
                    keadaanLangkah(selectedOrder, langkah) === 'is-done'
                      ? 'check'
                      : langkah.icon
                  "
                  :size="14"
                />
              </span>
              <div class="track-copy">
                <strong>{{ langkah.judul }}</strong>
                <small>{{ langkah.keterangan }}</small>
              </div>
              <span v-if="index < LANGKAH.length - 1" class="track-line" />
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>Pembayaran</h4>
          <dl class="payment-facts">
            <div>
              <dt>Metode</dt>
              <dd>{{ selectedOrder.metodePembayaran }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ selectedOrder.statusPembayaran }}</dd>
            </div>
            <div>
              <dt>Dibayar</dt>
              <dd>{{ formatRupiah(selectedOrder.jumlahDibayar) }}</dd>
            </div>
            <div>
              <dt>Waktu bayar</dt>
              <dd>
                {{
                  selectedOrder.waktuPembayaran
                    ? formatTanggal(selectedOrder.waktuPembayaran, { denganWaktu: true })
                    : '-'
                }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="detail-summary">
          <div>
            <span>Subtotal</span>
            <strong>{{ formatRupiah(selectedOrder.subtotal) }}</strong>
          </div>
          <div>
            <span>Pajak / biaya tambahan</span>
            <strong>{{ formatRupiah(0) }}</strong>
          </div>
          <div class="detail-grand-total">
            <span>Total</span>
            <strong>{{ formatRupiah(selectedOrder.total) }}</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-ghost" @click="tutupDetail">Tutup</button>
        <button type="button" class="btn btn-primary" @click="pesanLagi">
          <AppIcon name="plus" :size="15" />
          Pesan lagi
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.my-orders {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.buyer-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 28px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  color: #fbf3e8;
  background:
    radial-gradient(circle at 84% 18%, rgba(233, 162, 59, 0.2), transparent 37%),
    linear-gradient(120deg, #2b1d13 0%, #20150e 72%);
  box-shadow: var(--shadow-md);
}

.hero-orb {
  position: absolute;
  top: -135px;
  right: -30px;
  width: 330px;
  height: 330px;
  border: 1px solid rgba(233, 162, 59, 0.16);
  border-radius: 50%;
  pointer-events: none;
}

.hero-orb::after {
  position: absolute;
  inset: 48px;
  border: 1px solid rgba(233, 162, 59, 0.11);
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
  margin-bottom: 8px;
  color: var(--amber);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h2 {
  margin: 0 0 7px;
  font-family: var(--font-display);
  font-size: 29px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.hero-copy p {
  margin: 0;
  color: rgba(248, 239, 228, 0.58);
  font-size: 11px;
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

.hero-ready {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #f5c98f;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.buyer-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
}

.buyer-stat {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.buyer-stat-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 10px;
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

.buyer-stat > div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.buyer-stat span:not(.buyer-stat-icon) {
  margin-bottom: 2px;
  color: var(--muted);
  font-size: 9.5px;
  font-weight: 600;
}

.buyer-stat strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 23px;
  font-weight: 600;
  line-height: 1.15;
}

.buyer-stat strong.stat-amount {
  font-size: 20px;
}

.buyer-stat small {
  margin-top: 3px;
  color: var(--muted-light);
  font-size: 8.5px;
}

.orders-panel {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-soft);
}

.status-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--muted);
  background: transparent;
  font-size: 10.5px;
  font-weight: 600;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.status-tab:hover {
  color: var(--ink);
  background: var(--surface-alt);
}

.status-tab.is-active {
  color: var(--brand);
  background: var(--brand-soft);
}

.tab-count {
  display: inline-grid;
  place-items: center;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 5px;
  color: var(--muted);
  background: rgba(42, 33, 26, 0.06);
  font-size: 8.5px;
  font-weight: 700;
}

.status-tab.is-active .tab-count {
  color: var(--brand);
  background: rgba(178, 59, 37, 0.11);
}

.orders-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 11px;
  color: var(--muted-light);
  font-size: 9px;
}

.orders-caption strong {
  color: var(--ink);
}

.caption-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.buyer-order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.buyer-order {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.order-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 15px 18px 12px;
  border-bottom: 1px solid var(--line-soft);
}

.order-identity {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.order-topline {
  display: flex;
  align-items: center;
  gap: 7px;
}

.order-number {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.channel-tag {
  padding: 2px 6px;
  border-radius: 4px;
  color: #196b52;
  background: #e0f1e9;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.order-date {
  color: var(--muted-light);
  font-size: 8.5px;
  font-variant-numeric: tabular-nums;
}

.order-head-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
}

.order-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 165px;
  gap: 16px;
  padding: 14px 18px;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.order-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.order-qty {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  min-width: 24px;
  height: 22px;
  padding: 0 4px;
  border-radius: 6px;
  color: var(--brand);
  background: var(--brand-soft);
  font-size: 8.5px;
  font-weight: 700;
}

.order-item-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.order-item-copy strong {
  overflow: hidden;
  color: var(--ink);
  font-size: 10.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-item-copy span {
  color: var(--muted-light);
  font-size: 8.5px;
}

.order-item-total {
  color: var(--ink);
  font-size: 9.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.order-more {
  color: var(--muted-light);
  font-size: 8.5px;
  font-style: italic;
}

.order-total-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  padding-left: 15px;
  border-left: 1px dashed var(--line);
  text-align: right;
}

.order-total-box > span:first-child {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.order-total-box > strong {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.paid-mark {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--green);
  font-size: 8px;
  font-weight: 600;
  white-space: nowrap;
}

.order-track {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 18px 15px;
}

.track-step {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
}

.track-marker {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 27px;
  height: 27px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--muted-light);
  background: var(--surface);
}

.track-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.track-copy strong {
  color: var(--muted-light);
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.track-copy small {
  color: var(--muted-light);
  font-size: 7.5px;
  white-space: nowrap;
}

.track-step.is-done .track-marker {
  border-color: var(--green);
  color: #fff;
  background: var(--green);
}

.track-step.is-done .track-copy strong {
  color: var(--green);
}

.track-step.is-current .track-marker {
  border-color: rgba(178, 59, 37, 0.35);
  color: var(--brand);
  background: var(--brand-soft);
  box-shadow: 0 0 0 3px rgba(178, 59, 37, 0.07);
}

.track-step.is-current .track-copy strong {
  color: var(--ink);
}

.track-line {
  flex: 1;
  height: 1px;
  margin: 0 8px;
  background: var(--line);
}

.track-step.is-done .track-line,
.track-step.is-current .track-line {
  background: #cfdcd4;
}

.pickup-ready {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0 18px 14px;
  padding: 11px 12px;
  border: 1px solid rgba(47, 125, 91, 0.18);
  border-radius: 9px;
  background: var(--green-soft);
}

.pickup-ready-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--green);
  background: rgba(255, 255, 255, 0.7);
}

.pickup-ready strong {
  color: var(--green);
  font-size: 10px;
  font-weight: 700;
}

.pickup-ready p {
  margin: 1px 0 0;
  color: var(--muted);
  font-size: 8.5px;
  line-height: 1.5;
}

.pickup-ready p strong {
  color: var(--ink);
}

.order-message {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 0 18px 14px;
  padding: 9px 11px;
  border-radius: 8px;
  color: var(--amber-deep);
  background: #fdf6ea;
}

.order-message.is-done {
  color: var(--green);
  background: var(--green-soft);
}

.order-message svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.order-message p {
  margin: 0;
  color: var(--muted);
  font-size: 8.5px;
  line-height: 1.5;
}

.order-message p strong {
  color: var(--ink);
}

.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px;
  border-top: 1px solid var(--line-soft);
  background: var(--surface-alt);
  color: var(--muted-light);
  font-size: 8.5px;
}

.order-foot .btn {
  background: var(--surface);
}

.orders-empty {
  padding: 48px 24px;
}

.orders-empty h3 {
  margin: 12px 0 5px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}

.orders-empty p {
  max-width: 390px;
  margin: 0 0 15px;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.6;
}

/* Detail modal */
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.detail-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.detail-channel {
  padding: 4px 8px;
  border-radius: 5px;
  color: var(--muted);
  background: var(--surface-alt);
  font-size: 9px;
  font-weight: 600;
}

.pickup-ticket {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 1px dashed rgba(178, 59, 37, 0.3);
  border-radius: 12px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(233, 162, 59, 0.12), transparent 65%),
    #fdf8f1;
}

.pickup-ticket span {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.pickup-ticket strong {
  margin: 4px 0 2px;
  color: var(--brand);
  font-family: var(--font-mono);
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.pickup-ticket small {
  color: var(--muted);
  font-size: 8.5px;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.detail-meta-grid > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface-alt);
}

.detail-meta-grid span {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-meta-grid strong {
  color: var(--ink);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.4;
}

.detail-section h4 {
  margin: 0 0 9px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
}

.detail-items {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  border-top: 1px solid var(--line-soft);
}

.detail-item:first-child {
  border-top: 0;
}

.detail-qty {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  min-width: 23px;
  height: 23px;
  padding: 0 4px;
  border-radius: 6px;
  color: var(--brand);
  background: var(--brand-soft);
  font-size: 9px;
  font-weight: 700;
}

.detail-item-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.detail-item-copy strong {
  color: var(--ink);
  font-size: 10.5px;
  font-weight: 600;
}

.detail-item-copy span {
  color: var(--muted-light);
  font-size: 8.5px;
  line-height: 1.5;
}

.detail-item-total {
  color: var(--ink);
  font-size: 10.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.detail-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 9px 0 0;
  padding: 9px 11px;
  border-radius: 8px;
  color: var(--muted);
  background: #fdf6ea;
  font-size: 9px;
  line-height: 1.5;
}

.detail-note svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--amber-deep);
}

.detail-track {
  padding: 4px 2px 0;
}

.payment-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin: 0;
}

.payment-facts > div {
  padding: 8px 10px;
  border-radius: 7px;
  background: var(--surface-alt);
}

.payment-facts dt {
  margin-bottom: 2px;
  color: var(--muted-light);
  font-size: 7.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.payment-facts dd {
  margin: 0;
  color: var(--ink);
  font-size: 9.5px;
  font-weight: 600;
}

.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 13px;
  border-top: 1px dashed var(--line);
}

.detail-summary > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 9.5px;
}

.detail-summary strong {
  color: var(--ink);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.detail-grand-total {
  margin-top: 3px;
  padding-top: 8px;
  border-top: 1px solid var(--line-soft);
  color: var(--ink) !important;
  font-weight: 700;
}

.detail-grand-total strong {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .buyer-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-actions {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .buyer-stats {
    grid-template-columns: 1fr 1fr;
  }

  .buyer-stats .buyer-stat:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 720px) {
  .buyer-hero {
    padding: 21px;
  }

  .hero-copy h2 {
    font-size: 25px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .buyer-stats {
    grid-template-columns: 1fr;
  }

  .buyer-stats .buyer-stat:last-child {
    grid-column: auto;
  }

  .orders-panel {
    padding: 13px;
  }

  .caption-note {
    display: none;
  }

  .order-head {
    flex-direction: column;
    gap: 8px;
    padding: 13px;
  }

  .order-head-badges {
    justify-content: flex-start;
  }

  .order-body {
    grid-template-columns: 1fr;
    gap: 11px;
    padding: 13px;
  }

  .order-total-box {
    align-items: flex-start;
    padding: 10px 0 0;
    border-top: 1px dashed var(--line);
    border-left: 0;
    text-align: left;
  }

  .order-track {
    padding: 0 13px 13px;
  }

  .track-copy small {
    display: none;
  }

  .track-line {
    margin: 0 5px;
  }

  .pickup-ready,
  .order-message {
    margin: 0 13px 13px;
  }

  .order-foot {
    align-items: flex-start;
    flex-direction: column;
    padding: 10px 13px;
  }

  .order-foot .btn {
    width: 100%;
  }

  .detail-meta-grid,
  .payment-facts {
    grid-template-columns: 1fr;
  }

  .detail-track {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .detail-track .track-step {
    flex: initial;
  }

  .detail-track .track-line {
    display: none;
  }
}
</style>
