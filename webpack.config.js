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
    target: 'web', // Use 'web' instead of 'electron-renderer'
    devtool: 'source-map', // Enable source maps for debugging
    devServer: {
        static: {
            directory: path.join(__dirname, 'src', 'renderer'), // Serve content from src/renderer
        },
        port: 3000, // Port to run the dev server on
        hot: true, // Enable hot module replacement
        historyApiFallback: true, // Fallback to index.html for SPA
    },
    module: {
        rules: [
            // JavaScript and JSX Loader
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|src\/preload\/preload\.js)/,
                use: ['babel-loader'],
            },
            // CSS Loader
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            // File Loader for Images and Fonts (optional)
            {
                test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        fallback: {
            // Browser polyfills for Node.js core modules (if needed)
            fs: false,
            path: require.resolve('path-browserify'),
            os: require.resolve('os-browserify/browser'),
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'renderer', 'index.html'),
            inject: 'body',
        }),
    ],
    node: {
        global: false,
        __filename: false,
        __dirname: false,
    },





};