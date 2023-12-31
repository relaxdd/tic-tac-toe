const fse = require('fs-extra')
const path = require("path");

async function copyFiles() {
  const from = path.resolve(__dirname, 'public')
  const where = path.resolve(__dirname, '../deploy/public')

  try {
    const check = await fse.pathExists(path.resolve(from, 'index.html'))

    if (!check) {
      console.warn('[Warning]: no path found to copy \'public\'')
      return
    }

    const exist = await fse.pathExists(where)
    if (exist) await fse.remove(where)
    await fse.copy(from, where, { overwrite: true })
  } catch (err) {
    console.error(err)
  }
}

copyFiles().then()