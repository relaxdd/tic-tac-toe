function getArg(arg: string) {
  const find = process.argv.find(it => it.includes('--' + arg))
  if (!find) return undefined
  return find.split('=')?.[1] || true
}

const args = {
  isHelp: getArg('help'),
  isProd: getArg('production') || false,
  env: getArg('env'),
  port: getArg('port'),
  static: getArg('static'),
}

export function showHelp() {
  console.log(`
  Usage: --[options]=[value] for <char> or just --[options] is <bool>
  
  Options:
    --production <bool>  Режим продукции
    --env <char>         Файл переменных окружения
    --port <char>        Установить порт сервера
    --static <char>      Установить директорию static   
  `)

  process.exit(0)
}

export default args