<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import BaseModal from '../components/BaseModal.vue'
import QtyStepper from '../components/QtyStepper.vue'
import { useAuthStore } from '../stores/auth'
import { useMenuStore } from '../stores/menu'
import { useOrderStore } from '../stores/orders'
import { useToast } from '../composables/useToast'
import { formatRupiah } from '../utils/format'

const router = useRouter()
const auth = useAuthStore()
const menuStore = useMenuStore()
const orderStore = useOrderStore()
const toast = useToast()

const adalahPembeli = computed(() => auth.isPembeli)
const kanal = ref(auth.isPembeli ? 'Pickup' : 'Langsung')
const namaPelanggan = ref(auth.isPembeli ? auth.currentUser?.nama || '' : '')
const catatan = ref('')
const cart = ref([])
const pencarianMenu = ref('')
const paymentMethod = ref(auth.isPembeli ? 'QRIS' : 'Tunai')
const bayarNanti = ref(false)
const uangDiterima = ref('')
const error = ref('')
const menyimpan = ref(false)
const pesananSukses = ref(null)
const modalBayarOpen = ref(false)
const cartSection = ref(null)

const modalItemOpen = ref(false)
const editingIndex = ref(null)
const draft = reactive({
  menuId: '',
  jumlah: 1,
  toppingIds: [],
})

const opsiKanal = [
  {
    value: 'Langsung',
    icon: 'store',
    judul: 'Langsung',
    deskripsi: 'Pelanggan di outlet',
  },
  {
    value: 'GoFood',
    icon: 'smartphone',
    judul: 'GoFood',
    deskripsi: 'Input manual aplikasi',
  },
  {
    value: 'GrabFood',
    icon: 'bike',
    judul: 'GrabFood',
    deskripsi: 'Input manual aplikasi',
  },
]

const menuTampil = computed(() => {
  const kataKunci = pencarianMenu.value.trim().toLowerCase()
  if (!kataKunci) return menuStore.menus
  return menuStore.menus.filter(
    (menu) =>
      menu.nama.toLowerCase().includes(kataKunci) ||
      menu.komposisi.toLowerCase().includes(kataKunci),
  )
})

const hargaOriginal = {
  'menu-telur-original': 14000,
  'menu-beef-original': 14000,
  'menu-beef-patty': 19000,
  'menu-beef-patty-spesial': 23500,
  'menu-beef-patty-brutal': 26000,
  'menu-beef-patty-maksimal': 27500,
}

function originalMenu(menu) {
  return hargaOriginal[menu.id] || null
}

const menuDraft = computed(() => menuStore.menuById(draft.menuId))
const toppingDraft = computed(() =>
  draft.toppingIds
    .map((id) => menuStore.toppingById(id))
    .filter(Boolean),
)
const totalToppingDraft = computed(() =>
  toppingDraft.value.reduce((total, topping) => total + topping.harga, 0),
)
const hargaSatuanDraft = computed(
  () => (menuDraft.value?.harga || 0) + totalToppingDraft.value,
)
const totalDraft = computed(() => hargaSatuanDraft.value * draft.jumlah)

const cartDetail = computed(() =>
  cart.value.map((line, index) => {
    const menu = menuStore.menuById(line.menuId)
    const toppings = line.toppingIds
      .map((id) => menuStore.toppingById(id))
      .filter(Boolean)
    const hargaSatuan = (menu?.harga || 0) + toppings.reduce((t, item) => t + item.harga, 0)
    return {
      ...line,
      index,
      menu,
      toppings,
      hargaSatuan,
      total: hargaSatuan * line.jumlah,
    }
  }),
)

const totalItem = computed(() =>
  cart.value.reduce((total, line) => total + line.jumlah, 0),
)

const subtotal = computed(() =>
  cartDetail.value.reduce((total, line) => total + line.total, 0),
)

const total = computed(() => subtotal.value)

const ikonKanalAktif = computed(() =>
  adalahPembeli.value
    ? 'bag'
    : opsiKanal.find((item) => item.value === kanal.value)?.icon || 'store',
)

const kembalian = computed(() =>
  Math.max(0, Number(uangDiterima.value || 0) - total.value),
)

const saranUang = computed(() => {
  if (!total.value) return []
  const nilai = new Set([
    total.value,
    Math.ceil(total.value / 5000) * 5000,
    Math.ceil(total.value / 10000) * 10000,
    50000,
    100000,
  ])
  return [...nilai]
    .filter((nominal) => nominal >= total.value)
    .sort((a, b) => a - b)
    .slice(0, 5)
})

watch(subtotal, (nilaiBaru) => {
  if (paymentMethod.value !== 'Tunai') return
  const diterima = Number(uangDiterima.value || 0)
  if (!uangDiterima.value || diterima < nilaiBaru) {
    uangDiterima.value = nilaiBaru ? String(nilaiBaru) : ''
  }
})

function pilihMetode(metode) {
  bayarNanti.value = false
  paymentMethod.value = metode
  if (metode === 'Tunai' && Number(uangDiterima.value || 0) < total.value) {
    uangDiterima.value = total.value ? String(total.value) : ''
  }
}

function bukaModalMenu(menu) {
  if (!menu.tersedia) return
  editingIndex.value = null
  draft.menuId = menu.id
  draft.jumlah = 1
  draft.toppingIds = []
  modalItemOpen.value = true
}

function editItem(index) {
  const line = cart.value[index]
  if (!line) return
  editingIndex.value = index
  draft.menuId = line.menuId
  draft.jumlah = line.jumlah
  draft.toppingIds = [...line.toppingIds]
  modalItemOpen.value = true
}

function toggleTopping(id) {
  const index = draft.toppingIds.indexOf(id)
  if (index === -1) draft.toppingIds.push(id)
  else draft.toppingIds.splice(index, 1)
}

