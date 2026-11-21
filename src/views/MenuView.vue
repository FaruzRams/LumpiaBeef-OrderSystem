<script setup>
import { computed, reactive, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import BaseModal from '../components/BaseModal.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import { useMenuStore } from '../stores/menu'
import { useToast } from '../composables/useToast'
import { formatRupiah } from '../utils/format'

const menuStore = useMenuStore()
const toast = useToast()

const tab = ref('menu')
const pencarian = ref('')
const modalOpen = ref(false)
const modalJenis = ref('menu')
const editingId = ref(null)
const formError = ref('')

const form = reactive({
  nama: '',
  harga: '',
  komposisi: '',
  tersedia: true,
  gambar: '',
})

const menuTerfilter = computed(() => {
  const kataKunci = pencarian.value.trim().toLowerCase()
  if (!kataKunci) return menuStore.menus
  return menuStore.menus.filter(
    (menu) =>
      menu.nama.toLowerCase().includes(kataKunci) ||
      menu.komposisi.toLowerCase().includes(kataKunci),
  )
})

const toppingTerfilter = computed(() => {
  const kataKunci = pencarian.value.trim().toLowerCase()
  if (!kataKunci) return menuStore.toppings
  return menuStore.toppings.filter((topping) =>
    topping.nama.toLowerCase().includes(kataKunci),
  )
})

const judulModal = computed(() => {
  const jenis = modalJenis.value === 'menu' ? 'menu' : 'topping'
  return `${editingId.value ? 'Edit' : 'Tambah'} ${jenis}`
})

const previewHarga = computed(() => formatRupiah(Number(form.harga) || 0))

function resetForm() {
  form.nama = ''
  form.harga = ''
  form.komposisi = ''
  form.tersedia = true
  form.gambar = ''
  formError.value = ''
}

function bukaTambah() {
  modalJenis.value = tab.value
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

function bukaEdit(jenis, item) {
  modalJenis.value = jenis
  editingId.value = item.id
  form.nama = item.nama
  form.harga = String(item.harga)
  form.komposisi = item.komposisi || ''
  form.tersedia = item.tersedia
  form.gambar = item.gambar || ''
  formError.value = ''
  modalOpen.value = true
}

function uploadGambar(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    formError.value = 'File harus berupa gambar.'
    event.target.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    formError.value = 'Ukuran gambar maksimal 2 MB.'
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    form.gambar = String(reader.result || '')
    formError.value = ''
  }
  reader.readAsDataURL(file)
}

function hapusGambar() {
  form.gambar = ''
}

function simpan() {
  formError.value = ''
  const nama = form.nama.trim()
  const harga = Number(form.harga)

  if (!nama) {
    formError.value = 'Nama wajib diisi.'
    return
  }
  if (!Number.isFinite(harga) || harga <= 0) {
    formError.value = 'Harga harus berupa angka lebih dari 0.'
    return
  }

  const data = {
    nama,
    harga,
    komposisi: form.komposisi,
    tersedia: form.tersedia,
    gambar: form.gambar,
  }

  if (editingId.value) {
    const berhasil =
      modalJenis.value === 'menu'
        ? menuStore.perbaruiMenu(editingId.value, data)
        : menuStore.perbaruiTopping(editingId.value, data)
    if (!berhasil) {
      formError.value = 'Data tidak ditemukan. Muat ulang halaman dan coba lagi.'
      return
    }
    toast.sukses(`${modalJenis.value === 'menu' ? 'Menu' : 'Topping'} ${nama} diperbarui.`)
  } else if (modalJenis.value === 'menu') {
    menuStore.tambahMenu(data)
    toast.sukses(`Menu ${nama} ditambahkan.`)
  } else {
    menuStore.tambahTopping(data)
    toast.sukses(`Topping ${nama} ditambahkan.`)
  }

  modalOpen.value = false
}

function toggleMenu(menu) {
  menuStore.toggleKetersediaanMenu(menu.id)
  toast.info(
    `${menu.nama} kini ${menu.tersedia ? 'tersedia' : 'tidak tersedia'} untuk dijual.`,
  )
}

function toggleTopping(topping) {
  menuStore.toggleKetersediaanTopping(topping.id)
  toast.info(
    `${topping.nama} kini ${topping.tersedia ? 'tersedia' : 'tidak tersedia'} sebagai topping.`,
  )
}

function gantiTab(nilai) {
  tab.value = nilai
  pencarian.value = ''
}
</script>

<template>
  <div class="menu-page">
    <section class="catalog-hero">
      <div class="catalog-hero-copy">
        <span class="catalog-eyebrow">Katalog outlet</span>
        <h2>Atur menu, harga, dan topping.</h2>
        <p>
          Perubahan langsung diterapkan pada halaman pesanan baru. Riwayat transaksi
          tetap aman karena harga disimpan sebagai snapshot saat pesanan dibuat.
        </p>
      </div>
      <div class="catalog-stats">
        <div class="catalog-stat">
          <span>Menu</span>
          <strong>{{ menuStore.jumlahMenuTersedia }}<small>/{{ menuStore.jumlahMenu }}</small></strong>
          <p>tersedia</p>
        </div>
        <div class="catalog-stat">
          <span>Topping</span>
          <strong>{{ menuStore.toppingTersedia.length }}<small>/{{ menuStore.jumlahTopping }}</small></strong>
          <p>tersedia</p>
        </div>
      </div>
    </section>

    <section class="card catalog-card">
      <header class="catalog-card-head">
        <div class="catalog-tabs">
          <button
            type="button"
            class="catalog-tab"
            :class="{ 'is-active': tab === 'menu' }"
            @click="gantiTab('menu')"
          >
            <AppIcon name="utensils" :size="15" />
            Menu
            <span>{{ menuStore.jumlahMenu }}</span>
          </button>
          <button
            type="button"
            class="catalog-tab"
            :class="{ 'is-active': tab === 'topping' }"
            @click="gantiTab('topping')"
          >
            <AppIcon name="sparkles" :size="15" />
            Topping
            <span>{{ menuStore.jumlahTopping }}</span>
          </button>
        </div>

        <button type="button" class="btn btn-primary btn-sm" @click="bukaTambah">
          <AppIcon name="plus" :size="15" />
          Tambah {{ tab === 'menu' ? 'Menu' : 'Topping' }}
        </button>
      </header>

      <div class="catalog-toolbar">
        <div class="catalog-search">
          <AppIcon name="search" :size="16" />
          <input
            v-model="pencarian"
            type="search"
            class="input"
            :placeholder="tab === 'menu' ? 'Cari nama atau komposisi menu...' : 'Cari topping...'"
          />
        </div>
        <span class="catalog-note">
          <AppIcon name="info" :size="13" />
          Nonaktifkan item alih-alih menghapus agar riwayat tetap utuh.
        </span>
      </div>

      <template v-if="tab === 'menu'">
        <div class="catalog-head">
          <span class="head-index" />
          <span>Foto</span>
          <span>Menu</span>
          <span>Harga</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>

        <div v-if="menuTerfilter.length" class="catalog-rows">
          <article
            v-for="(menu, index) in menuTerfilter"
            :key="menu.id"
            class="catalog-row"
            :class="{ 'is-off': !menu.tersedia }"
          >
            <span class="catalog-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="catalog-photo">
              <img v-if="menu.gambar" :src="menu.gambar" :alt="`Foto ${menu.nama}`" />
              <span v-else><AppIcon name="utensils" :size="18" /></span>
            </div>
            <div class="catalog-main">
              <div class="catalog-title">
                <h3>{{ menu.nama }}</h3>
                <span v-if="!menu.tersedia" class="off-tag">Nonaktif</span>
              </div>
              <p>{{ menu.komposisi || 'Komposisi belum diisi.' }}</p>
            </div>
            <div class="catalog-price">
              <span>Harga</span>
              <strong>{{ formatRupiah(menu.harga) }}</strong>
            </div>
            <div class="catalog-status">
              <ToggleSwitch
                :model-value="menu.tersedia"
                :label="`Ketersediaan ${menu.nama}`"
                @update:model-value="toggleMenu(menu)"
              />
              <span>{{ menu.tersedia ? 'Tersedia' : 'Tidak tersedia' }}</span>
            </div>
            <button
              type="button"
              class="icon-btn catalog-edit"
              title="Edit menu"
              @click="bukaEdit('menu', menu)"
            >
              <AppIcon name="edit" :size="16" />
            </button>
          </article>
        </div>

        <div v-else class="empty-state compact">
          <span class="empty-icon"><AppIcon name="search" :size="24" /></span>
          <h4>Menu tidak ditemukan</h4>
          <p>Coba kata kunci lain atau tambahkan menu baru.</p>
        </div>
      </template>

      <template v-else>
        <div class="catalog-head catalog-head-topping">
          <span class="head-index" />
          <span>Topping</span>
          <span>Harga</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>

        <div v-if="toppingTerfilter.length" class="catalog-rows">
          <article
            v-for="(topping, index) in toppingTerfilter"
            :key="topping.id"
            class="catalog-row catalog-row-topping"
            :class="{ 'is-off': !topping.tersedia }"
          >
            <span class="catalog-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="catalog-main">
              <div class="catalog-title">
                <h3>{{ topping.nama }}</h3>
                <span v-if="!topping.tersedia" class="off-tag">Nonaktif</span>
              </div>
              <p>Tambahan untuk semua varian menu.</p>
            </div>
            <div class="catalog-price">
              <span>Harga</span>
              <strong>+{{ formatRupiah(topping.harga) }}</strong>
            </div>
            <div class="catalog-status">
              <ToggleSwitch
                :model-value="topping.tersedia"
                :label="`Ketersediaan topping ${topping.nama}`"
                @update:model-value="toggleTopping(topping)"
              />
              <span>{{ topping.tersedia ? 'Tersedia' : 'Tidak tersedia' }}</span>
            </div>
            <button
              type="button"
              class="icon-btn catalog-edit"
              title="Edit topping"
              @click="bukaEdit('topping', topping)"
            >
              <AppIcon name="edit" :size="16" />
            </button>
          </article>
        </div>

        <div v-else class="empty-state compact">
          <span class="empty-icon"><AppIcon name="search" :size="24" /></span>
          <h4>Topping tidak ditemukan</h4>
          <p>Coba kata kunci lain atau tambahkan topping baru.</p>
        </div>
      </template>
    </section>

    <div class="catalog-footnote">
      <AppIcon name="info" :size="15" />
      <p>
        Harga menu dan topping mengacu pada data awal PRD. Ketersediaan bersifat
        simulasi lokal dan tidak mengurangi stok bahan baku.
      </p>
    </div>

    <BaseModal
      :open="modalOpen"
      :title="judulModal"
      :subtitle="
        modalJenis === 'menu'
          ? 'Perubahan foto dan harga berlaku untuk pesanan berikutnya.'
          : 'Topping dapat dipilih pada setiap item pesanan.'
      "
      :size="modalJenis === 'menu' ? 'md' : 'sm'"
      @close="modalOpen = false"
    >
      <form class="catalog-form" @submit.prevent="simpan">
        <div v-if="modalJenis === 'menu'" class="image-editor">
          <div class="image-preview">
            <img v-if="form.gambar" :src="form.gambar" :alt="form.nama || 'Pratinjau foto menu'" />
            <span v-else>
              <AppIcon name="utensils" :size="26" />
              Belum ada foto
            </span>
          </div>
          <div class="image-controls">
            <label class="image-upload">
              <AppIcon name="plus" :size="15" />
              Pilih foto
              <input type="file" accept="image/*" @change="uploadGambar" />
            </label>
            <button
              v-if="form.gambar"
              type="button"
              class="btn btn-ghost btn-sm"
              @click="hapusGambar"
            >
              Hapus foto
            </button>
            <label class="field image-url-field">
              <span class="field-label">Atau URL gambar <small>(opsional)</small></span>
              <input
                v-model="form.gambar"
                type="text"
                class="input"
                placeholder="https://contoh.com/foto-menu.jpg"
              />
            </label>
          </div>
        </div>

        <label class="field">
          <span class="field-label">Nama {{ modalJenis }}</span>
          <input
            v-model="form.nama"
            type="text"
            class="input"
            :placeholder="modalJenis === 'menu' ? 'Contoh: Lumpia Beef Patty' : 'Contoh: Keju'"
            required
          />
        </label>

        <label class="field">
          <span class="field-label">Harga</span>
          <div class="price-input">
            <span>Rp</span>
            <input
              v-model="form.harga"
              type="number"
              min="1"
              step="1"
              class="input"
              placeholder="0"
              required
            />
          </div>
          <span class="field-hint">Pratinjau: {{ previewHarga }}</span>
        </label>

        <label v-if="modalJenis === 'menu'" class="field">
          <span class="field-label">Komposisi <small>(opsional)</small></span>
          <textarea
            v-model="form.komposisi"
            class="input textarea"
            rows="3"
            placeholder="Contoh: Lumpia, beef patty, keju, telur, selada, kol"
          />
        </label>

        <div class="availability-row">
          <div>
            <strong>Tersedia untuk dijual</strong>
            <span>Item nonaktif tidak tampil sebagai pilihan pada halaman pemesanan.</span>
          </div>
          <ToggleSwitch v-model="form.tersedia" label="Ketersediaan" />
        </div>

        <p v-if="formError" class="form-error">
          <AppIcon name="alert" :size="14" />
          {{ formError }}
        </p>

        <div class="catalog-form-actions">
          <button type="button" class="btn btn-ghost" @click="modalOpen = false">
            Batal
          </button>
          <button type="submit" class="btn btn-primary">
            <AppIcon name="check" :size="16" />
            Simpan {{ modalJenis === 'menu' ? 'Menu' : 'Topping' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.menu-page {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.catalog-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  padding: 24px 26px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 92% 10%, rgba(233, 162, 59, 0.12), transparent 34%),
    linear-gradient(120deg, #fffdf9, #f9f2e7);
}

.catalog-hero-copy {
  max-width: 640px;
}

.catalog-eyebrow {
  display: block;
  margin-bottom: 6px;
  color: var(--brand);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.catalog-hero h2 {
  margin: 0 0 7px;
  font-family: var(--font-display);
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.catalog-hero p {
  margin: 0;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.65;
}

.catalog-stats {
  display: flex;
  gap: 10px;
  flex: 0 0 auto;
}

.catalog-stat {
  min-width: 104px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
}

.catalog-stat > span {
  display: block;
  color: var(--muted-light);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.catalog-stat strong {
  display: block;
  margin-top: 3px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
}

.catalog-stat small {
  color: var(--muted-light);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
}

.catalog-stat p {
  margin: 3px 0 0;
  color: var(--muted-light);
  font-size: 8.5px;
}

.catalog-card {
  padding: 20px;
}

.catalog-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.catalog-tabs {
  display: flex;
  gap: 5px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface-alt);
}

.catalog-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 6px;
  color: var(--muted);
  font-size: 10.5px;
  font-weight: 600;
}

.catalog-tab span {
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(42, 33, 26, 0.06);
  font-size: 8px;
  font-weight: 700;
}

.catalog-tab.is-active {
  color: var(--brand);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.catalog-tab.is-active span {
  color: var(--brand);
  background: var(--brand-soft);
}

.catalog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 17px 0 13px;
}

.catalog-search {
  position: relative;
  width: 300px;
  max-width: 100%;
}

.catalog-search svg {
  position: absolute;
  top: 50%;
  left: 11px;
  color: var(--muted-light);
  transform: translateY(-50%);
  pointer-events: none;
}

.catalog-search .input {
  padding: 8px 12px 8px 33px;
  font-size: 10.5px;
}

.catalog-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted-light);
  font-size: 8.5px;
}

.catalog-head {
  display: grid;
  grid-template-columns: 22px 62px minmax(0, 1fr) 100px 110px 32px;
  gap: 14px;
  padding: 7px 12px;
  border-radius: 7px;
  color: var(--muted-light);
  background: var(--surface-alt);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-head-topping,
.catalog-row-topping {
  grid-template-columns: 22px minmax(0, 1fr) 100px 110px 32px;
}

.catalog-rows {
  display: flex;
  flex-direction: column;
}

.catalog-row {
  display: grid;
  grid-template-columns: 22px 62px minmax(0, 1fr) 100px 110px 32px;
  align-items: center;
  gap: 14px;
  padding: 13px 12px;
  border-bottom: 1px solid var(--line-soft);
}

.catalog-row:last-child {
  border-bottom: 0;
}

.catalog-row.is-off {
  background: #fcfaf7;
}

.catalog-index {
  color: var(--muted-light);
  font-family: var(--font-mono);
  font-size: 8.5px;
}

.catalog-photo {
  width: 62px;
  height: 52px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface-alt);
}

.catalog-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.catalog-photo > span {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--muted-light);
}

.catalog-main {
  min-width: 0;
}

.catalog-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.catalog-title h3 {
  margin: 0;
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.is-off .catalog-title h3 {
  color: var(--muted);
}

.off-tag {
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--brand);
  background: var(--brand-soft);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.catalog-main p {
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--muted-light);
  font-size: 9px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.catalog-price > span {
  display: none;
  color: var(--muted-light);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.catalog-price strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.catalog-row-topping .catalog-price strong {
  color: var(--amber-deep);
}

.catalog-status {
  display: flex;
  align-items: center;
  gap: 7px;
}

.catalog-status > span {
  color: var(--muted);
  font-size: 8.5px;
  font-weight: 500;
  white-space: nowrap;
}

.catalog-edit {
  width: 28px;
  height: 28px;
  color: var(--muted-light);
}

.catalog-edit:hover {
  color: var(--brand);
  background: var(--brand-soft);
}

.catalog-footnote {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 0 4px;
  color: var(--muted-light);
}

.catalog-footnote svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--amber-deep);
}

.catalog-footnote p {
  margin: 0;
  font-size: 9px;
  line-height: 1.55;
}

.catalog-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.price-input {
  position: relative;
}

.price-input > span {
  position: absolute;
  top: 50%;
  left: 12px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  transform: translateY(-50%);
}

.price-input .input {
  padding-left: 32px;
}

.field-hint {
  color: var(--muted-light);
  font-size: 8.5px;
}

.image-editor {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.image-preview {
  height: 135px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface-alt);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview > span {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--muted-light);
  font-size: 9px;
}

.image-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
}

