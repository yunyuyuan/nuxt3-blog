import { fileURLToPath } from "url";
import colors from "tailwindcss/colors";

// 绝对路径：tailwind 按进程的工作目录解析相对路径，而构建是在站点目录中执行的
const r = p => fileURLToPath(new URL(p, import.meta.url));

/**
 * layer 的 tailwind 配置，由 @nuxtjs/tailwindcss 自动加载并与站点的配置合并。
 * 夜间模式色板 dark 的默认值是 neutral（模板 config.ts 的 themeColorDark），
 * 构建时 modules/blog.ts 通过 tailwindcss:config 钩子换成站点配置中的颜色。
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    r("./app/utils/**/*.{tsx,vue}"),
    r("./app/pages/**/*.vue"),
    r("./app/components/**/*.vue"),
    r("./app/layouts/**/*.vue"),
    r("./app/app.vue")
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
        dark: colors.neutral
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
        "shake": "shake 0.82s cubic-bezier(.36,.07,.19,.97) infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out backwards"
      },
      boxShadow: {
        card: "0 12px 30px -27px rgba(15,23,42,0.45)"
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(16px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "shake": {
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
