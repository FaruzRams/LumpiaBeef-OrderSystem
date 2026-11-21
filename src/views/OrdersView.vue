<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import BaseModal from '../components/BaseModal.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useOrderStore } from '../stores/orders'
import { useToast } from '../composables/useToast'
import { STATUS_PESANAN, statusBerikutnya } from '../utils/constants'
import {
  formatJam,
  formatRupiah,
  formatTanggal,
  formatTanggalPendek,
} from '../utils/format'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const toast = useToast()

const statusFilter = ref('Semua')
const kanalFilter = ref('Semua')
const pembayaranFilter = ref('Semua')
const pencarian = ref('')

const detailOpen = ref(false)
const selectedId = ref(null)
const tampilFormBayar = ref(false)
const payMetode = ref('Tunai')
const payJumlah = ref('')
const payError = ref('')

const tabStatus = computed(() => [
  { value: 'Semua', label: 'Semua', jumlah: orderStore.orders.length },
  {
    value: 'Diproses',
    label: 'Diproses',
    jumlah: orderStore.orders.filter((order) => order.status === 'Diproses').length,
  },
  {
    value: 'Siap Diambil',
    label: 'Siap Diambil',
    jumlah: orderStore.orders.filter((order) => order.status === 'Siap Diambil').length,
  },
  {
    value: 'Selesai',
    label: 'Selesai',
    jumlah: orderStore.orders.filter((order) => order.status === 'Selesai').length,
  },
])

