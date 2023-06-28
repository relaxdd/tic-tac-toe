type JSTypes = 'string' | 'number' | 'boolean' | 'symbol' | 'undefined'

type ArgsSchema =
  | { key?: string, arg: string, required?: boolean, type: JSTypes }
  | { key?: string, arg: string, required?: boolean, type: 'number', integer: boolean }

type Params = Partial<{
  isHelp: boolean,
  isProd: boolean,
  env: string,
  port: number,
  static: string
}>

function parseArg(arg: string) {
  const args = process.argv.slice(2)
  const index = args.findIndex(it => it.includes('--' + arg))

  if (index === -1) return undefined

  const value = args[index]!.split('=')?.[1]

  const checkNumber = (val?: string) => {
    val = val ?? value
    return !isNaN(Number(val)) ? Number(val) : val
  }

  const watchNext = () => {
    const test = args?.[index + 1]
    if (test === undefined) return true

    const kek = ['--', '-'].find(it => test.includes(it))
    if (kek !== undefined) return true

    return checkNumber(test)
  }

  return value !== undefined
    ? checkNumber() : watchNext()
}

function buildArgs(schema: ArgsSchema[]) {
  return schema.reduce<Record<string, any>>((acc, it) => {
    const key = it?.key || it.arg
    const val = parseArg(it.arg)

    const isValid = typeof val === it.type || (!it.required ? val === undefined : false)

    if (!isValid) {
      console.error(`[TypeError]: the '${it.arg}' parameter must be of type '${it.type}'`)
      process.exit()
    }

    acc[key] = val
    return acc
  }, {})
}

const schema: ArgsSchema[] = [
  { arg: 'help', key: 'isHelp', type: 'boolean' },
  { arg: 'production', key: 'isProd', type: 'boolean' },
  { arg: 'env', type: 'string' },
  { arg: 'port', type: 'number', integer: true },
  { arg: 'static', type: 'string' },
]

const args = buildArgs(schema) as Params

export function showHelp() {
  console.log(`
  Usage: --[options](= or space)[value] for <char> | <int> values or just --[options] is <bool>
  
  Options:
    --production <bool>  Режим продукции
    --env <char>         Файл переменных окружения
    --port <int>         Установить порт сервера
    --static <char>      Установить директорию static   
  `)

  process.exit(0)
}

export default args