function simpanItem() {
  if (!menuDraft.value) return
  if (draft.jumlah < 1) {
    toast.error('Jumlah item minimal 1.')
    return
  }

  const data = {
    menuId: draft.menuId,
    jumlah: draft.jumlah,
    toppingIds: [...draft.toppingIds],
  }

  if (editingIndex.value === null) {
    cart.value.push(data)
  } else {
    cart.value.splice(editingIndex.value, 1, data)
  }

  modalItemOpen.value = false
  toast.sukses(
    `${menuDraft.value.nama} ditambahkan ke pesanan.`,
  )
}

function ubahJumlah(index, jumlah) {
  const line = cart.value[index]
  if (line) line.jumlah = jumlah
}

function hapusItem(index) {
  const line = cartDetail.value[index]
  cart.value.splice(index, 1)
  if (line?.menu) toast.info(`${line.menu.nama} dihapus dari pesanan.`)
}

function kosongkanPesanan() {
  cart.value = []
  uangDiterima.value = ''
  error.value = ''
  toast.info('Keranjang pesanan dikosongkan.')
}

function lihatPesanan() {
  cartSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function resetForm() {
  cart.value = []
  namaPelanggan.value = adalahPembeli.value ? auth.currentUser?.nama || '' : ''
  catatan.value = ''
  kanal.value = adalahPembeli.value ? 'Pickup' : 'Langsung'
  paymentMethod.value = adalahPembeli.value ? 'QRIS' : 'Tunai'
  bayarNanti.value = false
  uangDiterima.value = ''
  error.value = ''
}

function validasiKeranjang() {
  if (cart.value.length) return true
  error.value = 'Pesanan masih kosong. Tambahkan minimal satu menu terlebih dahulu.'
  toast.error(error.value)
  return false
}

function simpanKeStore(pembayaran) {
  menyimpan.value = true

  const hasil = orderStore.buatPesanan({
    kanal: kanal.value,
    namaPelanggan: namaPelanggan.value,
    catatan: catatan.value,
    items: cart.value.map((line) => ({
      menuId: line.menuId,
      jumlah: line.jumlah,
      toppingIds: line.toppingIds,
    })),
    pembayaran,
    pembeli: adalahPembeli.value
      ? { id: auth.currentUser?.id, nama: auth.currentUser?.nama }
      : null,
  })

  menyimpan.value = false

  if (!hasil.ok) {
    error.value = hasil.message
    toast.error(hasil.message)
    return
  }

  pesananSukses.value = hasil.order
  resetForm()
  toast.sukses(
    adalahPembeli.value
      ? `Pembayaran berhasil. Pesanan ${hasil.order.nomorPesanan} akan segera diproses.`
      : `Pesanan ${hasil.order.nomorPesanan} berhasil disimpan.`,
  )
}

function simpanPesanan() {
  error.value = ''
  if (!validasiKeranjang()) return

  if (adalahPembeli.value) {
    modalBayarOpen.value = true
    return
  }

  const pembayaran = bayarNanti.value
    ? null
    : paymentMethod.value === 'Tunai'
      ? { metode: 'Tunai', jumlahDibayar: Number(uangDiterima.value || 0) }
      : { metode: 'QRIS', jumlahDibayar: total.value }

  simpanKeStore(pembayaran)
}

function prosesPembayaranPembeli() {
  modalBayarOpen.value = false
  simpanKeStore({ metode: 'QRIS', jumlahDibayar: total.value })
}

function tutupSukses() {
  pesananSukses.value = null
}

function bukaDaftarPesanan() {
  const id = pesananSukses.value?.id
  pesananSukses.value = null
  router.push({
    name: adalahPembeli.value ? 'pesanan-saya' : 'pesanan',
    query: id ? { order: id } : {},
  })
}
</script>

<template>
  <div class="new-order">
    <div class="builder">
      <section class="card order-info-card">
        <template v-if="adalahPembeli">
          <div class="section-heading">
            <div>
              <span class="card-eyebrow">Langkah 1</span>
              <h2>Pickup pesanan</h2>
            </div>
            <span class="channel-pill">Pickup</span>
          </div>

          <div class="buyer-pickup-card">
            <span class="buyer-pickup-icon">
              <AppIcon name="bag" :size="21" />
            </span>
            <div class="buyer-pickup-copy">
              <strong>{{ auth.currentUser?.nama }}</strong>
              <span>Pesanan atas nama akun ini, diambil sendiri di outlet.</span>
            </div>
            <span class="buyer-pickup-tag">Ambil sendiri</span>
          </div>

          <div class="buyer-steps">
            <div class="buyer-step is-active">
              <span><AppIcon name="qr" :size="16" /></span>
              <div>
                <strong>Bayar sekarang</strong>
                <small>QRIS simulasi</small>
              </div>
            </div>
            <span class="buyer-step-line" />
            <div class="buyer-step">
              <span><AppIcon name="utensils" :size="16" /></span>
              <div>
                <strong>Diproses</strong>
                <small>Setelah lunas</small>
              </div>
            </div>
            <span class="buyer-step-line" />
            <div class="buyer-step">
              <span><AppIcon name="store" :size="16" /></span>
              <div>
                <strong>Pickup</strong>
                <small>Saat siap</small>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="section-heading">
            <div>
              <span class="card-eyebrow">Langkah 1</span>
              <h2>Informasi pesanan</h2>
            </div>
            <span class="channel-pill">{{ kanal }}</span>
          </div>

          <div class="channel-grid">
            <button
              v-for="opsi in opsiKanal"
              :key="opsi.value"
              type="button"
              class="channel-option"
              :class="{ 'is-selected': kanal === opsi.value }"
              @click="kanal = opsi.value"
            >
              <span class="channel-icon"><AppIcon :name="opsi.icon" :size="19" /></span>
              <span class="channel-copy">
                <strong>{{ opsi.judul }}</strong>
                <small>{{ opsi.deskripsi }}</small>
              </span>
              <span class="channel-check">
                <AppIcon name="check" :size="12" />
              </span>
            </button>
          </div>

          <div class="order-fields">
            <label class="field">
              <span class="field-label">Nama pelanggan <small>(opsional)</small></span>
              <input
                v-model="namaPelanggan"
                type="text"
                class="input"
                placeholder="Contoh: Kak Rani / pesanan GoFood"
              />
            </label>
            <div class="order-context">
              <AppIcon name="info" :size="15" />
              <span>
                Pesanan <strong>{{ kanal }}</strong> dicatat manual oleh kasir.
                {{ kanal !== 'Langsung' ? 'Tidak ada integrasi langsung dengan aplikasi.' : '' }}
              </span>
            </div>
          </div>
        </template>
      </section>

      <section class="menu-section">
        <div class="menu-section-head">
          <div>
            <span class="card-eyebrow">Langkah 2</span>
            <h2>Pilih menu</h2>
            <p>{{ menuStore.jumlahMenuTersedia }} menu tersedia hari ini.</p>
          </div>
          <div class="menu-search">
            <AppIcon name="search" :size="16" />
            <input
              v-model="pencarianMenu"
              type="search"
              class="input"
              placeholder="Cari menu..."
              aria-label="Cari menu"
            />
          </div>
        </div>

        <div v-if="menuTampil.length" class="menu-grid">
          <button
            v-for="(menu, index) in menuTampil"
            :key="menu.id"
            type="button"
            class="menu-card"
            :class="{ 'is-unavailable': !menu.tersedia }"
            :disabled="!menu.tersedia"
            @click="bukaModalMenu(menu)"
          >
            <div class="menu-photo">
              <img v-if="menu.gambar" :src="menu.gambar" :alt="`Foto ${menu.nama}`" />
              <span v-else><AppIcon name="utensils" :size="24" /></span>
            </div>
            <div class="menu-card-top">
              <span class="menu-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span v-if="!menu.tersedia" class="menu-unavailable">Tidak tersedia</span>
            </div>
            <div class="menu-body">
              <h3>{{ menu.nama }}</h3>
              <p>{{ menu.komposisi || 'Komposisi belum diisi.' }}</p>
            </div>
            <div class="menu-card-foot">
              <div class="menu-price">
                <del v-if="originalMenu(menu)">
                  {{ formatRupiah(originalMenu(menu)) }}
                </del>
                <strong>{{ formatRupiah(menu.harga) }}</strong>
              </div>
              <span v-if="originalMenu(menu)" class="menu-discount">-20%</span>
              <span class="menu-add">
                <AppIcon name="plus" :size="14" />
                Tambah
              </span>
            </div>
          </button>
        </div>

        <div v-else class="empty-state compact">
          <span class="empty-icon"><AppIcon name="search" :size="24" /></span>
          <h4>Menu tidak ditemukan</h4>
          <p>Coba gunakan kata kunci lain.</p>
        </div>
      </section>
    </div>

    <aside ref="cartSection" class="cart-column">
      <section class="card cart-card">
        <header class="cart-head">
          <div>
            <span class="card-eyebrow">Langkah 3</span>
            <h2>Pesanan</h2>
          </div>
          <button
            v-if="cart.length"
            type="button"
            class="clear-cart"
            @click="kosongkanPesanan"
          >
            Kosongkan
          </button>
        </header>

        <div class="cart-channel">
          <span class="cart-channel-icon">
            <AppIcon :name="ikonKanalAktif" :size="15" />
          </span>
          <span>{{ kanal }}</span>
          <span v-if="namaPelanggan" class="cart-customer">· {{ namaPelanggan }}</span>
        </div>

        <div v-if="cartDetail.length" class="cart-lines">
          <article
            v-for="line in cartDetail"
            :key="line.index"
            class="cart-line"
          >
            <div class="cart-line-head">
              <div class="cart-line-title">
                <strong>{{ line.menu?.nama || 'Menu tidak ditemukan' }}</strong>
                <span>{{ formatRupiah(line.hargaSatuan) }} / item</span>
              </div>
              <button
                type="button"
                class="icon-btn cart-remove"
                title="Hapus item"
                @click="hapusItem(line.index)"
              >
                <AppIcon name="trash" :size="15" />
              </button>
            </div>

            <p v-if="line.toppings.length" class="cart-toppings">
              <AppIcon name="sparkles" :size="12" />
              {{ line.toppings.map((topping) => topping.nama).join(', ') }}
            </p>

            <div class="cart-line-foot">
              <div class="cart-qty-tools">
                <QtyStepper
                  :model-value="line.jumlah"
                  :max="99"
                  @update:model-value="ubahJumlah(line.index, $event)"
                />
                <button type="button" class="edit-line" @click="editItem(line.index)">
                  <AppIcon name="edit" :size="12" />
                  Atur
                </button>
              </div>
              <strong class="cart-line-total">{{ formatRupiah(line.total) }}</strong>
            </div>
          </article>
        </div>

        <div v-else class="cart-empty">
          <span class="cart-empty-icon"><AppIcon name="bag" :size="25" /></span>
          <h3>Keranjang masih kosong</h3>
          <p>Pilih menu di sebelah kiri untuk mulai mencatat pesanan.</p>
        </div>

        <Transition name="fade">
          <div v-if="error" class="alert alert-error cart-alert">
            <AppIcon name="alert" :size="16" />
            <span>{{ error }}</span>
          </div>
        </Transition>

        <div v-if="cart.length" class="cart-extra">
          <label class="field">
            <span class="field-label">Catatan pesanan <small>(opsional)</small></span>
            <textarea
              v-model="catatan"
              class="input textarea"
              rows="2"
              placeholder="Contoh: tanpa kol, sambal dipisah"
            />
          </label>

          <div v-if="adalahPembeli" class="buyer-payment-note">
            <span class="buyer-payment-icon"><AppIcon name="qr" :size="19" /></span>
            <div>
              <strong>Pembayaran QRIS</strong>
              <p>
                Pesanan baru diteruskan ke dapur setelah pembayaran berhasil.
                QRIS pada prototipe ini hanya simulasi.
              </p>
            </div>
            <span class="buyer-payment-total">{{ formatRupiah(total) }}</span>
          </div>

          <div v-else class="payment-section">
            <span class="field-label">Metode pembayaran</span>
            <div class="payment-methods">
              <button
                type="button"
                class="payment-method"
                :class="{ 'is-selected': paymentMethod === 'Tunai' && !bayarNanti }"
                :disabled="bayarNanti"
                @click="pilihMetode('Tunai')"
              >
                <AppIcon name="banknote" :size="17" />
                Tunai
              </button>
              <button
                type="button"
                class="payment-method"
                :class="{ 'is-selected': paymentMethod === 'QRIS' && !bayarNanti }"
                :disabled="bayarNanti"
                @click="pilihMetode('QRIS')"
              >
                <AppIcon name="qr" :size="17" />
                QRIS
              </button>
            </div>

            <label class="pay-later-toggle">
              <input v-model="bayarNanti" type="checkbox" />
              <span class="pay-later-copy">
                <strong>Catat pembayaran nanti</strong>
                <small>Pesanan disimpan dengan status Belum Dibayar.</small>
              </span>
            </label>

            <template v-if="!bayarNanti">
              <label v-if="paymentMethod === 'Tunai'" class="field cash-field">
                <span class="field-label">Uang diterima</span>
                <input
                  v-model="uangDiterima"
                  type="number"
                  min="0"
                  step="any"
                  inputmode="numeric"
                  class="input"
                  placeholder="Masukkan nominal tunai"
                />
                <div class="cash-suggestions">
                  <button
                    v-for="nominal in saranUang"
                    :key="nominal"
                    type="button"
                    class="cash-chip"
                    :class="{ 'is-active': Number(uangDiterima) === nominal }"
                    @click="uangDiterima = String(nominal)"
                  >
                    {{ nominal === total ? 'Uang pas' : formatRupiah(nominal) }}
                  </button>
                </div>
              </label>

              <div v-else class="qris-note">
                <AppIcon name="qr" :size="18" />
                <p>
                  Pembayaran QRIS dicatat sesuai total. Verifikasi QRIS nyata berada di
                  luar ruang lingkup prototipe.
                </p>
              </div>

              <div v-if="paymentMethod === 'Tunai'" class="change-row">
                <span>Kembalian</span>
                <strong :class="{ 'is-short': Number(uangDiterima) < total }">
                  {{ formatRupiah(kembalian) }}
                </strong>
              </div>
            </template>

            <div v-else class="pay-later-note">
              <AppIcon name="clock" :size="16" />
              <p>
                Pembayaran dapat dicatat kemudian melalui halaman
                <strong>Daftar Pesanan</strong>.
              </p>
            </div>
          </div>
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal · {{ totalItem }} item</span>
            <strong>{{ formatRupiah(subtotal) }}</strong>
          </div>
          <div class="summary-row summary-total">
            <span>Total</span>
            <strong>{{ formatRupiah(total) }}</strong>
          </div>
          <p class="tax-note">Belum ada pajak/biaya tambahan pada versi MVP.</p>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-block save-order"
          :disabled="menyimpan || (adalahPembeli && !cart.length)"
          @click="simpanPesanan"
        >
          <AppIcon :name="adalahPembeli ? 'qr' : 'check'" :size="17" />
          {{
            adalahPembeli
              ? cart.length
                ? `Bayar ${formatRupiah(total)} & Pesan`
                : 'Pilih menu terlebih dahulu'
              : 'Simpan Pesanan'
          }}
        </button>
        <p v-if="adalahPembeli && cart.length" class="buyer-pay-lock">
          <AppIcon name="lock" :size="12" />
          Pesanan akan berstatus Diproses setelah pembayaran berhasil.
        </p>
      </section>
    </aside>

    <div v-if="cart.length" class="mobile-cart-bar">
      <div>
        <span>{{ totalItem }} item</span>
        <strong>{{ formatRupiah(total) }}</strong>
      </div>
      <button type="button" class="btn btn-primary btn-sm" @click="lihatPesanan">
        Lihat Pesanan
        <AppIcon name="chevronRight" :size="15" />
      </button>
    </div>

    <BaseModal
      :open="modalItemOpen"
      :title="editingIndex === null ? 'Tambah item' : 'Atur item'"
      :subtitle="menuDraft?.nama || ''"
      size="md"
      @close="modalItemOpen = false"
    >
      <div v-if="menuDraft" class="item-modal">
        <div class="item-modal-photo">
          <img
            v-if="menuDraft.gambar"
            :src="menuDraft.gambar"
            :alt="`Foto ${menuDraft.nama}`"
          />
          <span v-else><AppIcon name="utensils" :size="28" /></span>
        </div>
        <div class="item-modal-head">
          <p>{{ menuDraft.komposisi }}</p>
          <span class="item-base-price">{{ formatRupiah(menuDraft.harga) }}</span>
        </div>

        <div class="field">
          <span class="field-label">Jumlah</span>
          <div class="qty-row">
            <QtyStepper v-model="draft.jumlah" :max="99" />
            <span class="qty-caption">
              {{ formatRupiah(hargaSatuanDraft) }} per item
            </span>
          </div>
        </div>

        <div class="field">
          <span class="field-label">Topping tambahan <small>(opsional)</small></span>
          <div v-if="menuStore.toppingTersedia.length" class="topping-grid">
            <button
              v-for="topping in menuStore.toppingTersedia"
              :key="topping.id"
              type="button"
              class="topping-option"
              :class="{ 'is-selected': draft.toppingIds.includes(topping.id) }"
              @click="toggleTopping(topping.id)"
            >
              <span class="topping-check">
                <AppIcon name="check" :size="11" />
              </span>
              <span class="topping-name">{{ topping.nama }}</span>
              <span class="topping-price">+{{ formatRupiah(topping.harga) }}</span>
            </button>
          </div>
          <p v-else class="small-note">Tidak ada topping yang tersedia saat ini.</p>
        </div>

        <div class="item-modal-total">
          <span>Total item</span>
          <strong>{{ formatRupiah(totalDraft) }}</strong>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-ghost" @click="modalItemOpen = false">
          Batal
        </button>
        <button type="button" class="btn btn-primary" @click="simpanItem">
          <AppIcon name="check" :size="16" />
          {{ editingIndex === null ? 'Tambah ke Pesanan' : 'Simpan Perubahan' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :open="modalBayarOpen"
      title="Konfirmasi pembayaran"
      subtitle="Simulasi QRIS untuk pesanan pickup."
      size="sm"
      @close="modalBayarOpen = false"
    >
      <div class="pay-modal">
        <div class="pay-qris">
          <span class="pay-qris-label">QRIS SIMULASI</span>
          <div class="pay-qris-frame">
            <AppIcon name="qr" :size="94" :stroke-width="1.2" />
          </div>
          <span class="pay-qris-caption">Lumpia Beef Obami Delima</span>
        </div>

        <div class="pay-modal-amount">
          <span>Total yang harus dibayar</span>
          <strong>{{ formatRupiah(total) }}</strong>
        </div>

        <ul class="pay-modal-list">
          <li>
            <AppIcon name="user" :size="14" />
            Atas nama <strong>{{ auth.currentUser?.nama }}</strong>
          </li>
          <li>
            <AppIcon name="bag" :size="14" />
            {{ totalItem }} item · diambil sendiri di outlet
          </li>
          <li>
            <AppIcon name="clock" :size="14" />
            Pesanan diproses setelah pembayaran berhasil
          </li>
        </ul>

        <p class="pay-modal-note">
          <AppIcon name="info" :size="13" />
          Ini pembayaran simulasi. Tidak ada transaksi QRIS nyata pada prototipe ini.
        </p>
      </div>

      <template #footer>
        <button type="button" class="btn btn-ghost" @click="modalBayarOpen = false">
          Batal
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="menyimpan"
          @click="prosesPembayaranPembeli"
        >
          <AppIcon name="check" :size="16" />
          Bayar {{ formatRupiah(total) }}
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :open="Boolean(pesananSukses)"
      :title="adalahPembeli ? 'Pembayaran berhasil' : 'Pesanan berhasil disimpan'"
      :subtitle="
        adalahPembeli
          ? 'Pesanan sudah dibayar dan akan langsung diproses untuk pickup.'
          : 'Transaksi sudah tercatat dan siap diproses.'
      "
      size="sm"
      @close="tutupSukses"
    >
      <div v-if="pesananSukses" class="success-modal">
        <div class="success-icon"><AppIcon name="check" :size="28" /></div>
        <span class="success-order-number">{{ pesananSukses.nomorPesanan }}</span>
        <div class="success-summary">
          <div>
            <span>Kanal</span>
            <strong>{{ pesananSukses.kanal }}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{{ formatRupiah(pesananSukses.total) }}</strong>
          </div>
          <div>
            <span>Pembayaran</span>
            <strong>
              {{
                pesananSukses.statusPembayaran === 'Lunas'
                  ? pesananSukses.metodePembayaran
                  : 'Belum Dibayar'
              }}
            </strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{{ pesananSukses.status }}</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-ghost" @click="tutupSukses">
          {{ adalahPembeli ? 'Pesan lagi' : 'Buat pesanan lagi' }}
        </button>
        <button type="button" class="btn btn-primary" @click="bukaDaftarPesanan">
          {{ adalahPembeli ? 'Lihat Pesanan Saya' : 'Lihat Daftar Pesanan' }}
          <AppIcon name="arrowRight" :size="16" />
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.new-order {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  align-items: start;
  gap: 20px;
}

.builder {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.order-info-card {
  padding: 20px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-heading h2 {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.channel-pill {
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--brand);
  background: var(--brand-soft);
  font-size: 9.5px;
  font-weight: 700;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
}

.channel-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  text-align: left;
  background: var(--surface);
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.channel-option:hover {
  border-color: rgba(178, 59, 37, 0.25);
}

.channel-option.is-selected {
  border-color: rgba(178, 59, 37, 0.42);
  background: #fffaf5;
  box-shadow: 0 0 0 3px rgba(178, 59, 37, 0.06);
}

.channel-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: var(--muted);
  background: var(--surface-alt);
}

.channel-option.is-selected .channel-icon {
  color: var(--brand);
  background: var(--brand-soft);
}

.channel-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.channel-copy strong {
  color: var(--ink);
  font-size: 11.5px;
  font-weight: 700;
}

.channel-copy small {
  color: var(--muted-light);
  font-size: 9px;
}

.channel-check {
  position: absolute;
  top: 7px;
  right: 7px;
  display: none;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  color: white;
  background: var(--brand);
}

.channel-option.is-selected .channel-check {
  display: grid;
}

.order-fields {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 16px;
  align-items: end;
  margin-top: 16px;
}

.order-context {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 10px 12px;
  border-radius: 9px;
  color: var(--muted);
  background: var(--surface-alt);
  font-size: 9.5px;
  line-height: 1.5;
}

.order-context svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--amber-deep);
}

.order-context strong {
  color: var(--ink);
}

.buyer-pickup-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(178, 59, 37, 0.14);
  border-radius: 12px;
  background: linear-gradient(120deg, #fffaf5, #fdf3e3);
}

.buyer-pickup-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 41px;
  height: 41px;
  border-radius: 11px;
  color: var(--brand);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.buyer-pickup-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.buyer-pickup-copy strong {
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 700;
}

.buyer-pickup-copy span {
  color: var(--muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.buyer-pickup-tag {
  flex: 0 0 auto;
  padding: 5px 8px;
  border-radius: 999px;
  color: var(--brand);
  background: var(--surface);
  border: 1px solid rgba(178, 59, 37, 0.14);
  font-size: 8.5px;
  font-weight: 700;
}

.buyer-steps {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
}

.buyer-step {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.buyer-step > span {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 31px;
  height: 31px;
  border-radius: 9px;
  color: var(--muted-light);
  background: var(--surface-alt);
  border: 1px solid var(--line);
}

.buyer-step.is-active > span {
  color: var(--brand);
  background: var(--brand-soft);
  border-color: rgba(178, 59, 37, 0.18);
}

.buyer-step div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.buyer-step strong {
  color: var(--muted);
  font-size: 9.5px;
  font-weight: 700;
  white-space: nowrap;
}

.buyer-step.is-active strong {
  color: var(--ink);
}

.buyer-step small {
  color: var(--muted-light);
  font-size: 8px;
  white-space: nowrap;
}

.buyer-step-line {
  flex: 1;
  height: 1px;
  background: var(--line);
}

.menu-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 13px;
}

.menu-section-head h2 {
  margin: 2px 0 2px;
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.menu-section-head p {
  margin: 0;
  color: var(--muted-light);
  font-size: 10px;
}

.menu-search {
  position: relative;
  width: 210px;
}

.menu-search svg {
  position: absolute;
  top: 50%;
  left: 11px;
  color: var(--muted-light);
  transform: translateY(-50%);
  pointer-events: none;
}

.menu-search .input {
  padding: 9px 12px 9px 32px;
  font-size: 11px;
  background: var(--surface);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.menu-card {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  text-align: left;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.menu-photo {
  width: calc(100% + 32px);
  height: 128px;
  margin: -16px -16px 0;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background: var(--surface-alt);
}

.menu-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-photo > span {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--muted-light);
}

.menu-card:hover:not(:disabled) {
  border-color: rgba(178, 59, 37, 0.28);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.menu-card.is-unavailable {
  opacity: 0.55;
  cursor: not-allowed;
}

.menu-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-index {
  color: var(--muted-light);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
}

.menu-unavailable {
  padding: 3px 7px;
  border-radius: 999px;
  color: var(--brand);
  background: var(--brand-soft);
  font-size: 8px;
  font-weight: 700;
}

.menu-body {
  flex: 1;
}

.menu-body h3 {
  margin: 0 0 5px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: var(--ink);
}

.menu-body p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--muted-light);
  font-size: 9.5px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.menu-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--line-soft);
}

.menu-card-foot strong {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
}

.menu-add {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 8px;
  border-radius: 6px;
  color: var(--brand);
  background: var(--brand-soft);
  font-size: 9px;
  font-weight: 700;
}

.cart-column {
  position: sticky;
  top: 96px;
}

.cart-card {
  padding: 20px;
}

.cart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cart-head h2 {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.clear-cart {
  padding: 4px 0;
  color: var(--muted-light);
  font-size: 9.5px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.clear-cart:hover {
  color: var(--brand);
}

.cart-channel {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 12px 0 4px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--muted);
  background: var(--surface-alt);
  font-size: 10px;
  font-weight: 600;
}

.cart-channel-icon {
  color: var(--brand);
}

.cart-customer {
  overflow: hidden;
  color: var(--muted-light);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-lines {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
}

.cart-line {
  padding: 13px 0;
  border-bottom: 1px solid var(--line-soft);
}

.cart-line-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.cart-line-title {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cart-line-title strong {
  color: var(--ink);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.35;
}

.cart-line-title span {
  color: var(--muted-light);
  font-size: 9px;
}

.cart-remove {
  flex: 0 0 auto;
  width: 25px;
  height: 25px;
  color: var(--muted-light);
}

.cart-remove:hover {
  color: var(--brand);
  background: var(--brand-soft);
}

.cart-toppings {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 6px 0 0;
  color: var(--amber-deep);
  font-size: 9px;
  line-height: 1.4;
}

.cart-toppings svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.cart-line-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 9px;
}

.cart-qty-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-line {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--muted-light);
  font-size: 9px;
  font-weight: 600;
}

.edit-line:hover {
  color: var(--brand);
}

.cart-line-total {
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 18px;
  text-align: center;
}

.cart-empty-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 10px;
  border-radius: 50%;
  color: var(--amber-deep);
  background: #fdf3e3;
}

.cart-empty h3 {
  margin: 0 0 5px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
}

.cart-empty p {
  max-width: 230px;
  margin: 0;
  color: var(--muted-light);
  font-size: 9.5px;
  line-height: 1.55;
}

.cart-alert {
  margin: 12px 0 0;
}

.cart-extra {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--line-soft);
}

.buyer-payment-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px;
  border: 1px solid rgba(47, 102, 144, 0.16);
  border-radius: 9px;
  background: var(--blue-soft);
}

.buyer-payment-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--blue);
  background: rgba(255, 255, 255, 0.7);
}

