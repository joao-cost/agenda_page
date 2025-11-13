/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#279AF1",
          50: "#f1f8ff",
          100: "#d9ecff",
          200: "#b3daff",
          300: "#8cc8ff",
          400: "#55aff7",
          500: "#279AF1",
          600: "#187ccc",
          700: "#125ea0",
          800: "#0c4073",
          900: "#082b4d"
        },
        "primary-foreground": "#F7F7FF",
        secondary: {
          DEFAULT: "#0C0A33",
          50: "#f0f0ff",
          100: "#d9d7ff",
          200: "#b0adff",
          300: "#807bff",
          400: "#5750f7",
          500: "#2f2abd",
          600: "#22218f",
          700: "#181963",
          800: "#100f3f",
          900: "#06071c"
        },
        accent: {
          DEFAULT: "#0B5563",
          100: "#d3edf1",
          200: "#a7dbe4",
          300: "#7ac8d6",
          400: "#4eb6c8",
          500: "#229fb3",
          600: "#0B5563",
          700: "#084047",
          800: "#052c30",
          900: "#021719"
        },
        surface: {
          DEFAULT: "#F7F7FF"
        },
        brand: "#214E34"
      }
    }
  },
  plugins: []
};


