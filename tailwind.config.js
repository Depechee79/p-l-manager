/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        'surface-muted': "var(--surface-muted)",
        'text-main': "var(--text-main)",
        'text-secondary': "var(--text-secondary)",
        'text-light': "var(--text-light)",
        border: "var(--border)",
        'border-focus': "var(--border-focus)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        '2xl': "var(--spacing-2xl)",
        'topbar-h': "var(--app-topbar-h)",
        'topbar-px': "var(--app-topbar-px)",
        'sidebar-w': "var(--app-sidebar-w)",
        'sidebar-w-collapsed': "var(--app-sidebar-w-collapsed)",
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        md: "var(--font-size-md)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        '2xl': "var(--font-size-2xl)",
        '3xl': "var(--font-size-3xl)",
      },
      zIndex: {
        topbar: "var(--app-topbar-z)",
        sidebar: "var(--app-sidebar-z)",
      }
    },
  },
  plugins: [],
}
