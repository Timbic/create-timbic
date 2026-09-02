// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/eslint", "@nuxt/icon", "@nuxt/fonts", "reka-ui/nuxt", "@nuxt/image", "@nuxtjs/seo", "@nuxt/content"],

	app: { rootAttrs: { class: "isolate" }, head: { htmlAttrs: { class: "dark" } } },
	css: ["~/assets/css/main.css"],
	components: [{ path: "~/components", pathPrefix: false }],
	fonts: { defaults: { weights: ["400 700"], styles: ["normal"], subsets: ["latin-ext", "latin"] } },

	typescript: { typeCheck: true },
	image: {},
	ogImage: false,
	sitemap: { zeroRuntime: true },

	icon: {
		provider: "none",
		serverBundle: false,
		clientBundle: { scan: true, includeCustomCollections: true, sizeLimitKb: 4096 },
		customCollections: [{ prefix: "<name>", dir: "./app/assets/icons" }],
	},

	content: {
		database: { type: "sqlite", filename: "content" },
		build: {
			markdown: {
				toc: { depth: 3, searchDepth: 3 },
				highlight: false,
			},
		},
		renderer: { anchorLinks: true },
	},

	robots: {
		blockAiBots: true,
		blockNonSeoBots: true,
		autoI18n: false,
	},

	site: {
		url: "https://<site url>",
		name: "<name>",
		defaultLocale: "<locale>",
		title: "<title>",
		description: "<description>",
	},
});
