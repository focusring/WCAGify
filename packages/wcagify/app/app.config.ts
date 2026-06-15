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
          color: 'success',
          variant: 'solid',
          class: 'text-black bg-success-400 ring-1 ring-black dark:ring-success-400'
        },
        {
          color: 'info',
          variant: 'solid',
          class: 'text-black bg-info-400 ring-1 ring-black dark:ring-info-400'
        },
        {
          color: 'warning',
          variant: 'solid',
          class: 'text-black bg-warning-400 ring-1 ring-black dark:ring-warning-400'
        },
        {
          color: 'error',
          variant: 'solid',
          class: 'text-black bg-error-400 ring-1 ring-black dark:ring-error-400'
        },
        {
          color: 'primary',
          variant: 'subtle',
          class:
            'text-black bg-primary-300 dark:bg-primary-400 ring-1 ring-black dark:ring-primary-400'
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