.image-upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 7px 10px;
  border: 1px solid var(--brand);
  border-radius: 7px;
  color: var(--brand);
  background: var(--brand-soft);
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
}

.image-upload input {
  display: none;
}

.image-url-field {
  width: 100%;
}

.availability-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface-alt);
}

.availability-row > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.availability-row strong {
  color: var(--ink);
  font-size: 10px;
  font-weight: 600;
}

.availability-row span {
  color: var(--muted-light);
  font-size: 8px;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  padding: 8px 10px;
  border-radius: 7px;
  color: var(--danger);
  background: var(--danger-soft);
  font-size: 9px;
}

.catalog-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  padding-top: 13px;
  border-top: 1px solid var(--line-soft);
}

@media (max-width: 900px) {
  .catalog-hero {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .catalog-stats {
    justify-content: flex-start;
  }

  .catalog-note {
    display: none;
  }

  .catalog-search {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .catalog-card {
    padding: 14px;
  }

  .catalog-card-head {
    flex-direction: column;
    align-items: stretch;
  }

  .catalog-tabs {
    width: 100%;
  }

  .catalog-tab {
    flex: 1;
    justify-content: center;
  }

  .catalog-head {
    display: none;
  }

  .catalog-row {
    position: relative;
    grid-template-columns: 62px minmax(0, 1fr) 28px;
    gap: 7px 12px;
    padding: 13px 4px;
  }

  .catalog-row-topping {
    grid-template-columns: minmax(0, 1fr) auto 28px;
  }

  .catalog-row-topping .catalog-main {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .catalog-index {
    display: none;
  }

  .catalog-main {
    grid-column: 2;
    grid-row: 1;
  }

  .catalog-main p {
    white-space: normal;
  }

  .catalog-price {
    grid-column: 1;
    grid-row: 2;
  }

  .catalog-price > span {
    display: block;
  }

  .catalog-status {
    grid-column: 2;
    grid-row: 2;
    justify-self: end;
  }

  .catalog-photo {
    grid-column: 1;
    grid-row: 1;
  }

  .catalog-edit {
    position: static;
    grid-column: 3;
    grid-row: 1;
    align-self: start;
    justify-self: end;
    margin: 0;
  }

  .catalog-hero h2 {
    font-size: 22px;
  }

  .catalog-stats {
    width: 100%;
  }

  .catalog-stat {
    flex: 1;
  }
}
</style>
