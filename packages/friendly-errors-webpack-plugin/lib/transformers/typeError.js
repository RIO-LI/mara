'use strict'

const {
  NormalizedMessage
} = require('fork-ts-checker-webpack-plugin/lib/NormalizedMessage')
const { TYPE } = require('../core/const')

function isTypeError(webpackError) {
  return webpackError.type === 'diagnostic'
}

function isSyntaxError(webpackError) {
  return webpackError.loaderSource === 'ts-loader'
}

function transform(error) {
  const webpackError = error.webpackError || {}

  if (isTypeError(webpackError)) {
    return Object.assign({}, error, {
      message: webpackError.content,
      type: TYPE.TS_TYPE_ERROR,
      severity: 950,
      name: 'Type error'
    })
  } else if (isSyntaxError(webpackError)) {
    return Object.assign({}, error, {
      message: webpackError.message.content,
      webpackError: new NormalizedMessage(webpackError.message),
      type: TYPE.TS_SYNTAX_ERROR,
      severity: 950,
      name: 'Syntax error'
    })
  }

  return error
}

module.exports = transform
