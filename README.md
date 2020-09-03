# Webpack config

## What is it
Helper for Webpack with a tuned config for a quick start.

## Installation
```
yarn add @lightsource/webpack-config
```
OR
```
npm install @lightsource/webpack-config
```

## Example of usage

Warning : If you will be using a 'COPY_PLUGIN' option don't forget to add an index.js file (as a stub) to your source folder

Info : Minification will be doing only in a production mode (webpack --mode=production)

In your webpack.config.js file:

```
const webpackConfig = require('@lightsource/webpack-config');

webpackConfig.settings.INPUT_DIR = __dirname + '/../Blocks';
webpackConfig.settings.OUTPUT_DIR = __dirname + '/../../assets/pages';
webpackConfig.settings.SCSS_FILES = [
    ['Test/test.scss', 'test/test.min.css',],
];
webpackConfig.settings.JS_FILES = [
    ['Test/test.js', 'test/test.min.js',],
];
webpackConfig.settings.COPY_PLUGIN = [
    {from: __dirname + '/../test', to: __dirname + '/../../assets'},
];

let config = new webpackConfig.Config();
module.exports = config.exports.bind(config);
```

After it you can add these lines to your package.json

```
"scripts": {
   "dev-build": "webpack --mode=development",
   "dev-watch": "webpack --mode=development --watch",
   "prod-build": "webpack --mode=production",
   "prod-watch": "webpack --mode=production --watch"
 },
```

And then type in a console

```
yarn prod-build
```
