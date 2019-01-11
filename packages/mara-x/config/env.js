'use strict'

const fs = require('fs')
const paths = require('./paths')

const NODE_ENV = process.env.NODE_ENV

if (!NODE_ENV) {
  throw new Error(
    'The NODE_ENV environment variable is required but was not specified.'
  )
}

function loadDotEnv() {
  // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
  const dotenvFiles = [
    `${paths.dotenv}.${NODE_ENV}.local`,
    `${paths.dotenv}.${NODE_ENV}`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    NODE_ENV !== 'test' && `${paths.dotenv}.local`,
    paths.dotenv
  ].filter(Boolean)

  // merge .env* 文件中的环境变量
  // dotenv 永远不会覆盖已经存在的环境变量
  // 对于环境中已存在的同名变量，dotenv 会略过设置
  // https://github.com/motdotla/dotenv
  // https://github.com/motdotla/dotenv-expand
  dotenvFiles.forEach(dotenvFile => {
    if (fs.existsSync(dotenvFile)) {
      require('dotenv-expand')(
        require('dotenv').config({
          // 使用自定义路径
          path: dotenvFile
        })
      )
    }
  })
}

// hybrid 两端统一用，特别优待 jsbridgeBuildType 装载到 node 环境
// function loadHybridEnv() {
//   const envField = 'jsbridgeBuildType'

//   // 短路操作，确保通过命令参数 --target 设置的 env 优先级最高
//   if (process.env[envField] || !maraConf.globalEnv) return

//   if (envField in maraConf.globalEnv) {
//     const buildEnv = maraConf.globalEnv[envField]

//     process.env[envField] = buildEnv === 'wap' ? 'web' : buildEnv
//   }
// }

function loadBrowserslist() {
  const browserslist = require('browserslist')

  // https://github.com/ai/browserslist/blob/master/node.js
  if (!browserslist.findConfig(paths.app)) {
    // 默认浏览器配置，移动为先
    process.env.BROWSERSLIST = [
      '> 1%',
      'last 4 versions',
      'ios >= 8',
      'android >= 4.1',
      'not ie < 9'
    ]
  }
}

function getMaraEnv(baseEnv) {
  // 为防止环境变量混淆，自定义变量需以 MARA_ 作为前缀
  const maraPrefix = /^MARA_/i

  return (
    Object.keys(process.env)
      // 收集当前环境中的自定义环境变量
      .filter(key => maraPrefix.test(key))
      .reduce((env, key) => {
        env[key] = process.env[key]

        return env
      }, baseEnv)
  )
}

loadDotEnv()

// browserslist 供 babel-preset-env，postcss-env 使用
loadBrowserslist()

module.exports = function getEnv(publicUrl, globalEnv = {}) {
  // NODE_ENV，PUBLIC_URL 放在 assign 尾部
  // 防止被用户覆盖
  const baseEnv = Object.assign({}, globalEnv, {
    // 标识开发与生产环境
    // React 内部依赖此变量
    NODE_ENV: process.env.NODE_ENV || 'development',
    // 方便使用公共资源路径
    // 在 js 内，以 process.env.PUBLIC_URL 变量存在
    // html 中可使用 %PUBLIC_URL% 占位符
    // 例：<img src="%PUBLIC_URL%/img/logo.png">
    PUBLIC_URL: publicUrl
  })
  const raw = getMaraEnv(baseEnv)

  // DefinePlugin 需要传入序列化参数值
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key])

      return env
    }, {})
  }

  // raw 给 InterpolateHtmlPlugin 插件使用
  return { raw, stringified }
}
