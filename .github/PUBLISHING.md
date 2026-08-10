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

Ordinary work is just work. Commit and push as often as you like — none of it
reaches npm:

```bash
git push
```

A release is a separate, deliberate act, and it is one command:

```bash
npm version patch          # or minor / major
```

That runs the tests, writes `package.json`, commits, tags `vX.Y.Z`, and pushes
the commit and the tag — `preversion` and `postversion` in `package.json` are
what add the first and last of those. Pushing the tag starts `publish.yml`,
which tests again on a clean checkout, checks the tag against `package.json`,
publishes to npm with provenance, and writes the GitHub Release from the tag.

So: **you never create a release or a tag by hand.** The only thing you choose
is `patch`, `minor` or `major`.

- `patch` — fixes, docs, anything that cannot break a caller (0.1.1 → 0.1.2)
- `minor` — new features that do not break a caller (0.1.1 → 0.2.0)
- `major` — anything that breaks a caller (0.1.1 → 1.0.0)

Below 1.0.0 the rules bend: while the leading zero is there, a `minor` bump is
the conventional place for breaking changes, which is why `motion.ambient`
being removed is 0.2.0 and not 1.0.0.

`workflow_dispatch` is there too, so the workflow can be run by hand from the
*Actions* tab if a run needs repeating.

### If it goes wrong

`npm version` refuses to run on a dirty tree, and its own commit is the point of
it, not a side effect — the version bump *is* a commit and a tag, so it can be
found again. If you want the bump without either, `npm version patch
--no-git-tag-version`.

The one failure that bites is a **tag that already exists**: npm bumps and
commits, then fails at the tag, leaving the commit behind. That happens after an
attempt was undone with `git reset` — which moves the branch but leaves the tag
pointing where it was. Undo the whole thing, not half of it:

```bash
git reset --hard HEAD~1    # drop the version commit
git tag -d v0.1.2          # and the tag it made
```

A tag that was already pushed needs `git push origin :refs/tags/v0.1.2` as well.

A version published to npm cannot be replaced — publishing 0.1.2 twice is an
error, even if the first one was wrong. The fix is always to publish 0.1.3.

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
