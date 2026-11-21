import { createApp } from 'vue'
import { pinia } from './stores'
import router from './router'
import App from './App.vue'
import './assets/main.css'

createApp(App).use(pinia).use(router).mount('#app')
