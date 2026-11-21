<script setup>
import AppIcon from './AppIcon.vue'
import { useToast } from '../composables/useToast'

const { toasts, hapus } = useToast()
</script>

<template>
  <div class="toast-host" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts.items"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
      >
        <span class="toast-icon">
          <AppIcon
            :name="
              toast.type === 'error'
                ? 'alert'
                : toast.type === 'info'
                  ? 'info'
                  : 'checkCircle'
            "
            :size="18"
          />
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" type="button" @click="hapus(toast.id)">
          <AppIcon name="x" :size="15" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