.buyer-payment-note div {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.buyer-payment-note strong {
  color: var(--ink);
  font-size: 10px;
  font-weight: 700;
}

.buyer-payment-note p {
  margin: 0;
  color: var(--muted);
  font-size: 8.5px;
  line-height: 1.5;
}

.buyer-payment-total {
  flex: 0 0 auto;
  color: var(--blue);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.payment-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.payment-method {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  background: var(--surface);
  font-size: 10.5px;
  font-weight: 600;
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background 0.18s ease;
}

.payment-method.is-selected {
  border-color: rgba(178, 59, 37, 0.42);
  color: var(--brand);
  background: var(--brand-soft);
}

.payment-method:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pay-later-toggle {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 9px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.pay-later-toggle:hover {
  border-color: var(--line-strong);
  background: var(--surface-alt);
}

.pay-later-toggle:has(input:checked) {
  border-color: rgba(178, 59, 37, 0.3);
  background: #fdf6ea;
}

.pay-later-toggle input {
  width: 13px;
  height: 13px;
  margin: 2px 0 0;
  accent-color: var(--brand);
}

.pay-later-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pay-later-copy strong {
  color: var(--muted);
  font-size: 9px;
  font-weight: 600;
}

.pay-later-copy small {
  color: var(--muted-light);
  font-size: 8px;
}

.pay-later-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 10px;
  border-radius: 8px;
  color: var(--muted);
  background: var(--surface-alt);
  font-size: 8.5px;
  line-height: 1.5;
}

.pay-later-note svg {
  flex: 0 0 auto;
  color: var(--amber-deep);
}

.pay-later-note p {
  margin: 0;
}

.pay-later-note strong {
  color: var(--ink);
  font-weight: 600;
}

.cash-field {
  margin-top: 2px;
}

.cash-field .input {
  padding: 8px 10px;
  font-size: 12px;
}

.cash-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}

.cash-chip {
  padding: 4px 7px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--muted);
  background: var(--surface-alt);
  font-size: 8.5px;
  font-weight: 600;
}

