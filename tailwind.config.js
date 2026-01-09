
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tech-gold': '#ccb066',
                'tech-dark': '#0a0a0a',
                'tech-panel': 'rgba(16, 20, 24, 0.95)',
                'tech-cyan': '#00f0ff',
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', 'monospace'],
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
