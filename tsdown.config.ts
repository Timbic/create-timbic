import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	target: "node22",
	minify: true,
	fixedExtension: false,
	deps: {
		onlyBundle: false,
	},
});