const pesananTerfilter = computed(() => {
  const kataKunci = pencarian.value.trim().toLowerCase()

  return orderStore.daftarPesanan.filter((order) => {
    if (statusFilter.value !== 'Semua' && order.status !== statusFilter.value) {
      return false
    }
    if (kanalFilter.value !== 'Semua' && order.kanal !== kanalFilter.value) {
      return false
    }
    if (pembayaranFilter.value === 'Lunas' && order.statusPembayaran !== 'Lunas') {
      return false
    }
    if (
      pembayaranFilter.value === 'Belum Dibayar' &&
      order.statusPembayaran === 'Lunas'
    ) {
      return false
    }
    if (
      ['Tunai', 'QRIS'].includes(pembayaranFilter.value) &&
      order.metodePembayaran !== pembayaranFilter.value
    ) {
      return false
    }
    if (!kataKunci) return true

    const bahanPencarian = [
      order.nomorPesanan,
      order.namaPelanggan,
      order.kanal,
      order.metodePembayaran,
      order.status,
      ...order.items.map((item) => item.namaMenuSnapshot),
      ...order.items.flatMap((item) =>
        item.toppings.map((topping) => topping.namaToppingSnapshot),
      ),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return bahanPencarian.includes(kataKunci)
  })
})

const selectedOrder = computed(() =>
  selectedId.value ? orderStore.orderById(selectedId.value) : null,
)

const adaFilter = computed(
  () =>
    statusFilter.value !== 'Semua' ||
    kanalFilter.value !== 'Semua' ||
    pembayaranFilter.value !== 'Semua' ||
    Boolean(pencarian.value.trim()),
)

const saranUang = computed(() => {
  if (!selectedOrder.value) return []
  const total = selectedOrder.value.total
  const nilai = new Set([
    total,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    50000,
    100000,
  ])
  return [...nilai]
    .filter((nominal) => nominal >= total)
    .sort((a, b) => a - b)
    .slice(0, 4)
})

const payKembalian = computed(() => {
  if (!selectedOrder.value) return 0
  return Math.max(0, Number(payJumlah.value || 0) - selectedOrder.value.total)
})

function ringkasanItem(order) {
  const jumlah = order.items.reduce((total, item) => total + item.jumlah, 0)
  const nama = order.items.map((item) => item.namaMenuSnapshot)
  if (!nama.length) return 'Tidak ada item'
  return `${nama[0]}${nama.length > 1 ? ` +${nama.length - 1} menu lain` : ''} · ${jumlah} pcs`
}

function bukaDetail(order, { bayar = false } = {}) {
  if (!order) return
  selectedId.value = order.id
  tampilFormBayar.value = bayar && order.statusPembayaran !== 'Lunas'
  payMetode.value = 'Tunai'
  payJumlah.value = String(order.total)
  payError.value = ''
  detailOpen.value = true
}

function bukaPembayaran(order) {
  bukaDetail(order, { bayar: true })
}

function tutupDetail() {
  detailOpen.value = false
  tampilFormBayar.value = false
  selectedId.value = null

  if (route.query.order) {
    const query = { ...route.query }
    delete query.order
    router.replace({ query })
  }
}

function pilihMetodeBayar(metode) {
  payMetode.value = metode
  if (metode === 'QRIS' && selectedOrder.value) {
    payJumlah.value = String(selectedOrder.value.total)
  }
}

function simpanPembayaran() {
  if (!selectedOrder.value) return
  payError.value = ''

  const hasil = orderStore.catatPembayaran(selectedOrder.value.id, {
    metode: payMetode.value,
    jumlahDibayar:
      payMetode.value === 'QRIS'
        ? selectedOrder.value.total
        : Number(payJumlah.value || 0),
  })

  if (!hasil.ok) {
    payError.value = hasil.message
    toast.error(hasil.message)
    return
  }

  tampilFormBayar.value = false
  toast.sukses(
    `Pembayaran ${hasil.order.nomorPesanan} tercatat sebagai ${hasil.order.metodePembayaran}.`,
  )
}

function aturStatus(status) {
  if (!selectedOrder.value) return
  const hasil = orderStore.ubahStatus(selectedOrder.value.id, status)
  if (hasil.ok) toast.sukses(`Status ${hasil.order.nomorPesanan} diubah ke ${status}.`)
  else toast.error(hasil.message)
}

function majukanStatus(order) {
  const berikutnya = statusBerikutnya(order.status)
  if (!berikutnya) return
  const hasil = orderStore.ubahStatus(order.id, berikutnya)
  if (hasil.ok) toast.sukses(`Pesanan ${order.nomorPesanan} → ${berikutnya}.`)
  else toast.error(hasil.message)
}

function resetFilter() {
  statusFilter.value = 'Semua'
  kanalFilter.value = 'Semua'
  pembayaranFilter.value = 'Semua'
  pencarian.value = ''
}

watch(
  () => route.query.order,
  (id) => {
    if (!id) return
    const order = orderStore.orderById(String(id))
    if (order) {
      bukaDetail(order)
    } else {
      toast.error('Pesanan yang diminta tidak ditemukan.')
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="orders-page">
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

      <div class="orders-toolbar">
        <div class="search-box">
          <AppIcon name="search" :size="16" />
          <input
            v-model="pencarian"
            type="search"
            class="input"
            placeholder="Cari nomor, pelanggan, atau menu..."
            aria-label="Cari pesanan"
          />
        </div>

        <div class="filter-group">
          <label class="select-wrap" aria-label="Filter kanal">
            <AppIcon name="filter" :size="14" />
            <select v-model="kanalFilter" class="select">
              <option value="Semua">Semua kanal</option>
              <option value="Langsung">Langsung</option>
              <option value="GoFood">GoFood</option>
              <option value="GrabFood">GrabFood</option>
              <option value="Pickup">Pickup (pembeli)</option>
            </select>
            <AppIcon name="chevronDown" :size="13" />
          </label>

          <label class="select-wrap" aria-label="Filter pembayaran">
            <AppIcon name="wallet" :size="14" />
            <select v-model="pembayaranFilter" class="select">
              <option value="Semua">Semua pembayaran</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Dibayar">Belum dibayar</option>
              <option value="Tunai">Tunai</option>
              <option value="QRIS">QRIS</option>
            </select>
            <AppIcon name="chevronDown" :size="13" />
          </label>

          <button
            v-if="adaFilter"
            type="button"
            class="btn btn-ghost btn-sm reset-filter"
            @click="resetFilter"
          >
            <AppIcon name="refresh" :size="14" />
            Reset
          </button>
        </div>
      </div>

      <div class="result-summary">
        <span>
          Menampilkan <strong>{{ pesananTerfilter.length }}</strong> dari
          {{ orderStore.orders.length }} pesanan
        </span>
        <span class="result-hint">
          <AppIcon name="info" :size="13" />
          Klik pesanan untuk melihat detail lengkap
        </span>
      </div>
    </section>

    <div v-if="pesananTerfilter.length" class="orders-list">
      <article
        v-for="order in pesananTerfilter"
        :key="order.id"
        class="order-row"
      >
        <button type="button" class="order-main" @click="bukaDetail(order)">
          <div class="order-identity">
            <div class="order-topline">
              <span class="order-number">{{ order.nomorPesanan }}</span>
              <span class="channel-tag" :class="`channel-${order.kanal.toLowerCase()}`">
                {{ order.kanal }}
              </span>
            </div>
            <span class="order-date">
              {{ formatTanggalPendek(order.tanggal) }} · {{ formatJam(order.tanggal) }}
            </span>
            <span class="order-customer">
              {{ order.namaPelanggan || `Pelanggan ${order.kanal}` }}
            </span>
          </div>

          <div class="order-items">
            <span>{{ ringkasanItem(order) }}</span>
            <small>
              {{
                order.items
                  .flatMap((item) => item.toppings.map((topping) => topping.namaToppingSnapshot))
                  .join(', ') || 'Tanpa topping'
              }}
            </small>
          </div>

          <div class="order-payment">
            <StatusBadge
              :status="order.statusPembayaran"
              jenis="pembayaran"
            />
            <span v-if="order.metodePembayaran" class="payment-method">
              {{ order.metodePembayaran }}
            </span>
            <span v-else class="payment-method muted">Belum dicatat</span>
          </div>

          <div class="order-total">
            <strong>{{ formatRupiah(order.total) }}</strong>
            <span>{{ order.items.reduce((n, item) => n + item.jumlah, 0) }} pcs</span>
          </div>

          <StatusBadge :status="order.status" class="order-status-badge" />
        </button>

        <div class="order-actions">
          <button
            v-if="order.statusPembayaran !== 'Lunas'"
            type="button"
            class="quick-pay"
            @click="bukaPembayaran(order)"
          >
            <AppIcon name="wallet" :size="13" />
            Bayar
          </button>
          <button
            v-if="statusBerikutnya(order.status)"
            type="button"
            class="quick-status"
            :title="`Tandai ${statusBerikutnya(order.status)}`"
            @click="majukanStatus(order)"
          >
            <AppIcon name="check" :size="13" />
            {{ statusBerikutnya(order.status) === 'Siap Diambil' ? 'Siap' : 'Selesai' }}
          </button>
          <button
            type="button"
            class="icon-btn detail-arrow"
            title="Buka detail"
            aria-label="Buka detail pesanan"
            @click="bukaDetail(order)"
          >
            <AppIcon name="chevronRight" :size="17" />
          </button>
        </div>
      </article>
    </div>

    <div v-else class="card empty-state orders-empty">
      <span class="empty-icon"><AppIcon name="receipt" :size="28" /></span>
      <h3>{{ adaFilter ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan' }}</h3>
      <p>
        {{
          adaFilter
            ? 'Coba ubah kata kunci atau filter yang digunakan.'
            : 'Pesanan yang disimpan akan tampil di sini lengkap dengan status dan pembayarannya.'
        }}
      </p>
      <button
        v-if="adaFilter"
        type="button"
        class="btn btn-ghost btn-sm"
        @click="resetFilter"
      >
        <AppIcon name="refresh" :size="14" />
        Reset filter
      </button>
      <router-link v-else :to="{ name: 'pesanan-baru' }" class="btn btn-primary btn-sm">
        <AppIcon name="plus" :size="15" />
        Buat pesanan pertama
      </router-link>
    </div>

    <BaseModal
      :open="detailOpen"
      :title="selectedOrder?.nomorPesanan || 'Detail pesanan'"
      :subtitle="selectedOrder ? formatTanggal(selectedOrder.tanggal, { denganWaktu: true }) : ''"
      size="lg"
      @close="tutupDetail"
    >
      <div v-if="selectedOrder" class="order-detail">
        <div class="detail-top">
          <div class="detail-badges">
            <StatusBadge :status="selectedOrder.status" />
            <StatusBadge
              :status="selectedOrder.statusPembayaran"
              jenis="pembayaran"
            />
            <span class="detail-channel">{{ selectedOrder.kanal }}</span>
          </div>
          <div class="detail-meta-grid">
            <div>
              <span>Pelanggan</span>
              <strong>{{ selectedOrder.namaPelanggan || `Pelanggan ${selectedOrder.kanal}` }}</strong>
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

        <div class="detail-section detail-controls">
          <div class="status-control">
            <span class="field-label">Status pesanan</span>
            <div class="status-options">
              <button
                v-for="status in STATUS_PESANAN"
                :key="status"
                type="button"
                class="status-option"
                :class="{ 'is-active': selectedOrder.status === status }"
                @click="aturStatus(status)"
              >
                <span class="status-option-dot" />
                {{ status }}
              </button>
            </div>
            <p class="control-hint">Perubahan status langsung tersimpan.</p>
          </div>

          <div class="payment-control">
            <div class="payment-control-head">
              <span class="field-label">Pembayaran</span>
              <StatusBadge
                :status="selectedOrder.statusPembayaran"
                jenis="pembayaran"
              />
            </div>

            <template v-if="selectedOrder.statusPembayaran === 'Lunas'">
              <dl class="payment-facts">
                <div>
                  <dt>Metode</dt>
                  <dd>{{ selectedOrder.metodePembayaran }}</dd>
                </div>
                <div>
                  <dt>Dibayar</dt>
                  <dd>{{ formatRupiah(selectedOrder.jumlahDibayar) }}</dd>
                </div>
                <div>
                  <dt>Kembalian</dt>
                  <dd>{{ formatRupiah(selectedOrder.kembalian) }}</dd>
                </div>
                <div>
                  <dt>Waktu</dt>
                  <dd>
                    {{
                      selectedOrder.waktuPembayaran
                        ? formatTanggal(selectedOrder.waktuPembayaran, { denganWaktu: true })
                        : '-'
                    }}
                  </dd>
                </div>
              </dl>
            </template>

            <template v-else>
              <div v-if="!tampilFormBayar" class="unpaid-box">
                <div>
                  <AppIcon name="alert" :size="18" />
                  <p>Pembayaran pesanan ini belum dicatat.</p>
                </div>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="tampilFormBayar = true"
                >
                  <AppIcon name="wallet" :size="14" />
                  Catat Pembayaran
                </button>
              </div>

              <form v-else class="inline-payment" @submit.prevent="simpanPembayaran">
                <div class="payment-methods">
                  <button
                    type="button"
                    class="payment-method"
                    :class="{ 'is-selected': payMetode === 'Tunai' }"
                    @click="pilihMetodeBayar('Tunai')"
                  >
                    <AppIcon name="banknote" :size="16" />
                    Tunai
                  </button>
                  <button
                    type="button"
                    class="payment-method"
                    :class="{ 'is-selected': payMetode === 'QRIS' }"
                    @click="pilihMetodeBayar('QRIS')"
                  >
                    <AppIcon name="qr" :size="16" />
                    QRIS
                  </button>
                </div>

                <label v-if="payMetode === 'Tunai'" class="field">
                  <span class="field-label">Uang diterima</span>
                  <input
                    v-model="payJumlah"
                    type="number"
                    min="0"
                    step="any"
                    class="input"
                    placeholder="Nominal tunai"
                  />
                  <div class="cash-suggestions">
                    <button
                      v-for="nominal in saranUang"
                      :key="nominal"
                      type="button"
                      class="cash-chip"
                      @click="payJumlah = String(nominal)"
                    >
                      {{ nominal === selectedOrder.total ? 'Uang pas' : formatRupiah(nominal) }}
                    </button>
                  </div>
                </label>

                <p v-else class="qris-inline">
                  <AppIcon name="info" :size="14" />
                  Nominal QRIS otomatis sebesar total transaksi.
                </p>

                <div class="inline-payment-total">
                  <span>
                    Total
                    <strong>{{ formatRupiah(selectedOrder.total) }}</strong>
                  </span>
                  <span v-if="payMetode === 'Tunai'" class="change-inline">
                    Kembalian <strong>{{ formatRupiah(payKembalian) }}</strong>
                  </span>
                </div>

                <p v-if="payError" class="inline-error">
                  <AppIcon name="alert" :size="13" />
                  {{ payError }}
                </p>

                <div class="inline-payment-actions">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="tampilFormBayar = false"
                  >
                    Batal
                  </button>
                  <button type="submit" class="btn btn-primary btn-sm">
                    <AppIcon name="check" :size="14" />
                    Simpan Pembayaran
                  </button>
                </div>
              </form>
            </template>
          </div>
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
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.orders-panel {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 14px;
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

.orders-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 360px;
}

.search-box svg {
  position: absolute;
  top: 50%;
  left: 11px;
  color: var(--muted-light);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-box .input {
  padding: 9px 12px 9px 33px;
  font-size: 11px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted-light);
  background: var(--surface);
}

.select-wrap:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.select {
  padding: 8px 24px 8px 0;
  border: 0;
  color: var(--muted);
  background: transparent;
  font-size: 10px;
  font-weight: 500;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.select-wrap > svg:last-child {
  position: absolute;
  right: 7px;
  color: var(--muted-light);
  pointer-events: none;
}

.reset-filter {
  padding: 7px 9px;
  font-size: 9.5px;
}

.result-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 13px;
  color: var(--muted-light);
  font-size: 9.5px;
}

.result-summary strong {
  color: var(--ink);
}

.result-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.order-row:hover {
  border-color: rgba(178, 59, 37, 0.2);
  box-shadow: 0 8px 24px -18px rgba(42, 33, 26, 0.5);
}

.order-main {
  display: grid;
  grid-template-columns:
    minmax(180px, 0.9fr) minmax(200px, 1.5fr) minmax(105px, 0.62fr)
    minmax(92px, 0.55fr) auto;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
  padding: 15px 16px;
  text-align: left;
}

.order-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.order-topline {
  display: flex;
  align-items: center;
  gap: 6px;
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
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.channel-langsung {
  color: var(--green);
  background: var(--green-soft);
}

.channel-gofood {
  color: #1f7a5c;
  background: #e3f4ee;
}

.channel-grabfood {
  color: #196b52;
  background: #e0f1e9;
}

.channel-pickup {
  color: var(--blue);
  background: var(--blue-soft);
}

.order-date {
  color: var(--muted-light);
  font-size: 8.5px;
  font-variant-numeric: tabular-nums;
}

.order-customer {
  overflow: hidden;
  color: var(--muted);
  font-size: 10px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.order-items span {
  overflow: hidden;
  color: var(--ink);
  font-size: 10.5px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-items small {
  overflow: hidden;
  color: var(--muted-light);
  font-size: 8.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-payment {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.payment-method {
  color: var(--muted);
  font-size: 8.5px;
  font-weight: 600;
}

.payment-method.muted {
  color: var(--muted-light);
  font-weight: 400;
}

.order-total {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
}

.order-total strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.order-total span {
  color: var(--muted-light);
  font-size: 8.5px;
}

.order-status-badge {
  justify-self: end;
}

.order-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px 10px 0;
  border-left: 1px solid var(--line-soft);
}

.quick-pay,
.quick-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 8.5px;
  font-weight: 700;
  white-space: nowrap;
}

.quick-pay {
  color: var(--brand);
  background: var(--brand-soft);
  border: 1px solid rgba(178, 59, 37, 0.15);
}

.quick-pay:hover {
  background: #f7ded4;
}

.quick-status {
  color: var(--green);
  background: var(--green-soft);
  border: 1px solid rgba(47, 125, 91, 0.15);
}

.quick-status:hover {
  background: #d9eee4;
}

.detail-arrow {
  align-self: center;
  width: 25px;
  height: 25px;
  color: var(--muted-light);
}

.orders-empty {
  padding: 52px 24px;
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
  gap: 18px;
}

.detail-top {
  display: flex;
  flex-direction: column;
  gap: 13px;
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
  margin: 0 0 10px;
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

.detail-controls {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}

.status-options {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.status-option {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--muted);
  background: var(--surface);
  font-size: 8.5px;
  font-weight: 600;
}

.status-option-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--line-strong);
}

.status-option.is-active {
  border-color: rgba(178, 59, 37, 0.35);
  color: var(--brand);
  background: var(--brand-soft);
}

.status-option.is-active .status-option-dot {
  background: var(--brand);
}

.control-hint {
  margin: 7px 0 0;
  color: var(--muted-light);
  font-size: 8.5px;
}

.payment-control-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
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

.unpaid-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px;
  border: 1px dashed rgba(178, 59, 37, 0.3);
  border-radius: 9px;
  background: #fdf6ea;
}

.unpaid-box > div {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  color: var(--amber-deep);
}

.unpaid-box p {
  margin: 0;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.45;
}

.inline-payment {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface-alt);
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.payment-method {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px;
  border: 1px solid var(--line);
  border-radius: 7px;
  color: var(--muted);
  background: var(--surface);
  font-size: 9.5px;
  font-weight: 600;
}

.payment-method.is-selected {
  border-color: rgba(178, 59, 37, 0.38);
  color: var(--brand);
  background: var(--brand-soft);
}

.inline-payment .field {
  gap: 4px;
}

.inline-payment .input {
  padding: 7px 9px;
  font-size: 11px;
}

.cash-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cash-chip {
  padding: 3px 6px;
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--muted);
  background: var(--surface);
  font-size: 8px;
  font-weight: 600;
}

.cash-chip:hover {
  border-color: rgba(178, 59, 37, 0.3);
  color: var(--brand);
  background: var(--brand-soft);
}

.qris-inline {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 0;
  color: var(--muted);
  font-size: 8.5px;
  line-height: 1.5;
}

.inline-payment-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 9px;
  color: var(--muted);
}

.inline-payment-total strong {
  color: var(--ink);
  font-size: 10px;
}

.change-inline strong {
  color: var(--green);
}

.inline-error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  color: var(--danger);
  font-size: 8.5px;
}

.inline-payment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 14px;
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
  margin-top: 4px;
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

@media (max-width: 1180px) {
  .order-main {
    grid-template-columns: minmax(150px, 0.9fr) minmax(0, 1.3fr) 94px 82px;
  }

  .order-status-badge {
    display: none;
  }
}

@media (max-width: 900px) {
  .orders-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .filter-group {
    justify-content: flex-start;
  }

  .order-main {
    grid-template-columns: 1fr 1fr;
    gap: 9px 14px;
  }

  .order-items {
    grid-column: span 2;
    grid-row: 2;
  }

  .order-payment {
    align-items: flex-end;
  }

  .order-total {
    text-align: left;
  }

  .detail-controls {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .orders-panel {
    padding: 13px;
  }

  .result-hint {
    display: none;
  }

  .filter-group {
    width: 100%;
  }

  .select-wrap {
    flex: 1;
  }

  .order-row {
    flex-direction: column;
  }

  .order-main {
    padding: 13px;
  }

  .order-actions {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding: 8px 13px;
    border-top: 1px solid var(--line-soft);
    border-left: 0;
  }

  .quick-pay,
  .quick-status {
    padding: 6px 10px;
  }

  .detail-arrow {
    margin-left: 4px;
  }

  .detail-meta-grid,
  .payment-facts {
    grid-template-columns: 1fr;
  }

  .detail-meta-grid > div {
    padding: 8px 10px;
  }

  .unpaid-box {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-controls {
    gap: 14px;
  }
}

.orders-panel,
.order-row,
.empty-state {
  border: 1px solid var(--line);
  border-top: 4px solid var(--brand);
  border-radius: var(--radius);
  box-shadow: none;
}

.status-tab {
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-weight: 800;
}

.status-tab.is-active {
  border-color: var(--brand-dark);
  color: #fff7df;
  background: var(--brand);
}

.tab-count {
  font-family: var(--font-mono);
  background: var(--amber);
  color: var(--brand-dark);
}

.search-box,
.select-wrap {
  min-height: 44px;
  border: 2px solid var(--line);
  border-radius: 4px;
  background: var(--surface);
}

.order-row {
  border-left: 5px solid var(--brand);
  background: var(--surface);
}

.order-row:hover {
  border-left-color: var(--amber);
  background: #fffdf7;
}

.order-number {
  padding: 4px 7px;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--brand-dark);
  background: var(--amber-light);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
}

.channel-tag,
.payment-method,
.detail-channel {
  border: 1px solid var(--line-strong);
  border-radius: 3px;
  background: var(--amber-light);
  color: var(--ink);
  font-weight: 800;
}

.order-total strong,
.detail-item-total {
  color: var(--brand-dark);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 400;
}

.quick-pay,
.quick-status,
.detail-arrow {
  min-height: 44px;
  border: 2px solid var(--brand);
  border-radius: 4px;
  font-weight: 800;
}

.quick-status {
  color: #fff7df;
  background: var(--brand);
}

.quick-pay {
  color: var(--brand-dark);
  background: var(--amber);
}

.quick-pay:active,
.quick-status:active {
  transform: translateY(1px);
}

.order-status-badge,
.badge {
  border: 1px solid currentColor;
  border-radius: 3px;
  font-weight: 800;
}

.modal-card {
  border: 2px solid var(--brand-dark);
  border-radius: var(--radius-lg);
}

.modal-head {
  border-bottom: 2px solid var(--line);
  background: var(--brand);
  color: #fff7df;
}

.modal-title,
.modal-subtitle {
  color: #fff7df;
}

.status-option {
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 4px;
}

.status-option.is-active {
  border: 2px solid var(--brand);
  background: var(--brand-soft);
  color: var(--brand-dark);
}

@media (max-width: 720px) {
  .orders-panel {
    padding: 10px;
  }

  .orders-toolbar,
  .filter-group {
    align-items: stretch;
  }

  .search-box,
  .select-wrap {
    width: 100%;
  }

  .order-row {
    border-left-width: 4px;
  }
}
</style>
