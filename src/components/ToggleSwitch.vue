<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: 'Status' },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    class="switch"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :class="{ 'is-on': modelValue }"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="switch-knob" />
  </button>
</template>
