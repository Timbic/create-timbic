import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as prompts from "@clack/prompts";
import mri from "mri";
import spawn from "cross-spawn";
import { TEMPLATES, HELP_MESSAGE } from "./utils";

// Arguments from cli
const args = mri<{
	template?: string;
	help?: boolean;
	overwrite?: boolean;
	immediate?: boolean;
	interactive?: boolean;
}>(process.argv.slice(2), {
	string: ["template"],
	boolean: ["overwrite", "interactive", "help", "immediate"],
	alias: { t: "template", h: "help", i: "immediate" },
});

// Main function
async function init() {
	if (args.help) {
		console.log(HELP_MESSAGE);
		return;
	}

	const isInteractive = args.interactive ?? process.stdin.isTTY;

	// 1. Get project name and target dir
	function formatTargetDir(targetDir: string) {
		return targetDir
			.trim()
			.replace(/[<>:"\\|?*]/g, "")
			.replace(/\/+$/g, "");
	}

	let targetDir = formatTargetDir(String(args._[0] ?? ""));
	if (!targetDir) {
		const defaultName = "my-app";
		if (isInteractive) {
			const projectName = await prompts.text({
				message: "Project name:",
				defaultValue: defaultName,
				placeholder: defaultName,
				validate: (value) => {
					return !value || formatTargetDir(value).length > 0 ? undefined : "Invalid project name";
				},
			});
			if (prompts.isCancel(projectName)) {
				return prompts.cancel("Operation cancelled");
			}
			targetDir = formatTargetDir(projectName);
		} else {
			targetDir = defaultName;
		}
	}

	// 2. Handle directory if exist and not empty
	function isEmpty(dir: string) {
		const files = fs.readdirSync(dir);
		return files.length === 0 || (files.length === 1 && files[0] === ".git");
	}

	if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
		let overwrite: "yes" | "no" | "ignore" | undefined = args.overwrite ? "yes" : undefined;
		if (!overwrite) {
			if (isInteractive) {
				const result = await prompts.select({
					message:
						(targetDir === "." ? "Current directory" : `Target directory "${targetDir}"`) +
						` is not empty. Please choose how to proceed:`,
					options: [
						{ label: "Cancel operation", value: "no" },
						{ label: "Remove existing files and continue", value: "yes" },
						{ label: "Ignore files and continue", value: "ignore" },
					],
				});
				if (prompts.isCancel(result)) {
					return prompts.cancel("Operation cancelled");
				}
				overwrite = result;
			} else {
				overwrite = "no";
			}
		}

		switch (overwrite) {
			case "yes":
				for (const file of fs.readdirSync(targetDir)) {
					if (file === ".git") continue;
					fs.rmSync(path.resolve(targetDir, file), { recursive: true, force: true });
				}
				break;
			case "no":
				return prompts.cancel("Operation cancelled");
		}
	}

	// 3. Get package name
	function isValidPackageName(name: string) {
		return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(name);
	}

	function toValidPackageName(name: string) {
		return name
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/^[._]/, "")
			.replace(/[^a-z\d\-~]+/g, "-");
	}

	let packageName = path.basename(path.resolve(targetDir));
	if (!isValidPackageName(packageName)) {
		if (isInteractive) {
			const packageNameResult = await prompts.text({
				message: "Package name:",
				defaultValue: toValidPackageName(packageName),
				placeholder: toValidPackageName(packageName),
				validate(dir) {
					if (dir && !isValidPackageName(dir)) {
						return "Invalid package.json name";
					}
				},
			});
			if (prompts.isCancel(packageNameResult)) {
				return prompts.cancel("Operation cancelled");
			}
			packageName = packageNameResult;
		} else {
			packageName = toValidPackageName(packageName);
		}
	}

	// 4. Choose a template and variant
	let template = args.template ?? "";
	const isExistingTemplate = TEMPLATES.find((t) => t.name === template);
	if (args.template && !isExistingTemplate) {
		prompts.log.warn(`"${template}" isn't a valid template.`);
		template = "";
	}

	if (!template) {
		if (isInteractive) {
			const result = await prompts.select({
				message: "Select a template:",
				options: TEMPLATES.map((t) => ({
					value: t,
					label: t.color(t.display),
				})),
			});
			if (prompts.isCancel(result)) {
				return prompts.cancel("Operation cancelled");
			}

			// Select a variant if exist
			if (result.variants) {
				const variant = await prompts.select({
					message: "Select a variant:",
					options: result.variants.map((v) => ({
						value: v.name,
						label: v.color(v.display),
					})),
				});
				if (prompts.isCancel(variant)) {
					return prompts.cancel("Operation cancelled");
				}
				template = variant;
			} else {
				template = result.name;
			}
		} else {
			template = "nuxt";
		}
	}

	// 5. Ask about immediate install and package manager
	const agent = process.env.npm_config_user_agent;
	const pkgManager = agent ? agent.split("/")[0] : "npm";

	let immediate = args.immediate;
	if (immediate === undefined) {
		if (isInteractive) {
			const result = await prompts.confirm({
				message: `Install with ${pkgManager} and start now?`,
			});
			if (prompts.isCancel(result)) {
				return prompts.cancel("Operation cancelled");
			}
			immediate = result;
		} else {
			immediate = false;
		}
	}

	// 6. Create directory for templates and copy the files
	const root = path.join(process.cwd(), targetDir);
	fs.mkdirSync(root, { recursive: true });
	prompts.log.step(`Scaffolding project in ${root}...`);

	const templateDir = path.resolve(fileURLToPath(import.meta.url), "../..", `template-${template}`);
	const files = fs.readdirSync(templateDir);

	function copy(src: string, dest: string) {
		const stat = fs.statSync(src);
		if (stat.isDirectory()) {
			copyDir(src, dest);
		} else {
			fs.copyFileSync(src, dest);
		}
	}

	function copyDir(srcDir: string, destDir: string) {
		fs.mkdirSync(destDir, { recursive: true });
		for (const file of fs.readdirSync(srcDir)) {
			copy(path.resolve(srcDir, file), path.resolve(destDir, file));
		}
	}

	for (const file of files) {
		const targetName = file === "_gitignore" ? ".gitignore" : file;
		const srcPath = path.join(templateDir, file);
		const destPath = path.join(root, targetName);

		if (file === "package.json") {
			const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, "package.json"), "utf-8"));
			pkg.name = packageName;
			fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(pkg, null, 4) + "\n");
		} else {
			copy(srcPath, destPath);
		}
	}

	if (immediate) {
		const installArgs = pkgManager === "yarn" ? [] : ["install"];

		prompts.log.step(`Installing dependencies with ${pkgManager}...`);
		const result = spawn.sync(pkgManager, installArgs, { stdio: "inherit", cwd: root });

		if (result.status !== 0) {
			prompts.log.error(`Failed to install dependencies with ${pkgManager}`);
		}
	}

	let finalMessage = "Done, now run: \n";
	const cdProjectName = path.relative(process.cwd(), root);
	if (root !== process.cwd()) {
		finalMessage += `\n  	cd ${cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName}`;
	}
	finalMessage += `\n  	${pkgManager} ${pkgManager === "yarn" ? "" : "install"}`.trimEnd();
	finalMessage += `\n  	${pkgManager} run dev`;
	prompts.outro(finalMessage);
}

init().catch((e) => {
	console.error(e);
});
