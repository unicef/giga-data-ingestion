# Versioning

Giga Sync uses a single semantic version for the whole application, stored in the
`VERSION` file at the repository root. The API, the UI and the email service all share
that number — they are built into the same image and deployed together.

## Where the version comes from

`VERSION` is the only file you need to edit. It is available inside the Docker build
context, so nothing has to be passed as a build argument or environment variable:

- The API reads it at runtime (`APP_VERSION` in `api/data_ingestion/settings.py`).
- The UI inlines it at build time via the `__APP_VERSION__` constant defined in
  `ui/vite.config.ts`. Outside a checkout it falls back to `0.0.0-dev`.

## Where the version is visible

| Surface | Where |
| --- | --- |
| UI | Footer, on every page |
| API | `GET /api`, alongside `commit_sha` and `deploy_env` |
| OpenAPI | `version` field at `/api/docs` |
| Sentry | `app_version` tag on every event |

Sentry releases stay keyed on the commit SHA (`giga-data-ingestion@<sha>`) so that
source maps keep resolving and each deploy remains distinguishable. Use the
`app_version` tag to filter by release number.

## Cutting a release

1. Bump the version on `main`:

   ```
   task bump-version -- 1.2.0
   ```

   This writes `VERSION` and keeps `api/pyproject.toml`, `ui/package.json` and
   `email/package.json` in sync.

2. Open a PR with a `chore: release v1.2.0` commit and merge it.
3. Tag the merge commit and push the tag:

   ```
   git tag -a v1.2.0 -m "v1.2.0" && git push origin v1.2.0
   ```

4. Promote `main` > `staging` > `production` as described in
   [Deployment](deployment.md). All three environments run the same version.

Release notes come from the commit log between tags, which is readable because commit
messages follow the Conventional Commits format enforced by pre-commit:

```
git log --oneline v1.1.0..v1.2.0
```

Choose the bump based on what went in since the previous release: `feat` changes bump
the minor, `fix` and `chore` changes bump the patch, and an incompatible change to the
API or to the data schema bumps the major.