.cash-chip:hover,
.cash-chip.is-active {
  border-color: rgba(178, 59, 37, 0.3);
  color: var(--brand);
  background: var(--brand-soft);
}

.qris-note {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-radius: 9px;
  color: var(--muted);
  background: var(--surface-alt);
  font-size: 9px;
  line-height: 1.5;
}

.qris-note svg {
  flex: 0 0 auto;
  color: var(--brand);
}

.qris-note p {
  margin: 0;
}

.change-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 9px;
  border-radius: 7px;
  background: var(--surface-alt);
  font-size: 9.5px;
  color: var(--muted);
}

.change-row strong {
  color: var(--green);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.change-row strong.is-short {
  color: var(--danger);
}

.cart-summary {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
  color: var(--muted);
  font-size: 10px;
}

.summary-row strong {
  color: var(--ink);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.summary-total {
  margin-top: 9px;
  margin-bottom: 0;
  padding-top: 9px;
  border-top: 1px solid var(--line-soft);
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
}

.summary-total strong {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
}

.tax-note {
  margin: 6px 0 0;
  color: var(--muted-light);
  font-size: 8.5px;
  text-align: right;
}

.save-order {
  margin-top: 14px;
}

.buyer-pay-lock {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  margin: 7px 0 0;
  color: var(--muted-light);
  font-size: 8px;
  line-height: 1.45;
  text-align: center;
}

.buyer-pay-lock svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.mobile-cart-bar {
  display: none;
}

.item-modal {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.item-modal-photo {
  height: 180px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-alt);
}

.item-modal-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-modal-photo > span {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--muted-light);
}

.item-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--surface-alt);
}

