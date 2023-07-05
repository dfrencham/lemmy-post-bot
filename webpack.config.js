//webpack.config.js
const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  target: 'node',
  entry: {
    main: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: "lemmy-post-bot.js" // <--- Will be compiled to this single file
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  externals: "./settings.json",
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      },
    ]
  },

};
