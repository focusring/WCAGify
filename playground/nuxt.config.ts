import { defineWcagifyConfig } from 'wcagify'

export default defineNuxtConfig(
  defineWcagifyConfig({
    devtools: { enabled: true },

    css: ['~/assets/css/main.css'],

    nitro: {
      vercel: {
        functions: {
          maxDuration: 60
        }
      }
    }
  })
)
