/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["DM Serif Display", "serif"],
      },
      colors: {
        // ============================================
        // Palette Alliya Commerce - Refonte Complète
        // Inspirée du design sombre + turquoise
        // ============================================

        // PRIMARY : Bleu marine profond (fond, éléments principaux)
        "alliya-dark": {
          50: "#E8EEF6",
          100: "#C9D4E4",
          200: "#A9BAD2",
          300: "#8AA1C0",
          400: "#6B88AE",
          500: "#4C6F9C",
          600: "#2B3E8C",
          700: "#1A2A5E",
          800: "#07122E",
          900: "#030815",
        },

        // SECONDARY : Turquoise accent (boutons, liens, icônes)
        "alliya-turquoise": {
          50: "#E8F6F6",
          100: "#CCEEEE",
          200: "#99DDDD",
          300: "#66CCCC",
          400: "#33BBBB",
          500: "#3D9597",
          600: "#2E7A7A",
          700: "#1F5F5F",
          800: "#104444",
          900: "#012929",
        },

        // BACKGROUND : Tons très clairs pour les cartes
        "alliya-light": {
          50: "#FFFFFF",
          100: "#FAFBFC",
          200: "#F5F7F9",
          300: "#F0F3F5",
          400: "#EBEEF1",
          500: "#E6EAED",
          600: "#D9DEE4",
          700: "#CBD2D9",
          800: "#BDBECC",
          900: "#AFAEB6",
        },

        // NEUTRES : Gris pour texte secondaire, bordures
        "alliya-slate": {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },

        // Couleurs fonctionnelles (inchangées)
        success: "#16865B",
        warning: "#D99A27",
        error: "#D64B4B",
        info: "#3478C7",

        // Textes sémantiques
        "text-primary": "#07122E",
        "text-secondary": "#64748B",
        "text-inverse": "#FFFFFF",

        // Mapping composants shadcn/ui (HSL)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};