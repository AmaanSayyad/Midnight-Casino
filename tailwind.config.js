/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "red-magic": "#FFFFFF",
        "blue-magic": "#0000FE",
        "dark-kiss": "#0000FE",
        "sharp-black": "#0A0A0A",
        "sharp-purple": "#0000FE",
        "dark-pink": "#0A0A0A",
        "purple-magic": "#0A0A0A",
        "dark-purple": "#0A0A0A",
        "midnight-black": "#0A0A0A",
        "midnight-blue": "#0000FE",
        "midnight-white": "#FFFFFF",
      },
      fontFamily: {
        display: ["var(--font-outfit)", "Outfit-Variable", "sans-serif"],
        sans: ["var(--font-outfit)", "Outfit-Variable", "sans-serif"],
      },
      keyframes: {
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
        cardHover: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-5px) rotate(2deg)' },
        },
        chipSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      animation: {
        blink: 'blink 4s infinite',
        cardHover: 'cardHover 2s ease-in-out infinite',
        chipSpin: 'chipSpin 3s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};
