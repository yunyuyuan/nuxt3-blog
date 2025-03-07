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
        header: "500",
        headerLoading: "501",
        footer: "30",
        notify: "1000",
        modal: "999",
        dropdown: "999"
      }
    }
  },
  plugins: []
};
