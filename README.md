# create-timbic

Personal scaffolder for smart developers.

> **Note to other devs:** This scaffolder satisfies my personal needs, so if you want to use it - just fork it!!!

## Scaffolding Your Project

With NPM:

```bash
npm create timbic@latest
```

With Yarn:

```bash
yarn create timbic
```

With PNPM:

```bash
pnpm create timbic
```

With Bun:

```bash
bun create timbic
```

With Deno:

```bash
deno create npm:timbic
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to
scaffold a Nuxt + Tailwind project, run:

```bash
# npm 7+, extra double-dash is needed:
npm create timbic@latest my-nuxt-app -- --template nuxt-tailwind

# yarn
yarn create timbic my-nuxt-app --template nuxt-tailwind

# pnpm
pnpm create timbic my-nuxt-app --template nuxt-tailwind

# Bun
bun create timbic my-nuxt-app --template nuxt-tailwind

# Deno
deno create npm:timbic my-nuxt-app -- --template nuxt-tailwind
```

Currently supported template presets include:

- `lib`
- `nuxt`
- `nuxt-stylelint`
- `nuxt-tailwind`

You can use `.` for the project name to scaffold in the current directory.

## Shout out to

- ["create-vite"](https://github.com/vitejs/vite/tree/main/packages/create-vite) by vitejs (this project was inspired by their package)
