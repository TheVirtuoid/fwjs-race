import { resolve } from "path";
import path from 'path';
import { fileURLToPath } from 'url';

// import ts from 'rollup-plugin-ts';
// import { cjsToEsm } from "cjstoesm";

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
/*
		plugins: [
				ts({
					transformers: [cjsToEsm()]
				})
		],
*/
		build: {
			assetsInlineLimit: 5000,
			outDir: "./../../dist",
			emptyOutDir: true,
			rollupOptions: {
				input: {
					main: resolve(dirname, 'src', 'index.html')
				}
			}
		}
	}
}