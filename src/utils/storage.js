const PREFIX = 'lbd_v1_'

export function loadState(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return structuredClone(fallback)
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`Gagal membaca Local Storage "${key}".`, error)
    return structuredClone(fallback)
  }
}

export function saveState(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Gagal menyimpan Local Storage "${key}".`, error)
  }
}

export function removeState(key) {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch (error) {
    console.warn(`Gagal menghapus Local Storage "${key}".`, error)
  }
}

export function clearAppStorage() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch (error) {
    console.warn('Gagal membersihkan Local Storage.', error)
  }
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
