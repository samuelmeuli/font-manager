import autoprefixer from "autoprefixer";
import autoExternal from "rollup-plugin-auto-external";
import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import postcss from "rollup-plugin-postcss";

import pkg from "./package.json";

const EXTENSIONS = [".js", ".ts"];

export default [
	{
		input: "./src/index.ts",
		output: [
			{
				file: pkg.main,
				format: "umd",
				name: "FontManager",
			},
			{
				file: pkg.module,
				format: "esm",
			},
		],
		plugins: [
			// Exclude dependencies and peerDependencies from bundle
			autoExternal(),
			// Resolve TypeScript files and dependencies
			resolve({
				extensions: EXTENSIONS,
			}),
			// Transform TypeScript with Babel
			babel({
				presets: ["@babel/preset-env", "@babel/preset-typescript"],
				plugins: ["@babel/plugin-proposal-class-properties"],
				exclude: "./node_modules/**",
				extensions: EXTENSIONS,
			}),
			// Transform SCSS with PostCSS
			postcss({
				plugins: [autoprefixer],
			}),
		],
	},
];
