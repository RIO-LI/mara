'use strict'

process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

process.on('unhandledRejection', err => {
  throw err
})

const config = require('../config')
const { getFreePort } = require('../libs/utils')
const getEntry = require('../libs/entry')
const clearConsole = require('react-dev-utils/clearConsole')

// 是否为交互模式
const isInteractive = process.stdout.isTTY

const webpack = require('webpack')
const getWebpackConfig = require('../webpack/webpack.dev.conf')
const createDevServerConfig = require('../webpack/webpack.devServer.conf')
const prehandleConfig = require('../libs/prehandleConfig')
const progressHandler = require('../libs/buildProgress')
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || config.devServer.port
const PROTOCOL = config.devServer.https === true ? 'https' : 'http'

async function getCompiler(webpackConf, devServerConf, { entry, port } = {}) {
  const openBrowser = require('react-dev-utils/openBrowser')
  const hostUri = getServerHostUri(devServerConf.host, port)
  const compiler = webpack(webpackConf)
  let isFirstCompile = true

  new webpack.ProgressPlugin((...args) => {
    if (isFirstCompile) progressHandler.apply(null, args)
  }).apply(compiler)

  compiler.hooks.afterEmit.tapAsync(
    'maraDevServer',
    (compilation, callback) => {
      if (isFirstCompile) {
        // 交互模式下清除 console
        isInteractive && clearConsole()
      }
      callback()
    }
  )

  compiler.hooks.done.tap('maraDevServer', stats => {
    const messages = stats.toJson({}, true)

    // If errors exist, only show errors.
    if (messages.errors.length) return

    if (isFirstCompile) {
      console.log(`> Listening at ${hostUri}/\n`)
      config.devServer.open && openBrowser(getServerURL(hostUri, entry))
      isFirstCompile = false
    }
  })

  // 为每一个入口文件添加 webpack-dev-server 客户端
  Object.values(webpackConf.entry).forEach(addHotDevClient)

  return compiler
}

function addHotDevClient(entry) {
  // client 在业务模块之前引入，以捕获初始化错误
  ;[].unshift.apply(entry, [
    // 使用 CRA 提供的 client，展示更友好的错误信息
    require.resolve('react-dev-utils/webpackHotDevClient')
    // 以下为官方 dev server client
    // require.resolve('webpack-dev-server/client') + '?/',
    // require.resolve('webpack/hot/dev-server')
  ])
}

async function createDevServer(webpackConf, opts) {
  const DevServer = require('webpack-dev-server')
  const proxyConfig = config.devServer.proxy
  const serverConf = createDevServerConfig(opts.entry, proxyConfig, PROTOCOL)
  const compiler = await getCompiler(webpackConf, serverConf, opts)

  return new DevServer(compiler, serverConf)
}

function getServerHostUri(host, port) {
  return `${PROTOCOL}://${host || 'localhost'}:${port}`
}

function getServerURL(hostUri, entry) {
  let publicDevPath = config.assetsPublicPath

  // 以绝对路径 / 开头时，加入 url 中在浏览器打开
  // 以非 / 开头时，回退为 /，避免浏览器路径错乱
  publicDevPath = publicDevPath.startsWith('/') ? publicDevPath : '/'

  return `${hostUri + publicDevPath + entry}.html`
}

async function server(entryInput) {
  console.log('> Starting development server...')

  const webpackConf = prehandleConfig('dev', getWebpackConfig(entryInput))
  const port = await getFreePort(DEFAULT_PORT)
  const devServer = await createDevServer(webpackConf, {
    entry: entryInput.entry,
    port
  })
  // Ctrl + C 触发
  ;['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      devServer.close()
      process.exit()
    })
  })

  // 指定 listen host 0.0.0.0 允许来自 ip 或 localhost 的访问
  return devServer.listen(port, '0.0.0.0', err => {
    if (err) return console.log(err)
  })
}

module.exports = argv => {
  return getEntry(argv).then(server)
}
