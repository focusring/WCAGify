export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
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
          color: 'primary',
          variant: 'link',
          class: 'p-0 hover:underline text-primary-800 dark:text-primary-400'
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class: 'text-neutral-800 dark:text-neutral-300 ring-neutral-500'
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
          class: 'ring-neutral-500'
        }
      ]
    }
  }
})
