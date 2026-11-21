/**
 * Data awal aplikasi.
 * Sumber: PRD Lumpia Beef Obami Delima v1.0 — bagian 6 (Data Menu Awal).
 * Semua data ini hanya dipakai saat Local Storage belum memiliki data katalog.
 */

export const OUTLET = {
  namaOutlet: 'Lumpia Beef Obami Delima',
  namaPendek: 'Obami Delima',
  tagline: 'Lumpia beef hangat, siap dibawa pulang.',
}

export const seedUsers = [
  {
    id: 'user-pemilik',
    nama: 'Pemilik',
    username: 'pemilik',
    passwordDemo: 'pemilik',
    role: 'pemilik',
  },
  {
    id: 'user-kasir',
    nama: 'Kasir',
    username: 'kasir',
    passwordDemo: 'kasir',
    role: 'kasir',
  },
  {
    id: 'user-pembeli',
    nama: 'Pembeli',
    username: 'pembeli',
    passwordDemo: 'pembeli',
    role: 'pembeli',
  },
]

export const seedMenus = [
  {
    id: 'menu-telur-original',
    nama: 'Lumpia Telur Original',
    komposisi: 'Lumpia, telur, makaroni, jagung, selada, kol',
    harga: 11000,
    tersedia: true,
    gambar: '/images/telur-original.jpeg',
  },
  {
    id: 'menu-beef-original',
    nama: 'Lumpia Beef Original',
    komposisi: 'Lumpia, beef, makaroni, jagung, selada, kol',
    harga: 11000,
    tersedia: true,
    gambar: '/images/beef-original.jpeg',
  },
  {
    id: 'menu-beef-patty',
    nama: 'Lumpia Beef Patty',
    komposisi: 'Lumpia, beef patty, makaroni, jagung, selada, kol',
    harga: 15000,
    tersedia: true,
    gambar: '/images/beef-patty.jpeg',
  },
  {
    id: 'menu-beef-patty-spesial',
    nama: 'Lumpia Beef Patty Spesial',
    komposisi: 'Lumpia, beef patty, keju, telur, makaroni, jagung, selada, kol',
    harga: 19000,
    tersedia: true,
    gambar: '/images/beef-patty-spesial.jpeg',
  },
  {
    id: 'menu-beef-patty-brutal',
    nama: 'Lumpia Beef Patty Brutal',
    komposisi:
      'Lumpia, beef patty, keju, telur, sosis, nugget, makaroni, jagung, selada, kol',
    harga: 21000,
    tersedia: true,
    gambar: '/images/beef-patty-brutal.jpeg',
  },
  {
    id: 'menu-beef-patty-maksimal',
    nama: 'Lumpia Beef Patty Maksimal',
    komposisi: 'Lumpia, double beef patty, keju, makaroni, jagung, selada, kol',
    harga: 22000,
    tersedia: true,
    gambar: '/images/beef-patty-maksimal.jpeg',
  },
]

export const seedToppings = [
  { id: 'topping-telur', nama: 'Telur', harga: 3000, tersedia: true },
  { id: 'topping-keju', nama: 'Keju', harga: 2000, tersedia: true },
  { id: 'topping-nugget', nama: 'Nugget', harga: 2000, tersedia: true },
  { id: 'topping-sosis', nama: 'Sosis', harga: 2000, tersedia: true },
]

export const seedSetting = {
  namaOutlet: OUTLET.namaOutlet,
  versi: '1.0.0',
  pajakPersen: 0,
}
