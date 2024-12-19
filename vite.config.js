import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
	plugins: [svelte()],
	root: "src/",
	envDir: "../env",
	publicDir: "../public",
	base: "/",
	build: {
		outDir: "../dist",
		emptyOutDir: true
	},
	server: {
		host: 'localhost',
		port: 56001
	},
	preview: {
		host: 'localhost',
		port: 56001
	}
})