.item-modal-head p {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.55;
}

.item-base-price {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 13px;
}

.qty-caption {
  color: var(--muted-light);
  font-size: 10px;
}

.topping-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.topping-option {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  text-align: left;
  color: var(--muted);
  background: var(--surface);
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.topping-option:hover {
  border-color: rgba(178, 59, 37, 0.25);
}

.topping-option.is-selected {
  border-color: rgba(178, 59, 37, 0.4);
  color: var(--brand);
  background: var(--brand-soft);
}

.topping-check {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  color: transparent;
  background: var(--surface);
}

.topping-option.is-selected .topping-check {
  border-color: var(--brand);
  color: white;
  background: var(--brand);
}

.topping-name {
  font-size: 10px;
  font-weight: 600;
}

.topping-price {
  margin-left: auto;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.item-modal-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  border-top: 1px dashed var(--line);
  color: var(--muted);
  font-size: 11px;
}

.item-modal-total strong {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}

.small-note {
  margin: 0;
  color: var(--muted-light);
  font-size: 9.5px;
}

.pay-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.pay-qris {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 14px 18px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface-alt);
}

.pay-qris-label {
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.pay-qris-frame {
  display: grid;
  place-items: center;
  width: 124px;
  height: 124px;
  border-radius: 12px;
  color: var(--ink);
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 10px 24px -18px rgba(42, 33, 26, 0.5);
}

.pay-qris-caption {
  color: var(--muted);
  font-size: 8.5px;
  font-weight: 600;
}

.pay-modal-amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.pay-modal-amount span {
  color: var(--muted);
  font-size: 9px;
  font-weight: 600;
}

.pay-modal-amount strong {
  color: var(--brand);
  font-family: var(--font-display);
  font-size: 29px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.pay-modal-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  padding: 11px 12px;
  border-radius: 9px;
  background: var(--surface-alt);
}

.pay-modal-list li {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-size: 9px;
}

.pay-modal-list svg {
  flex: 0 0 auto;
  color: var(--amber-deep);
}

.pay-modal-list strong {
  color: var(--ink);
  font-weight: 700;
}

.pay-modal-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  color: var(--muted-light);
  font-size: 8px;
  line-height: 1.5;
}

