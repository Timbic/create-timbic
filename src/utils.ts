import util from "node:util";

// Color for text formatting
type ColorName = Exclude<Parameters<typeof util.styleText>[0], readonly unknown[]>;

function createColors() {
	return new Proxy({} as Record<ColorName, (text: string) => string>, {
		get(_, prop) {
			return (text: string) => util.styleText(prop as ColorName, text);
		},
	});
}

const COLORS = createColors();

// Available templates
type Template = { name: string; display: string; color: (str: string) => string; variants?: Variant[] };
type Variant = { name: string; display: string; color: (str: string) => string };

const TEMPLATES: Template[] = [
	{
		name: "lib",
		display: "Library",
		color: COLORS.yellow,
	},
	{
		name: "nuxt",
		display: "Nuxt app",
		color: COLORS.green,
		variants: [
			{
				name: "nuxt",
				display: "Without Stylelint",
				color: COLORS.green,
			},
			{
				name: "nuxt-stylelint",
				display: "With Stylelint",
				color: COLORS.magenta,
			},
			{
				name: "nuxt-tailwind",
				display: "Maybe let's pick Tailwind!?",
				color: COLORS.cyan,
			},
		],
	},
];

// Message for help argument
function getTemplateList(): string {
	return TEMPLATES.map((t) => {
		const variants = t.variants ? ` (${t.variants.map((v) => v.color(v.name)).join(", ")})` : "";
		return `  ${t.color(t.name.padEnd(10))}${variants}`;
	}).join("\n");
}

const HELP_MESSAGE = `\
Usage: create-timbic [OPTION]... [DIRECTORY]

Create a new project with Typescript. Inspired by create-vite scaffolder.
When running in a TTY, the CLI will start in interactive mode.

Options:
  -t, --template NAME                   use a specific template
  -i, --immediate / --no-immediate      install dependencies
  --overwrite                           remove existing files if target directory is not empty
  --interactive / --no-interactive      force interactive / non-interactive mode
  -h, --help                            display this help message

Available templates:
${getTemplateList()}
`;

export { TEMPLATES, COLORS, HELP_MESSAGE };
