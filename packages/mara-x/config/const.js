const GLOB = {
  MAIN_ENTRY: 'index.@(ts|tsx|js|jsx)',
  SERVANT_ENTRY: 'index.*.@(ts|tsx|js|jsx)',
  LIB_ENTRY: 'src/index.@(ts|js)'
}

const TARGET = {
  WEB: 'web',
  WAP: 'wap',
  APP: 'app'
}

const DEPLOY_ENV = {
  DEV: 'dev',
  TEST: 'test',
  ONLINE: 'online'
}

module.exports = {
  GLOB,
  TARGET,
  DEPLOY_ENV,
  LIB_DIR: 'lib',
  DIST_DIR: 'dist',
  VIEWS_DIR: 'src/views',
  DLL_DIR: 'dll',
  PUBLIC_PATH: './',
  HYBRID_PUBLIC_PATH: './',
  DEV_PUBLIC_PATH: '/',
  UNI_SNC: '__UNI_SNC__'
}
