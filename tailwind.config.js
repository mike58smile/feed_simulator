/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      colors: {
        brand: {
          base: "#12111F",
          accent: "#5A7BFF",
          soft: "#E6E9FF"
        },
        bubble: {
          warm: "#F9D7A5",
          cool: "#C6E9FF",
          neutral: "#F1F5F9"
        }
      },
      boxShadow: {
        card: "0 20px 40px -24px rgba(16, 24, 40, 0.45)"
      },
      keyframes: {
        pulsePop: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.9" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      },
      animation: {
        pulsePop: "pulsePop 320ms ease-out"
      }
    }
  },
  plugins: []
};
