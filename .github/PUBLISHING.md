# Publishing

## What is already true

npm knows about the repository: `package.json` carries `repository`, `homepage`
and `bugs`, so the npmjs.com page links back to GitHub. That link is one-way and
costs nothing — no workflow involved.

What a workflow buys is the other direction: **provenance**. Publishing from
GitHub Actions attaches a signed, public statement of which repository, which
commit and which workflow run built the tarball. npmjs.com renders it as a
"Built and signed on GitHub Actions" panel with a link to the exact run, and
anyone can verify it with `npm audit signatures`.

> Worth knowing: the **Packages** section in a GitHub repository's sidebar lists
> packages published to *GitHub Packages* (`npm.pkg.github.com`), a different
> registry. Publishing to npmjs.com will not fill it in, and it is not what you
> want — publishing to GitHub Packages would mean users needing a registry
> config to install. Provenance is the thing that ties the two together.

## One-time setup

1. **Push the repository**, so the workflow files exist on the default branch:

   ```bash
   git push -u origin main
   ```

2. **Tell npm to trust this workflow.** On npmjs.com, go to the package →
   *Settings* → *Trusted Publisher*, choose **GitHub Actions**, and enter:

   | field | value |
   | --- | --- |
   | Organization or user | `huyghebaertthomas` |
   | Repository | `isobin` |
   | Workflow filename | `publish.yml` |
   | Environment | *(leave empty)* |

   That is the whole of it. There is no token to create, copy, or rotate — npm
   accepts a short-lived credential GitHub mints for that one workflow run, and
   will not accept it from any other workflow or repository.

3. **Check `npm publish` still requires 2FA for humans, not for CI.** If the
   package has "Require two-factor authentication" set for publishing, switch it
   to *"Require two-factor authentication or automation tokens"*, or trusted
   publishing will be refused.

## Releasing a version

```bash
npm version patch          # or minor / major — writes package.json and tags
git push --follow-tags
```

Then create a GitHub Release for that tag (*Releases* → *Draft a new release* →
pick the tag → *Publish release*). Publishing the release starts the workflow,
which runs the tests, checks the tag against `package.json`, and publishes.

`workflow_dispatch` is there too, so the workflow can be run by hand from the
*Actions* tab if a release is ever published without one.

## Falling back to a token

If trusted publishing is unavailable, add an npm **automation** token as the
repository secret `NPM_TOKEN` and change the last step of `publish.yml` to:

```yaml
      - run: npm publish --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`--provenance` is explicit here; with trusted publishing it is implied.

## Note on the readme image

The GIF in the readme is referenced by absolute URL, because `files` in
`package.json` ships `dist`, the readme and the licence and nothing else — a
relative path would resolve to nothing on npmjs.com. It also means npm only
re-reads the readme when a version is published: edits to the readme on GitHub
show up there immediately, and on npm at the next release.
