const { NxWebpackPlugin } = require('@nx/webpack');
const { NxReactWebpackPlugin } = require('@nx/react');
const { join } = require('path');
const webpack = require('webpack');

const getPreviewAssets = (isDev) => {
    if (!isDev) return [];

    return [
        {
            glob: '**/*',
            input: 'libs/saba-games/preview-template',
            output: '/',
        },
    ];
};

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
            'process.env.NODE_ENV': JSON.stringify('UAT'),
        }),
        new NxWebpackPlugin({
            tsConfig: './tsconfig.app.json',
            compiler: 'babel',
            main: './src/main.tsx',
            index: './src/index.html',
            assets: [
                ...getPreviewAssets(false),
                {
                    glob: '**/*',
                    input: 'libs/saba-games/src/assets',
                    output: '/assets',
                },
            ],
            styles: [],
            outputHashing: 'all',
            optimization: true,
            sourceMap: false,
        }),
        new NxReactWebpackPlugin({
            svgr: true,
        }),
    ],
}; 