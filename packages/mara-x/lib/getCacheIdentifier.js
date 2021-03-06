const { md5 } = require('@mara/devkit')
const config = require('../config')
const { readJson } = require('./utils')
const tsConfig = readJson(config.paths.tsConfig)

module.exports = function getCacheIdentifier(packages = []) {
  const pkgNames = ['@mara/x', 'cache-loader'].concat(packages)
  const pkgIds = pkgNames.reduce((pkgs, name) => {
    try {
      pkgs[name] = require(`${name}/package.json`).version
    } catch (e) {
      // ignored
    }

    return pkgs
  }, {})

  return md5({
    pkgIds,
    config,
    tsConfig
  })
}
