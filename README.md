# netlifyignore

Skip a Netlify build when every changed file matches your `.netlifyignore`.

## Setup

Run this from your Git checkout to add `scripts/netlifyignore.mjs`.

```sh
npx netlifyignore install
```

Add `.netlifyignore` at the repo root. List files that can change without a new deploy using [gitignore syntax](https://git-scm.com/docs/gitignore).

```gitignore
**/tests/
/CONTRIBUTING.md
```

Set `ignore` under `[build]` in `netlify.toml`. Adjust the path if your Netlify base directory is a subfolder.

```toml
[build]
ignore = "node ./scripts/netlifyignore.mjs"
```

Commit all three files. If the check fails or Netlify has no cached commit to compare against, the build goes ahead. [Netlify docs](https://docs.netlify.com/build/configure-builds/ignore-builds/)

For a different script location, pass a repo-relative path, such as `npx netlifyignore install tools/netlifyignore.mjs`. To install straight from GitHub, run `npx github:souljorje/netlifyignore install`.

Run the tests with `npm test`. [MIT license](LICENSE) · [Originally built for D3 Maps](https://github.com/souljorje/d3-maps)
