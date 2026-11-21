import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { seedMenus, seedToppings } from '../data/seed'
import { clone, loadState, saveState } from '../utils/storage'

const CATALOG_KEY = 'catalog'

function buatId(prefix) {
  const acak =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${acak}`
}

export const useMenuStore = defineStore('menu', () => {
  const tersimpan = loadState(CATALOG_KEY, null)
  const gambarSeed = new Map(seedMenus.map((menu) => [menu.id, menu.gambar]))

  const menus = ref(
    tersimpan?.menus?.length
      ? tersimpan.menus.map((menu) => ({
          ...menu,
          gambar:
            !menu.gambar ||
            menu.gambar.startsWith('https://images.unsplash.com/')
              ? gambarSeed.get(menu.id) || menu.gambar || ''
              : menu.gambar,
        }))
      : clone(seedMenus),
  )
  const toppings = ref(
    tersimpan?.toppings?.length ? tersimpan.toppings : clone(seedToppings),
  )

  watch(
    [menus, toppings],
    () => {
      saveState(CATALOG_KEY, {
        menus: menus.value,
        toppings: toppings.value,
      })
    },
    { deep: true },
  )

  const menuTersedia = computed(() => menus.value.filter((menu) => menu.tersedia))
  const toppingTersedia = computed(() =>
    toppings.value.filter((topping) => topping.tersedia),
  )

  const jumlahMenu = computed(() => menus.value.length)
  const jumlahMenuTersedia = computed(() => menuTersedia.value.length)
  const jumlahTopping = computed(() => toppings.value.length)

  function menuById(id) {
    return menus.value.find((menu) => menu.id === id) || null
  }

  function toppingById(id) {
    return toppings.value.find((topping) => topping.id === id) || null
  }

  function tambahMenu(payload) {
    menus.value.push({
      id: buatId('menu'),
      nama: payload.nama.trim(),
      komposisi: payload.komposisi?.trim() || '',
      harga: Number(payload.harga),
      tersedia: payload.tersedia ?? true,
      gambar: payload.gambar?.trim() || '',
    })
  }

  function perbaruiMenu(id, payload) {
    const menu = menuById(id)
    if (!menu) return false
    menu.nama = payload.nama.trim()
    menu.komposisi = payload.komposisi?.trim() || ''
    menu.harga = Number(payload.harga)
    menu.tersedia = payload.tersedia ?? menu.tersedia
    menu.gambar = payload.gambar?.trim() || ''
    return true
  }

  function toggleKetersediaanMenu(id) {
    const menu = menuById(id)
    if (!menu) return
    menu.tersedia = !menu.tersedia
  }

  function tambahTopping(payload) {
    toppings.value.push({
      id: buatId('topping'),
      nama: payload.nama.trim(),
      harga: Number(payload.harga),
      tersedia: payload.tersedia ?? true,
    })
  }

  function perbaruiTopping(id, payload) {
    const topping = toppingById(id)
    if (!topping) return false
    topping.nama = payload.nama.trim()
    topping.harga = Number(payload.harga)
    topping.tersedia = payload.tersedia ?? topping.tersedia
    return true
  }

  function toggleKetersediaanTopping(id) {
    const topping = toppingById(id)
    if (!topping) return
    topping.tersedia = !topping.tersedia
  }

  return {
    menus,
    toppings,
    menuTersedia,
    toppingTersedia,
    jumlahMenu,
    jumlahMenuTersedia,
    jumlahTopping,
    menuById,
    toppingById,
    tambahMenu,
    perbaruiMenu,
    toggleKetersediaanMenu,
    tambahTopping,
    perbaruiTopping,
    toggleKetersediaanTopping,
  }
})
