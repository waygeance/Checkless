/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        roasted: "#130f0c",
        espresso: "#211611",
        "espresso-deep": "#18100d",
        mocha: "#38251b",
        "mocha-soft": "#4a3024",
        walnut: "#3a251b",
        "coffee-leather": "#563727",
        parchment: "#e7d5b5",
        cream: "#f2e7cf",
        "cream-muted": "#d3c5ad",
        brass: "#b58a4a",
        "brass-light": "#d3ad68",
        wine: "#8c4038",
        "wine-light": "#d36c60",
        lime: "#c2d82e",
        "lime-hover": "#d2e64a",
        "lime-muted": "rgba(200, 255, 0, 0.15)",
        danger: "#ff6b5f"
      },
      fontFamily: {
        display: [
          "Fraunces Variable",
          "Georgia",
          "serif"
        ],
        sans: [
          "IBM Plex Sans Variable",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "IBM Plex Mono",
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
