<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 99 },
})

const emit = defineEmits(['update:modelValue'])

function ubah(delta) {
  const nilaiBaru = Math.min(props.max, Math.max(props.min, props.modelValue + delta))
  if (nilaiBaru !== props.modelValue) emit('update:modelValue', nilaiBaru)
}
</script>

<template>
  <div class="qty-stepper">
    <button
      type="button"
      class="qty-btn"
      :disabled="modelValue <= min"
      aria-label="Kurangi jumlah"
      @click="ubah(-1)"
    >
      <AppIcon name="minus" :size="13" />
    </button>
    <span class="qty-value">{{ modelValue }}</span>
    <button
      type="button"
      class="qty-btn"
      :disabled="modelValue >= max"
      aria-label="Tambah jumlah"
      @click="ubah(1)"
    >
      <AppIcon name="plus" :size="14" />
    </button>
  </div>
</template>

