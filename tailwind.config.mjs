import colors from "tailwindcss/colors";
import config from "./config";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/utils/**/*.{tsx,vue}",
    "./app/pages/**/*.vue",
    "./app/components/**/*.vue",
    "./app/layouts/**/*.vue",
    "./app/app.vue"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          950: "var(--color-primary-950)"
        },
        dark: colors[config.themeColorDark]
      },
      backgroundColor: {
        nb: {
          light: "#f9fafb",
          dark: "#151515"
        }
      },
      spacing: {
        header: "60px"
      },
      zIndex: {
        modeBg: "10",
        body: "20",
        footer: "30",
        header: "500",
        headerLoading: "501",
        modal: "999",
        dropdown: "999",
        mermaidFullscreen: "999"
      },
      animation: {
        shake: "shake 0.82s cubic-bezier(.36,.07,.19,.97) infinite"
      },
      boxShadow: {
        card: "0 12px 30px -27px rgba(15,23,42,0.45)"
      },
      keyframes: {
        shake: {
          "10%, 90%": {
            transform: "rotate(3deg)"
          },
          "20%, 80%": {
            transform: "rotate(0deg)"
          },
          "30%, 50%, 70%": {
            transform: "rotate(3deg)"
          },
          "40%, 60%": {
            transform: "rotate(0deg)"
          }
        }
      }
    }
  },
  plugins: []
};
