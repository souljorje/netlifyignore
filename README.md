# netlifyignore

Skip a Netlify build when every changed file matches your `.netlifyignore`. The hook reads its rules exclusively from that file and runs with Git and Node.js 18. It has no package dependencies.

## Set up the build hook

1. Copy [netlifyignore.mjs](netlifyignore.mjs) into your repository root.
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
   ignore = "node ./netlifyignore.mjs"
   ```

4. Commit the script and configuration. Netlify passes the cached and current commit refs to the hook. A missing baseline or a failed check lets the build proceed. See [Netlify's ignore command docs](https://docs.netlify.com/build/configure-builds/ignore-builds/).

## Run the tests

```sh
node --test netlifyignore.test.mjs
```

Extracted from [D3 Maps](https://github.com/souljorje/d3-maps). [MIT license](LICENSE).
