/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        espresso: "#2c211f",
        "espresso-deep": "#241b19",
        mocha: "#382b27",
        "mocha-soft": "#4a3933",
        cream: "#f0eadc",
        "cream-muted": "#d8d0c0",
        lime: "#c8ff00",
        "lime-hover": "#d4ff33",
        "lime-muted": "rgba(200, 255, 0, 0.15)",
        danger: "#ff6b5f"
      },
      fontFamily: {
        display: [
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        sans: [
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ]
      },
      boxShadow: {
        tactile:
          "inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -1px 1px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3)",
        "tactile-lime":
          "inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.2), 0 8px 24px rgba(200,255,0,0.25)",
        "tactile-btn":
          "inset 0 2px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.4)",
        "tactile-btn-pressed":
          "inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.1)"
      }
    }
  },
  plugins: []
};
