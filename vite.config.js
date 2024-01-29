import { resolve } from "path";
import path from 'path';
import { fileURLToPath } from 'url';

export default ({ command, mode }) => {
	const filename = fileURLToPath(import.meta.url);
	const dirname = path.dirname(filename);
	return {
		root: "src",
		base: "/",
		publicDir: "public/",
		server: {
			port: 3000
		},
		build: {
			assetsInlineLimit: 5000,
			outDir: "./../dist",
			emptyOutDir: true,
			target: 'esnext',
			rollupOptions: {
				input: {
					main: resolve(dirname, 'src', 'index.html'),
					trackpoc: resolve(dirname, 'src', 'track-poc.html')
				}
			}
		}
	}
}