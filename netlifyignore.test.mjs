import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { devNull, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./netlifyignore.mjs', import.meta.url))

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'netlifyignore-test-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  git('init', '-q', '--template=')
  git('config', 'user.name', 'netlifyignore test')
  git('config', 'user.email', 'test@example.com')
  git('config', 'commit.gpgSign', 'false')
  git('config', 'core.hooksPath', devNull)

  function write(path, content = '') {
    const file = join(cwd, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  }

  function commit() {
    git('add', '--all', '--force')
    git('commit', '-qm', 'fixture', '--allow-empty')
    return git('rev-parse', 'HEAD')
  }

  function run(base, head, subdir = '.') {
    const { status, signal, error } = spawnSync(process.execPath, [script], {
      cwd: join(cwd, subdir),
      env: { ...process.env, CACHED_COMMIT_REF: base, COMMIT_REF: head },
    })
    assert.ifError(error)
    assert.equal(signal, null)
    return status
  }

  return { git, write, commit, run, cwd }
}

test('matches ignored paths and honors exceptions from a nested base directory', (t) => {
  const { write, commit, run } = fixture(t)
  write('.netlifyignore', '**/tests/\n*.md\n!/docs/**/*.md\n')
  write('docs/index.md', 'initial')
  const base = commit()
  write('packages/site/tests/spec.js')
  write(':notes\n with spaces.md')
  assert.equal(run(base, commit(), 'docs'), 0)
  write('docs/index.md', 'updated')
  assert.equal(run(base, commit(), 'docs'), 1)
})

test('uses only .netlifyignore rules', (t) => {
  const { git, write, commit, run, cwd } = fixture(t)
  write('.netlifyignore', '*.md\n')
  write('.gitignore', 'app.js\n')
  write('.git/info/exclude', 'app.js\n')
  write('.git/global-ignore', 'app.js\n')
  git('config', 'core.excludesFile', join(cwd, '.git/global-ignore'))
  const base = commit()
  write('app.js')
  assert.equal(run(base, commit()), 1)
})

test('checks both sides of moves and lets builds proceed without a baseline', (t) => {
  const { git, write, commit, run } = fixture(t)
  write('.netlifyignore', 'tests/\n')
  write('app.js')
  write('tests/spec.js')
  const base = commit()
  git('mv', 'app.js', 'tests/app.js')
  const head = commit()
  assert.equal(run(base, head), 1)
  assert.equal(run(base, base), 1)
  assert.equal(run('', head), 1)
  assert.equal(run('missing-commit', head), 1)
  assert.equal(run(head, commit()), 0)
})
