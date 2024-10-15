// webpack.config.js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development', // Set the mode to development
    entry: './src/renderer/index.jsx', // Entry point for the application
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/', // Serve assets from the root path
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'renderer', 'index.html'),
            inject: 'body',
        })
    ],
    node: {
        global: false,
        __filename: false,
        __dirname: false,
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/, // Match JavaScript and JSX files
                exclude: /node_modules/,
                use: ['babel-loader'], // Use Babel loader for transpiling
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'], // Resolve these extensions
        fallback: {
            fs: false,
            global: require.resolve('global'),
            path: require.resolve('path-browserify'),
            os: require.resolve('os-browserify/browser'),
        },
    },
    /////target: 'electron-renderer', // Target Electron's renderer process
    target: 'web', // Use 'web' instead of 'electron-renderer'
    devServer: {
        static: {
            directory: path.join(__dirname, 'src', 'renderer'), // Serve content from src/renderer
        },
        port: 3000, // Port to run the dev server on
        hot: true, // Enable hot module replacement
        historyApiFallback: true, // Fallback to index.html for SPA
    },
    devtool: 'source-map', // Enable source maps for debugging
};