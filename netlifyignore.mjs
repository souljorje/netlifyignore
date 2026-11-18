/*
MIT License

Copyright © 2026 Georgii Bukharov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { Buffer } from 'node:buffer'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { devNull, tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

function allIgnored(paths, ignoreFile) {
  // An empty repository keeps the project's other Git ignore rules out of the check.
  const cwd = mkdtempSync(join(tmpdir(), 'netlifyignore-'))
  try {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
    )
    env.GIT_CONFIG_GLOBAL = devNull
    env.GIT_CONFIG_NOSYSTEM = '1'

    execFileSync('git', ['init', '--quiet', '--template='], { cwd, env })

    // Preserve filename bytes and prevent Git from treating a leading colon as pathspec magic.
    const input = Buffer.from(paths.toString('latin1').replace(/(^|\0):/g, '$1./:'), 'latin1')
    const result = spawnSync('git', [
      '-c', `core.excludesFile=${ignoreFile}`,
      'check-ignore', '--no-index', '--stdin', '-z',
    ], { cwd, env, input })

    if (result.error) throw result.error
    if (result.status === 1) return false
    if (result.status !== 0) {
      throw new Error(result.stderr.toString().trim() || 'git check-ignore failed')
    }
    return result.stdout.equals(input)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

function shouldSkipBuild() {
  const { CACHED_COMMIT_REF: base, COMMIT_REF: head } = process.env
  if (!base || !head || base === head) return false

  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).slice(0, -1)
  const ignoreFile = join(root, '.netlifyignore')
  if (!existsSync(ignoreFile)) return false

  const paths = execFileSync('git', [
    'diff', '--name-only', '-z', '--no-renames', '--ignore-submodules=none',
    '--end-of-options', base, head, '--',
  ], { cwd: root })

  return paths.length === 0 || allIgnored(paths, ignoreFile)
}

try {
  process.exitCode = shouldSkipBuild() ? 0 : 1
} catch (error) {
  console.error(`netlifyignore: ${error.message}`)
  process.exitCode = 1
}