.pay-modal-note svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.success-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.success-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin-bottom: 12px;
  border-radius: 50%;
  color: var(--green);
  background: var(--green-soft);
}

.success-order-number {
  margin-bottom: 16px;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
}

.success-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.success-summary > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 8px;
  text-align: left;
  background: var(--surface-alt);
}

.success-summary span {
  color: var(--muted-light);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.success-summary strong {
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 1180px) {
  .new-order {
    grid-template-columns: minmax(0, 1fr) 350px;
  }

  .menu-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .new-order {
    grid-template-columns: 1fr;
  }

  .cart-column {
    position: static;
  }

  .menu-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mobile-cart-bar {
    position: fixed;
    right: 16px;
    bottom: 16px;
    left: 16px;
    z-index: 35;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 13px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 13px;
    color: #fbf3e8;
    background: rgba(36, 26, 19, 0.96);
    box-shadow: 0 18px 40px -20px rgba(20, 12, 8, 0.6);
    backdrop-filter: blur(10px);
  }

  .mobile-cart-bar > div {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 9px;
    color: rgba(248, 239, 228, 0.55);
  }

  .mobile-cart-bar strong {
    color: #fff8ef;
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
  }

  .new-order {
    padding-bottom: 70px;
  }
}

@media (max-width: 720px) {
  .channel-grid {
    grid-template-columns: 1fr;
  }

  .channel-option {
    padding: 10px 12px;
  }

  .order-fields {
    grid-template-columns: 1fr;
  }

  .menu-section-head {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .menu-search {
    width: 100%;
  }

  .menu-grid {
    grid-template-columns: 1fr;
  }

  .topping-grid {
    grid-template-columns: 1fr;
  }

  .cart-card,
  .order-info-card {
    padding: 16px;
  }

  .cart-lines {
    max-height: none;
  }

  .success-summary {
    grid-template-columns: 1fr;
  }
}

.order-info-card,
.menu-section,
.cart-card {
  border: 1px solid var(--line);
  border-top: 4px solid var(--brand);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: none;
}

.section-heading h2,
.menu-section-head h2,
.cart-head h2 {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.channel-pill,
.channel-check {
  border: 1px solid var(--brand);
  color: var(--brand-dark);
  background: var(--amber-light);
}

.channel-option {
  min-height: 56px;
  border: 2px solid var(--line);
  border-radius: 5px;
  box-shadow: none;
}

.channel-option.is-selected {
  border-color: var(--brand);
  background: var(--brand-soft);
  box-shadow: inset 4px 0 0 var(--brand);
}

.menu-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.menu-card {
  position: relative;
  min-height: 188px;
  border: 2px solid var(--brand-dark);
  border-radius: 5px;
  background:
    linear-gradient(135deg, transparent 0 82%, rgba(233, 166, 43, 0.12) 82%),
    var(--brand);
  color: #fff7df;
  box-shadow: 4px 4px 0 rgba(94, 15, 16, 0.18);
}

.menu-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--brand-bright);
  box-shadow: 5px 6px 0 rgba(94, 15, 16, 0.22);
}

.menu-card:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(94, 15, 16, 0.22);
}

