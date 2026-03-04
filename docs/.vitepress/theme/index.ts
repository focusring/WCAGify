import DefaultTheme from 'vitepress/theme'
import CustomHome from './CustomHome.vue'
import './custom.css' // eslint-disable-line import/no-unassigned-import

const theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CustomHome', CustomHome)
  }
}

export default theme
