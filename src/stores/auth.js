import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { seedUsers } from '../data/seed'
import { loadState, saveState } from '../utils/storage'

const SESSION_KEY = 'session'
const ROLE_VALID = ['pemilik', 'kasir', 'pembeli']

export const useAuthStore = defineStore('auth', () => {
  const users = ref(seedUsers)
  const sesiTersimpan = loadState(SESSION_KEY, null)
  const sesiValid =
    sesiTersimpan && ROLE_VALID.includes(sesiTersimpan.role)
      ? seedUsers.find((user) => user.id === sesiTersimpan.id) || sesiTersimpan
      : null
  const session = ref(
    sesiValid
      ? {
          id: sesiValid.id,
          nama: sesiValid.nama,
          username: sesiValid.username,
          role: sesiValid.role,
        }
      : null,
  )

  if (sesiTersimpan && !session.value) saveState(SESSION_KEY, null)

  const isAuthenticated = computed(() => Boolean(session.value))
  const currentUser = computed(() => session.value)
  const role = computed(() => session.value?.role || null)
  const isPemilik = computed(() => role.value === 'pemilik')
  const isKasir = computed(() => role.value === 'kasir')
  const isPembeli = computed(() => role.value === 'pembeli')
  const homeRoute = computed(() => (isPembeli.value ? 'home' : 'dashboard'))
  const labelRole = computed(
    () =>
      ({
        pemilik: 'Pemilik',
        kasir: 'Kasir',
        pembeli: 'Pembeli',
      })[role.value] || '-',
  )

  function login(username, password) {
    const user = users.value.find(
      (item) =>
        item.username.toLowerCase() === String(username || '').trim().toLowerCase() &&
        item.passwordDemo === String(password || ''),
    )

    if (!user) {
      return {
        ok: false,
        message: 'Username atau password tidak sesuai. Gunakan akun demo yang tersedia.',
      }
    }

    session.value = {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
    }
    saveState(SESSION_KEY, session.value)
    return { ok: true, user: session.value }
  }

  function logout() {
    session.value = null
    saveState(SESSION_KEY, null)
  }

  return {
    users,
    session,
    isAuthenticated,
    currentUser,
    role,
    isPemilik,
    isKasir,
    isPembeli,
    homeRoute,
    labelRole,
    login,
    logout,
  }
})
