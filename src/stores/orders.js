import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useMenuStore } from './menu'
import { KANAL_PESANAN, METODE_PEMBAYARAN, STATUS_PESANAN } from '../utils/constants'
import { localDateKey } from '../utils/format'
import { loadState, saveState } from '../utils/storage'

const ORDERS_KEY = 'orders'

function buatId(prefix) {
  const acak =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${acak}`
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref(loadState(ORDERS_KEY, []))

  watch(
    orders,
    () => saveState(ORDERS_KEY, orders.value),
    { deep: true },
  )

  const daftarPesanan = computed(() =>
    [...orders.value].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)),
  )

  const pesananAktif = computed(() =>
    daftarPesanan.value.filter((order) => order.status !== 'Selesai'),
  )

  const pesananLunas = computed(() =>
    daftarPesanan.value.filter((order) => order.statusPembayaran === 'Lunas'),
  )

  function orderById(id) {
    return orders.value.find((order) => order.id === id) || null
  }

  function buatNomorPesanan() {
    const sekarang = new Date()
    const kunciHari = localDateKey(sekarang).replaceAll('-', '').slice(2)
    const prefix = `LBD-${kunciHari}-`
    const urutan =
      orders.value.filter((order) => order.nomorPesanan?.startsWith(prefix)).length + 1
    return `${prefix}${String(urutan).padStart(3, '0')}`
  }

  function buatPembayaran(pembayaran, total) {
    if (!pembayaran?.metode) {
      return {
        statusPembayaran: 'Belum Dibayar',
        metodePembayaran: null,
        jumlahDibayar: null,
        kembalian: 0,
        waktuPembayaran: null,
      }
    }

    if (!METODE_PEMBAYARAN.includes(pembayaran.metode)) {
      return { error: 'Metode pembayaran harus Tunai atau QRIS.' }
    }

    let jumlah = Number(pembayaran.jumlahDibayar)

    if (pembayaran.metode === 'QRIS') {
      jumlah = total
    }

    if (!Number.isFinite(jumlah) || jumlah <= 0) {
      return { error: 'Jumlah pembayaran wajib diisi.' }
    }

    if (jumlah < total) {
      return { error: 'Jumlah pembayaran tidak boleh kurang dari total transaksi.' }
    }

    return {
      statusPembayaran: 'Lunas',
      metodePembayaran: pembayaran.metode,
      jumlahDibayar: jumlah,
      kembalian: jumlah - total,
      waktuPembayaran: new Date().toISOString(),
    }
  }

  /**
   * Membuat pesanan baru dengan snapshot harga menu dan topping.
   * Perubahan harga katalog setelah ini tidak memengaruhi pesanan lama.
   */
  function buatPesanan({
    kanal = 'Langsung',
    namaPelanggan = '',
    catatan = '',
    items = [],
    pembayaran = null,
    pembeli = null,
  } = {}) {
    const menuStore = useMenuStore()

    if (!KANAL_PESANAN.includes(kanal)) {
      return { ok: false, message: 'Kanal pesanan tidak valid.' }
    }

    if (pembeli && kanal !== 'Pickup') {
      return { ok: false, message: 'Pesanan pembeli harus menggunakan pickup.' }
    }

    if (pembeli && !pembayaran?.metode) {
      return {
        ok: false,
        message: 'Pembeli harus menyelesaikan pembayaran sebelum pesanan diproses.',
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, message: 'Pesanan harus memiliki minimal satu item.' }
    }

    const orderId = buatId('order')
    const detailItems = []
    const errors = []

    items.forEach((item) => {
      const menu = menuStore.menuById(item.menuId)

      if (!menu) {
        errors.push('Salah satu menu tidak ditemukan.')
        return
      }

      if (!menu.tersedia) {
        errors.push(`${menu.nama} sedang tidak tersedia.`)
        return
      }

      const jumlah = Number(item.jumlah)
      if (!Number.isInteger(jumlah) || jumlah < 1) {
        errors.push(`Jumlah untuk ${menu.nama} minimal 1.`)
        return
      }

      const toppingIds = Array.isArray(item.toppingIds) ? [...new Set(item.toppingIds)] : []
      const detailTopping = []

      for (const toppingId of toppingIds) {
        const topping = menuStore.toppingById(toppingId)
        if (!topping) {
          errors.push('Salah satu topping tidak ditemukan.')
          continue
        }
        if (!topping.tersedia) {
          errors.push(`Topping ${topping.nama} sedang tidak tersedia.`)
          continue
        }
        detailTopping.push({
          id: buatId('item-topping'),
          toppingId: topping.id,
          namaToppingSnapshot: topping.nama,
          hargaToppingSnapshot: topping.harga,
        })
      }

      if (errors.length) return

      const hargaTopping = detailTopping.reduce(
        (total, topping) => total + topping.hargaToppingSnapshot,
        0,
      )
      const hargaSatuan = menu.harga + hargaTopping
      const itemId = buatId('item')

      detailItems.push({
        id: itemId,
        orderId,
        menuId: menu.id,
        namaMenuSnapshot: menu.nama,
        hargaMenuSnapshot: menu.harga,
        jumlah,
        hargaSatuanSnapshot: hargaSatuan,
        totalItem: hargaSatuan * jumlah,
        toppings: detailTopping.map((topping) => ({
          ...topping,
          orderItemId: itemId,
        })),
      })
    })

    if (errors.length) {
      return { ok: false, message: errors[0], errors }
    }

    if (detailItems.length === 0) {
      return { ok: false, message: 'Tidak ada item valid untuk disimpan.' }
    }

    const subtotal = detailItems.reduce((total, item) => total + item.totalItem, 0)
    const total = subtotal

    const dataPembayaran = buatPembayaran(pembayaran, total)
    if (dataPembayaran.error) {
      return { ok: false, message: dataPembayaran.error }
    }

    if (pembeli && dataPembayaran.statusPembayaran !== 'Lunas') {
      return {
        ok: false,
        message: 'Pembeli harus menyelesaikan pembayaran sebelum pesanan diproses.',
      }
    }

    const order = {
      id: orderId,
      nomorPesanan: buatNomorPesanan(),
      tanggal: new Date().toISOString(),
      kanal,
      sumber: pembeli ? 'online' : 'kasir',
      pembeliId: pembeli?.id || null,
      pembeliNama: pembeli?.nama || null,
      namaPelanggan: namaPelanggan?.trim() || pembeli?.nama || '',
      catatan: catatan?.trim() || '',
      status: 'Diproses',
      items: detailItems,
      subtotal,
      total,
      ...dataPembayaran,
    }

    orders.value.unshift(order)

    return { ok: true, order }
  }

  function ubahStatus(orderId, status) {
    const order = orderById(orderId)
    if (!order) return { ok: false, message: 'Pesanan tidak ditemukan.' }
    if (!STATUS_PESANAN.includes(status)) {
      return { ok: false, message: 'Status pesanan tidak valid.' }
    }

    order.status = status
    return { ok: true, order }
  }

  function catatPembayaran(orderId, pembayaran) {
    const order = orderById(orderId)
    if (!order) return { ok: false, message: 'Pesanan tidak ditemukan.' }
    if (order.statusPembayaran === 'Lunas') {
      return { ok: false, message: 'Pembayaran pesanan ini sudah tercatat.' }
    }

    const dataPembayaran = buatPembayaran(pembayaran, order.total)
    if (dataPembayaran.error) {
      return { ok: false, message: dataPembayaran.error }
    }

    Object.assign(order, dataPembayaran)
    return { ok: true, order }
  }

  return {
    orders,
    daftarPesanan,
    pesananAktif,
    pesananLunas,
    orderById,
    buatPesanan,
    ubahStatus,
    catatPembayaran,
  }
})
