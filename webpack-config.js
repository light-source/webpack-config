const copyPlugin = require('copy-webpack-plugin');
const miniCssExtractPlugin = require('mini-css-extract-plugin');
const ignoreAssetsWebpackPlugin = require('ignore-assets-webpack-plugin');
// available by default in webpack
const path = require('path');
const terserPlugin = require('terser-webpack-plugin');
const imageminPlugin = require('imagemin-webpack-plugin').default;

let settings = {
    INPUT_DIR: '',
    OUTPUT_DIR: '',
    STUB_FILE: 'index.js',
    COPY_PLUGIN: [], // [ {from:x, to:x}, ]
    SCSS_FILES: [], // [ [relativeInput, relativeOutput], ]
    JS_FILES: [], // [ [relativeInput, relativeOutput], ]
    JS_EXTERNALS: {}, // e.g. if jquery already exists {jquery: 'jQuery',};
    defaults: {
        maxEntrypointSize: 1024 * 1024,
        maxAssetSize: 2 * 1024 * 1024,
        ignored: /node_modules/,
        modules: ["node_modules", "node-js/node_modules",],
        alias: {},
    },
};

class Config {


    //////// constructor


    constructor() {

        this._defaultTaskSettings = {};
        this._isProduction = false;
        this._webpackSettings = [];

    }


    //////// static methods


    static MakePathAbs(parentPath, relativePath) {
        return parentPath + '/' + relativePath;
    }


    //////// methods


    _updateDefaultTaskSettings() {

        this._defaultTaskSettings = {
            performance: {
                maxEntrypointSize: settings.defaults.maxEntrypointSize,
                maxAssetSize: settings.defaults.maxAssetSize,
            },
            watchOptions: {
                ignored: settings.defaults.ignored,
            },
        };
        this._defaultTaskSettings.devtool = 'nosources-source-map';

        this._defaultTaskSettings.optimization = {
            minimize: this._isProduction,
            minimizer: [
                // remove comments (default target files is js)
                new terserPlugin({
                    sourceMap: true,
                    terserOptions: {
                        output: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
            ],
        };

        this._defaultTaskSettings.resolve = {
            modules: settings.defaults.modules,
            alias: settings.defaults.alias,
        };

    }

    _scssTaskSettings(taskSettings, fileName) {

        taskSettings.module = {
            rules: [
                {
                    test: /\.scss$/i,
                    use: [
                        miniCssExtractPlugin.loader,
                        // css to commonJs module, disable import files in url(), enable source-maps
                        {
                            loader: 'css-loader',
                            options: {
                                url: false,
                                sourceMap: true,
                            },
                        },
                        // postcss : autoprefix
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: true,
                                plugins: function () {
                                    return [
                                        require('autoprefixer'),
                                    ];
                                },
                            }
                        },
                        // sass to css, enable source-maps
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
            ],
        };
        taskSettings.plugins = [
            new miniCssExtractPlugin({
                filename: fileName,
            }),
        ];

        return taskSettings;
    }

    _static() {

        if (!settings.COPY_PLUGIN.length) {
            return;
        }

        let taskSettings = Object.assign({}, this._defaultTaskSettings);
        taskSettings.devtool = '';
        taskSettings.entry = Config.MakePathAbs(settings.INPUT_DIR, settings.STUB_FILE);
        taskSettings.output = {
            path: settings.OUTPUT_DIR,
            filename: path.basename(Config.MakePathAbs(settings.INPUT_DIR, settings.STUB_FILE)),
        };
        taskSettings.plugins = [
            new copyPlugin({
                patterns: settings.COPY_PLUGIN,
            }),
            new ignoreAssetsWebpackPlugin({
                ignore: [
                    Config.MakePathAbs(settings.INPUT_DIR, settings.STUB_FILE),
                ],
            }),
            new imageminPlugin({
                // can disable in dev
                disable: false,
                test: /\.(jpe?g|png)$/i,
            })
        ];
        this._webpackSettings.push(taskSettings);

    }

    _scss() {

        settings.SCSS_FILES.forEach((scssFile, i) => {

            let pathToOriginFile = Config.MakePathAbs(settings.INPUT_DIR, scssFile[0]);
            let pathToTargetFile = Config.MakePathAbs(settings.OUTPUT_DIR, scssFile[1]);

            let fileName = path.basename(pathToTargetFile);
            let taskSettings = Object.assign({}, this._defaultTaskSettings);

            taskSettings.entry = pathToOriginFile;
            taskSettings.output = {
                path: path.dirname(pathToTargetFile),
                filename: path.basename(Config.MakePathAbs(settings.INPUT_DIR, settings.STUB_FILE)),
            };

            taskSettings = this._scssTaskSettings(taskSettings, fileName);
            taskSettings.plugins.push(
                new ignoreAssetsWebpackPlugin({
                    ignore: [
                        settings.INPUT_DIR, settings.STUB_FILE,
                        settings.INPUT_DIR, settings.STUB_FILE + '.map',
                    ],
                }),
            );

            this._webpackSettings.push(taskSettings);

        });

    }

    _js() {

        settings.JS_FILES.forEach((jsFile, i) => {

            let pathToOriginFile = Config.MakePathAbs(settings.INPUT_DIR, jsFile[0]);
            let pathToTargetFile = Config.MakePathAbs(settings.OUTPUT_DIR, jsFile[1]);

            let taskSettings = Object.assign({}, this._defaultTaskSettings);

            taskSettings.entry = pathToOriginFile;
            taskSettings.output = {
                filename: path.basename(pathToTargetFile),
                path: path.dirname(pathToTargetFile),
            };

            // option if already exists on the site
            taskSettings.externals = settings.JS_EXTERNALS;

            this._webpackSettings.push(taskSettings);

        });

    }

    exports(env, argv) {

        this._isProduction = 'production' === argv.mode;
        this._updateDefaultTaskSettings();

        this._static();
        this._scss();
        this._js();

        return this._webpackSettings;
    }

}

module.exports = {
    Config: Config,
    settings: settings,
};
