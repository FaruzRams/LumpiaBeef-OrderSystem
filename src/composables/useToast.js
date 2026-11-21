import { reactive } from 'vue'

const state = reactive({
  items: [],
})

let urutan = 0

function hapus(id) {
  const index = state.items.findIndex((item) => item.id === id)
  if (index !== -1) state.items.splice(index, 1)
}

function tampilkan(message, type = 'success', durasi = 3400) {
  const id = ++urutan
  state.items.push({ id, message, type })
  window.setTimeout(() => hapus(id), durasi)
  return id
}

export function useToast() {
  return {
    toasts: state,
    hapus,
    sukses: (message, durasi) => tampilkan(message, 'success', durasi),
    error: (message, durasi) => tampilkan(message, 'error', durasi),
    info: (message, durasi) => tampilkan(message, 'info', durasi),
  }
}