.menu-index {
  color: var(--amber-light);
  border: 1px solid rgba(246, 231, 184, 0.42);
  font-family: var(--font-mono);
}

.menu-body h3 {
  max-width: 220px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 var(--brand-dark);
}

.menu-body p {
  color: #f6e5ca;
  font-size: 10.5px;
  line-height: 1.45;
}

.menu-card-foot {
  align-items: flex-end;
  border-top: 1px solid rgba(246, 231, 184, 0.28);
}

.menu-price {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.05;
}

.menu-price del {
  color: #dcb89f;
  font-family: var(--font-mono);
  font-size: 9.5px;
  text-decoration-thickness: 2px;
}

.menu-price strong {
  color: var(--amber-light);
  font-family: var(--font-display);
  font-size: 23px;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.menu-discount {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  clip-path: polygon(25% 7%, 75% 7%, 100% 50%, 75% 93%, 25% 93%, 0 50%);
  color: var(--brand-dark);
  background: var(--amber);
  font-family: var(--font-display);
  font-size: 13px;
  transform: rotate(7deg);
}

.menu-add {
  min-height: 44px;
  border: 1px solid #fff1c7;
  border-radius: 4px;
  color: var(--brand-dark);
  background: var(--amber-light);
  font-weight: 800;
}

.topping-grid {
  gap: 8px;
}

.topping-option {
  min-height: 48px;
  border: 2px solid var(--line);
  border-radius: 5px;
  background: var(--surface);
  box-shadow: none;
}

.topping-option.is-selected {
  border-color: var(--brand);
  background: var(--amber-light);
  box-shadow: inset 0 -3px 0 var(--amber);
}

.topping-check {
  border: 1px solid var(--line-strong);
  background: var(--surface);
}

.topping-option.is-selected .topping-check {
  border-color: var(--brand);
  background: var(--brand);
  color: #fff;
}

.cart-card {
  position: sticky;
  top: 142px;
  border-top: 5px solid var(--brand);
}

.cart-summary {
  border: 2px solid var(--brand-dark);
  background: var(--brand);
  color: #fff7df;
}

.summary-row strong,
.summary-total strong {
  color: var(--amber-light);
  font-family: var(--font-display);
  font-weight: 400;
}

.summary-total {
  border-top: 1px solid rgba(246, 231, 184, 0.32);
}

.tax-note {
  color: #efd9ba;
}

.save-order {
  min-height: 52px;
  border: 2px solid var(--brand-dark);
  background: var(--amber);
  color: var(--brand-dark);
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  box-shadow: 4px 4px 0 var(--brand-dark);
}

.save-order:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--brand-dark);
}

.qty-btn,
.payment-method,
.cash-chip,
.edit-line,
.clear-cart {
  min-height: 44px;
}

.cart-empty,
.empty-state {
  border: 1px dashed var(--line-strong);
  background: var(--surface-alt);
}

@media (max-width: 1080px) {
  .menu-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }

  .cart-card {
    position: static;
  }

  .menu-card {
    min-height: 176px;
  }
}
</style>
