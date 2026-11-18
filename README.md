# netlifyignore

Skip a Netlify build when every changed file matches your `.netlifyignore`. The hook uses Git and supports Netlify's Node.js 18 runtime. It has no package dependencies.

## Set up the build hook

1. Run the installer from your Git checkout. It copies the hook to `scripts/netlifyignore.mjs`.

   ```sh
   npx netlifyignore install
   ```

   Pass a path such as `npx netlifyignore install tools/netlifyignore.mjs` to choose a different location relative to the repository root.

   To install directly from GitHub, run `npx github:souljorje/netlifyignore install`. You can also copy [netlifyignore.mjs](netlifyignore.mjs) by hand.

2. Add a `.netlifyignore` at the repository root. Use [gitignore patterns](https://git-scm.com/docs/gitignore) to list files that can change without a new deploy.

   ```gitignore
   **/tests/
   *.md
   !/docs/**/*.md
   ```

   Adjust the patterns to your project before committing. In this example, Markdown changes under `docs/` still trigger a build.

3. Add the hook to the existing `[build]` section in `netlify.toml`. The script path is relative to your Netlify base directory.

   ```toml
   [build]
   ignore = "node ./scripts/netlifyignore.mjs"
   ```

4. Commit the script and configuration. Netlify passes the cached and current commit refs to the hook. A missing baseline or a failed check lets the build proceed. See [Netlify's ignore command docs](https://docs.netlify.com/build/configure-builds/ignore-builds/).

## Run the tests

```sh
npm test
```

Extracted from [D3 Maps](https://github.com/souljorje/d3-maps). [MIT license](LICENSE).
