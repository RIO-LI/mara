const { isInstalled } = require('../libs/utils')

module.exports = function applyHook(argv) {
  const hookName = argv._[1]

  if (isInstalled(`../hooks/${hookName}`)) {
    require(`../hooks/${hookName}`)
  }
}
