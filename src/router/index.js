import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '../stores'
import { useAuthStore } from '../stores/auth'

const STAF = ['pemilik', 'kasir']
const PEMBELI = ['pembeli']

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true, judul: 'Masuk' },
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: {
          judul: 'Dashboard',
          subjudul: 'Ringkasan operasional outlet hari ini',
          roles: STAF,
        },
      },
      {
        path: 'pesanan/baru',
        name: 'pesanan-baru',
        component: () => import('../views/NewOrderView.vue'),
        meta: {
          judul: 'Pesanan Baru',
          subjudul: 'Catat pesanan langsung maupun dari aplikasi pesan-antar',
          roles: STAF,
        },
      },
      {
        path: 'pesanan',
        name: 'pesanan',
        component: () => import('../views/OrdersView.vue'),
        meta: {
          judul: 'Daftar Pesanan',
          subjudul: 'Pantau status, pembayaran, dan detail transaksi',
          roles: STAF,
        },
      },
      {
        path: 'home',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: {
          judul: 'Home',
          subjudul: 'Informasi toko, lokasi, dan kanal pemesanan',
          roles: PEMBELI,
        },
      },
      {
        path: 'pesan',
        name: 'pesan',
        component: () => import('../views/NewOrderView.vue'),
        meta: {
          judul: 'Pesan Menu',
          subjudul: 'Bayar sekarang, lalu ambil pesanan di outlet',
          roles: PEMBELI,
        },
      },
      {
        path: 'pesanan-saya',
        name: 'pesanan-saya',
        component: () => import('../views/MyOrdersView.vue'),
        meta: {
          judul: 'Pesanan Saya',
          subjudul: 'Pantau pembayaran, proses, dan kesiapan pesanan',
          roles: PEMBELI,
        },
      },
      {
        path: 'menu',
        name: 'menu',
        component: () => import('../views/MenuView.vue'),
        meta: {
          judul: 'Menu & Topping',
          subjudul: 'Kelola katalog yang tampil pada halaman pemesanan',
          roles: ['pemilik'],
        },
      },
      {
        path: 'laporan',
        name: 'laporan',
        component: () => import('../views/ReportsView.vue'),
        meta: {
          judul: 'Laporan Penjualan',
          subjudul: 'Rekap transaksi harian dan bulanan',
          roles: ['pemilik'],
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { judul: 'Halaman tidak ditemukan' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore(pinia)

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: auth.homeRoute }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: auth.homeRoute }
  }

  return true
})

router.afterEach((to) => {
  const judul =
    to.meta.judul && to.meta.judul !== 'Masuk'
      ? `${to.meta.judul} — Lumpia Beef Obami Delima`
      : 'Lumpia Beef Obami Delima — Pesanan & Kasir'
  document.title = judul
})

export default router
