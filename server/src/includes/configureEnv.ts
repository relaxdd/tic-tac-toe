import fs from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { config } from 'dotenv'
import path from 'path'

function getEnvPath(root: string, isProd: boolean) {
  const envFiles = [
    ['.env', '.env.development', '.env.development.local'],
    ['.env', '.env.production', '.env.production.local'],
  ]

  const find = envFiles[+isProd]!.find(it => {
    return fs.existsSync(path.join(root, it))
  })

  return find ? path.join(root, find) : null
}

function configureEnv(rootDirs: [string, string]) {
  const argv = yargs(hideBin(process.argv)).options({
    port: { type: 'number', number: true, alias: 'p' },
    mode: { type: 'string', string: true, choices: ['development', 'production'], default: 'development' },
    deploy: { type: 'boolean', default: false },
    public: { type: 'boolean', default: false },
    expose: { type: 'boolean', default: false },
  }).parseSync()

  const IS_DEV = argv.mode === 'development'
  const IS_PROD = argv.mode === 'production'
  const ROOT_DIR = rootDirs[+argv.deploy]!
  const ENV_PATH = getEnvPath(ROOT_DIR, IS_PROD)

  if (ENV_PATH) {
    config({
      path: ENV_PATH,
      encoding: 'utf-8',
      debug: IS_DEV,
    })
  }

  return {
    NODE_ENV: argv.mode,
    IS_DEPLOY: argv.deploy,
    IS_DEV, IS_PROD,
    PORT: Number(argv.port || process.env?.['PORT'] || 3000),
    ROOT_DIR,
    WITH_PUBLIC: argv.public,
    EXPOSE: argv.expose
  }
}

export default configureEnv
