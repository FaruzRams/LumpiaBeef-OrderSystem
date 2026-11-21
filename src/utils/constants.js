export const STATUS_PESANAN = ['Diproses', 'Siap Diambil', 'Selesai']

export const KANAL_PESANAN = ['Langsung', 'GoFood', 'GrabFood', 'Pickup']

export const METODE_PEMBAYARAN = ['Tunai', 'QRIS']

export const LABEL_STATUS = {
  Diproses: 'Diproses',
  'Siap Diambil': 'Siap Diambil',
  Selesai: 'Selesai',
}

export const KETERANGAN_KANAL = {
  Langsung: 'Pelanggan datang langsung ke outlet',
  GoFood: 'Input manual dari pesanan GoFood',
  GrabFood: 'Input manual dari pesanan GrabFood',
  Pickup: 'Pesanan online pelanggan, diambil sendiri di outlet',
}

export function statusBerikutnya(status) {
  const index = STATUS_PESANAN.indexOf(status)
  if (index === -1 || index === STATUS_PESANAN.length - 1) return null
  return STATUS_PESANAN[index + 1]
}
