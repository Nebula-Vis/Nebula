const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index-dev.js',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    contentBase: './public',
    port: 8080,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        enforce: 'pre',
        options: {
          fix: true,
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        loader: 'file-loader',
      },
    ],
  },
  output: {
    // path: path.resolve(__dirname, 'public'),    // 如果要打包 注释掉这句话
    filename: 'nebula-vis.min.js',
    library: 'nebula-vis',
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}
