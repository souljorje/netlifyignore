#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { constants, copyFileSync, lstatSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const usage = 'Usage: netlifyignore install [path]'
const hook = new URL('./netlifyignore.mjs', import.meta.url)

function install(path = 'scripts/netlifyignore.mjs') {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).slice(0, -1)
  const destination = resolve(root, path)
  mkdirSync(dirname(destination), { recursive: true })

  try {
    copyFileSync(hook, destination, constants.COPYFILE_EXCL)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    if (!lstatSync(destination).isFile() || !readFileSync(destination).equals(readFileSync(hook))) {
      throw new Error(`File already exists at ${destination}`)
    }
    console.log(`Already installed at ${destination}`)
    return
  }
  console.log(`Installed ${destination}`)
}

const [command, path, ...extra] = process.argv.slice(2)
try {
  if (!command || command === '--help' || (command === 'install' && path === '--help')) {
    console.log(usage)
  } else if (command === 'install' && !path?.startsWith('-') && extra.length === 0) {
    install(path)
  } else {
    throw new Error(usage)
  }
} catch (error) {
  console.error(`netlifyignore: ${error.message}`)
  process.exitCode = 1
}
