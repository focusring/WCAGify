// Shared @nuxt/ui plugin options, used by both vite.config.ts (the real build) and vitest.config.ts component tests need it too, since @nuxt/ui imports its theme from a virtual "#build/ui/*" module.
const uiOptions = {
  colorMode: false,
  ui: {
    button: {
      slots: {
        base: 'cursor-pointer'
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class:
            'bg-primary-800 hover:bg-primary-900 active:bg-primary-950 dark:bg-primary-500 dark:hover:bg-primary-400 dark:active:bg-primary-300 text-white dark:text-black'
        },
        {
          color: 'primary',
          variant: 'outline',
          class: 'ring-primary-800 text-primary-800 dark:text-primary-500 dark:ring-primary-500'
        },
        {
          color: 'neutral',
          variant: 'outline',
          class: 'ring-shade-500'
        },
        {
          color: 'primary',
          variant: 'link',
          class: 'p-0 hover:underline text-primary-800 dark:text-primary-400'
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class: 'text-shade-800 dark:text-shade-300 ring-shade-500'
        },
        {
          color: 'primary',
          variant: 'subtle',
          class: 'text-primary-700 dark:text-primary-400 ring-primary-600 dark:ring-primary-500'
        }
      ]
    },
    badge: {
      compoundVariants: [
        {
          color: 'primary',
          variant: 'subtle',
          class:
            'text-black bg-primary-500/70 ring-black dark:text-white dark:bg-primary-400/10 dark:ring-primary-600'
        },
        {
          color: 'success',
          variant: 'subtle',
          class:
            'text-black bg-success-400/70 ring-black dark:text-success-400 dark:bg-success-400/10 dark:ring-success-600'
        },
        {
          color: 'info',
          variant: 'subtle',
          class:
            'text-black bg-info-400/70 ring-black dark:text-info-400 dark:bg-info-400/10 dark:ring-info-600'
        },
        {
          color: 'warning',
          variant: 'subtle',
          class:
            'text-black bg-warning-400/70 ring-black dark:text-warning-400 dark:bg-warning-400/10 dark:ring-warning-600'
        },
        {
          color: 'error',
          variant: 'subtle',
          class:
            'text-black bg-error-500/70 ring-black dark:text-error-200 dark:bg-error-300/10 dark:ring-error-600'
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class: 'ring-shade-500'
        }
      ]
    },
    alert: {
      slots: {
        root: 'px-3 py-2 items-center'
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'subtle',
          class: {
            root: 'text-primary-900 ring-primary-600 dark:text-primary-200 dark:ring-primary-400'
          }
        },
        {
          color: 'success',
          variant: 'subtle',
          class: {
            root: 'text-success-900 ring-success-600 dark:text-success-300 dark:ring-success-400'
          }
        },
        {
          color: 'info',
          variant: 'subtle',
          class: { root: 'text-info-700 ring-info-500 dark:text-info-300 dark:ring-info-400' }
        },
        {
          color: 'warning',
          variant: 'subtle',
          class: {
            root: 'text-warning-950 ring-warning-900 bg-warning-400/20 dark:text-warning-400 dark:ring-warning-500 dark:bg-warning-500/10'
          }
        },
        {
          color: 'error',
          variant: 'subtle',
          class: {
            root: 'text-error-800 ring-error-700 bg-error-300/15 dark:text-error-300 dark:ring-error-400 dark:bg-error-700/15'
          }
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class: {
            root: 'ring-neutral-700 bg-neutral-400/10 dark:ring-neutral-300 dark:bg-neutral-500/10'
          }
        }
      ]
    },
    input: {
      compoundVariants: [
        {
          variant: ['outline', 'subtle'],
          class: {
            root: 'w-full',
            base: '[&::placeholder]:text-toned pe-8 hover:bg-accented/75 transition-colors duration-200 text-sm ring-shade-500'
          }
        },
        {
          color: 'success',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-success-600 dark:ring-success-400' }
        },
        {
          color: 'info',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-info-500 dark:ring-info-400' }
        },
        {
          color: 'warning',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-warning-900 dark:ring-warning-500' }
        },
        {
          color: 'error',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-error-700 dark:ring-error-400' }
        }
      ]
    },
    selectMenu: {
      slots: {
        content: 'ring-shade-500'
      },
      compoundVariants: [
        {
          variant: ['outline', 'subtle'],
          class: { base: 'text-sm ring-shade-500 cursor-pointer w-full' }
        },
        {
          color: 'success',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-success-600 dark:ring-success-400' }
        },
        {
          color: 'info',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-info-500 dark:ring-info-400' }
        },
        {
          color: 'warning',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-warning-900 dark:ring-warning-500' }
        },
        {
          color: 'error',
          variant: ['outline', 'subtle'],
          class: { base: 'ring-error-700 dark:ring-error-400' }
        }
      ]
    }
  }
}

export default uiOptions
