'use strict'

const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const { getEntryPoints } = require('../libs/utils')
const config = require('../config')

function parseEntryPoint(page) {
  const entryPoints = getEntryPoints(`src/view/${page}/index.*.js`)
  const files = [].concat(...Object.values(entryPoints))

  return { [page]: files }
}

module.exports = function({ entry }) {
  const baseWebpackConfig = require('./webpack.base.conf')(entry)
  const entryPoint = parseEntryPoint(entry)
  const { transformer, formatter } = require('../libs/resolveLoaderError')
  const hasHtml = fs.existsSync(`${config.paths.page}/${entry}/index.html`)

  // https://github.com/survivejs/webpack-merge
  // 当 entry 为数组时，webpack-merge 默认执行 append
  const webpackConfig = merge(baseWebpackConfig, {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: entryPoint,
    output: {
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: true,
      publicPath: config.dev.assetsPublicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: info =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
    },
    optimization: {
      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      splitChunks: {
        chunks: 'all',
        name: false
      },
      // Keep the runtime chunk seperated to enable long term caching
      // https://twitter.com/wSokra/status/969679223278505985
      runtimeChunk: false
    },
    plugins: [
      hasHtml &&
        new HtmlWebpackPlugin({
          // 以页面文件夹名作为模板名称
          filename: `${entry}.html`,
          // 生成各自的 html 模板
          template: `${config.paths.page}/${entry}/index.html`,
          inject: true,
          // 每个html引用的js模块，也可以在这里加上vendor等公用模块
          chunks: [entry]
        }),
      // 替换 html 内的环境变量
      // %PUBLIC% 转换为具体路径
      // 在 dev 环境下为空字符串
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, config.dev.env.raw),
      new webpack.DefinePlugin(config.dev.env.stringified),
      // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
      new webpack.HotModuleReplacementPlugin(),
      // 出错时只打印错误，但不重新加载页面
      new webpack.NoEmitOnErrorsPlugin(),
      // 安装缺失模块后不用重启服务
      new WatchMissingNodeModulesPlugin(config.paths.nodeModules),
      // friendly error plugin displays very confusing errors when webpack
      // fails to resolve a loader, so we provide custom handlers to improve it
      new FriendlyErrorsPlugin({
        additionalTransformers: [transformer],
        additionalFormatters: [formatter]
      }),
      new CaseSensitivePathsPlugin()
    ].filter(Boolean),
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
      hints: false
    }
  })

  return webpackConfig
}
