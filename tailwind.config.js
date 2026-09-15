/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        api: {
          good: '#3b82f6',         // 0-50 Blue
          moderate: '#10b981',     // 51-100 Green
          unhealthy: '#f59e0b',    // 101-200 Yellow/Amber
          veryUnhealthy: '#ef4444',// 201-300 Red
          hazardous: '#881337',    // 301+ Maroon/Dark Red
          emergency: '#4c0519'     // 500+ Deep Maroon
        }
      }
    },
  },
  plugins: [],
}
