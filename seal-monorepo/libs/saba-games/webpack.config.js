const { NxWebpackPlugin } = require('@nx/webpack');
const { NxReactWebpackPlugin } = require('@nx/react');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
    output: {
        path: join(__dirname, '../../dist/libs/saba-games'),
    },
    devServer: {
        port: 4551,
        historyApiFallback: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        new NxWebpackPlugin({
            tsConfig: './tsconfig.app.json',
            compiler: 'babel',
            main: './src/main.tsx',
            index: './src/index.html',
            assets: [
                {
                    glob: '**/*',
                    input: 'libs/saba-games/src/assets',
                    output: '/assets',
                },
            ],
            styles: [],
            outputHashing: 'all',
            optimization: process.env.NODE_ENV === 'production',
            sourceMap: false,
        }),

        new NxReactWebpackPlugin({
            // Uncomment this line if you don't want to use SVGR
            // See: https://react-svgr.com/
            svgr: true,
        }),
    ],
};
