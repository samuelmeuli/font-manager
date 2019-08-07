const path = require("path");

module.exports = {
	entry: "./src/index.ts",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js",
		library: "FontManager",
		libraryTarget: "umd",
	},
	devtool: "source-map",
	resolve: {
		extensions: [".js", ".jsx", ".ts", ".tsx"],
	},
	module: {
		rules: [
			{
				test: [/\.jsx?$/, /\.tsx?$/],
				use: "babel-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.s?css$/,
				use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
			},
		],
	},
};
