const formatterAngka = new Intl.NumberFormat('id-ID')

export function formatRupiah(value) {
  const angka = Number(value) || 0
  return `Rp${formatterAngka.format(angka)}`
}

export function formatAngka(value) {
  return formatterAngka.format(Number(value) || 0)
}

export function formatTanggal(value, { denganWaktu = false } = {}) {
  const tanggal = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(tanggal.getTime())) return '-'

  const opsi = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  if (denganWaktu) {
    opsi.hour = '2-digit'
    opsi.minute = '2-digit'
  }

  return new Intl.DateTimeFormat('id-ID', opsi).format(tanggal)
}

export function formatTanggalPendek(value) {
  const tanggal = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(tanggal.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(tanggal)
}

export function formatJam(value) {
  const tanggal = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(tanggal.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(tanggal)
}

/** Kunci tanggal lokal, format YYYY-MM-DD (aman untuk input type="date"). */
export function localDateKey(value = new Date()) {
  const tanggal = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(tanggal.getTime())) return ''
  const tahun = tanggal.getFullYear()
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0')
  const hari = String(tanggal.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${hari}`
}

/** Kunci bulan lokal, format YYYY-MM (aman untuk input type="month"). */
export function localMonthKey(value = new Date()) {
  const tanggal = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(tanggal.getTime())) return ''
  return localDateKey(tanggal).slice(0, 7)
}

export function labelTanggalDariKey(key) {
  if (!key) return '-'
  const [tahun, bulan, hari] = key.split('-').map(Number)
  if (!tahun || !bulan || !hari) return key
  return formatTanggal(new Date(tahun, bulan - 1, hari))
}

export function labelBulanDariKey(key) {
  if (!key) return '-'
  const [tahun, bulan] = key.split('-').map(Number)
  if (!tahun || !bulan) return key
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(tahun, bulan - 1, 1))
}

export function todayInputValue() {
  return localDateKey(new Date())
}

export function monthInputValue() {
  return localMonthKey(new Date())
}

export function inisial(nama = '') {
  return (
    nama
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((bagian) => bagian.charAt(0).toUpperCase())
      .join('') || '?'
  )
}
