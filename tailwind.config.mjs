import colors from "tailwindcss/colors";
import config from "./config";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./utils/**/*.{tsx,vue}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: colors[config.themeColor],
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
        mermaidFullscreen: "999",
        notify: "1000"
      },
      animation: {
        shake: "shake 0.82s cubic-bezier(.36,.07,.19,.97) infinite"
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
