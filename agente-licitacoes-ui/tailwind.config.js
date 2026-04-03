/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E3A8A',    // Azul Marinho Institucional
          green: '#10B981',   // Verde Sucesso/Match
          amber: '#F59E0B',   // Amarelo Alerta
          dark: '#334155',    // Grafite Tipografia
          light: '#F8FAFC',   // Cinza Slate Fundo
        }
      }
    },
  },
  plugins: [],
}