/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2340",
        parchment: "#F7F4EC",
        parchment2: "#EFEAE0",
        gold: "#B8862E",
        goldlight: "#E4C77A",
        sage: "#3F5B44",
        sagelight: "#E7EFE8",
        rust: "#9A3E2E",
        rustlight: "#F5E6E2",
        amber: "#8A6216",
        amberlight: "#FBF0DB",
        slate2: "#5B6270",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
