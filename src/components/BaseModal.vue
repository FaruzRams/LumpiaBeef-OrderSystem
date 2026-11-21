<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' },
  closeable: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

function tutup() {
  if (props.closeable) emit('close')
}

function tanganiTombol(event) {
  if (event.key === 'Escape' && props.open) tutup()
}

function aturScroll(terbuka) {
  document.body.style.overflow = terbuka ? 'hidden' : ''
}

watch(
  () => props.open,
  (terbuka) => aturScroll(terbuka),
)

onMounted(() => {
  document.addEventListener('keydown', tanganiTombol)
  if (props.open) aturScroll(true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', tanganiTombol)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-backdrop"
        @mousedown.self="tutup"
      >
        <div
          class="modal-card"
          :class="`modal-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="modal-head">
            <div class="modal-heading">
              <h2 class="modal-title">{{ title }}</h2>
              <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button
              v-if="closeable"
              type="button"
              class="icon-btn"
              aria-label="Tutup"
              @click="tutup"
            >
              <AppIcon name="x" :size="18" />
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
