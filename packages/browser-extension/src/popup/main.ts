import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { useI18n } from '../composables/useI18n'
import './style.css'

const app = createApp(App)
app.use(ui)

const { ready } = useI18n()

ready.then(() => app.mount('#app'))
