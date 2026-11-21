<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
  jenis: { type: String, default: 'pesanan' },
})

const slug = computed(() =>
  props.status.toLowerCase().replaceAll(' ', '-'),
)

const kelas = computed(() =>
  props.jenis === 'pembayaran'
    ? `badge-pembayaran-${slug.value}`
    : `badge-status-${slug.value}`,
)
</script>

<template>
  <span class="badge" :class="kelas">
    <span class="badge-dot" />
    {{ status }}
  </span>
</template>
