/** @type {import('tailwindcss').Config} */
export const content = ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}']
export const presets = [require('nativewind/preset')]
export const theme = {
  extend: {
    colors: {
      primary: '#1D9E75',
      danger: '#E24B4A',
    },
  },
}
export const plugins = []
