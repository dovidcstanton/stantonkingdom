# This is the DEVELOPMENT copy — not the live site

If you are reading this file, you are in the right folder to break things.

|                     |                                                              |
| ------------------- | ------------------------------------------------------------ |
| Folder              | `C:\Users\David C. Stanton\Desktop\stantonkingdom-development` |
| Branch              | `development`                                                 |
| Forked from         | `b37e847` — the production checkpoint, tag `production-v1`    |
| Deploys to          | a **separate** Worker. Never `stantonkingdom-launch-v1`.      |

The live site lives somewhere else. See the table at the bottom.

## Why a build here cannot reach production

The deploy target is not stored in this repository. There is no committed
`wrangler.toml` or `wrangler.jsonc`; the config is generated at build time by
nitro into `.output/server/wrangler.json`, and the name it generates is:

    dovidcstanton-stantonkingdom

Production is `stantonkingdom-launch-v1`. Those are different Workers, so the
only way anything here can overwrite the live site is if someone explicitly
types the production name on the command line. `npm run build`, `npm run dev`,
committing, pushing and `npm run deploy:dev` cannot do it.

**The one command that would.** Do not run this from this folder:

    npx wrangler deploy --config .output/server/wrangler.json --name stantonkingdom-launch-v1

That is the production deploy line. It belongs to the production folder only,
and only when a release is deliberately being promoted.

## Deploying this copy

    npm run deploy:dev

which builds and deploys to the Worker `stantonkingdom-dev` — created on first
run, entirely separate from production, on its own `workers.dev` URL. Change
the name in `package.json` if you would rather it were called something else;
just never change it to the production name.

## Secrets

`.env` and `.dev.vars` are gitignored and are **not** in this clone. Nothing
secret has been copied here. The production folder's `.env` currently holds one
key, `SITE_BASE`. When Shopify work begins, add its credentials here as `.env` /
`.dev.vars` locally, and to the dev Worker with `wrangler secret put` — never to
a committed file.

`.env.example` and `.dev.vars.example` are tracked and show the expected shape.

## Promoting work to production, when the time comes

Nothing here reaches the live site by itself. Promotion is a deliberate act:
merge `development` into the production branch in the production folder, review,
build, and deploy there with the explicit production Worker name.

## The two folders

| | Production | Development |
|---|---|---|
| Folder | `stantonkingdom-cloudflare-test` | `stantonkingdom-development` |
| Branch | `final-launch-v1` | `development` |
| Frozen at | `b37e847` (tag `production-v1`) | forked from `b37e847`, free to move |
| Worker | `stantonkingdom-launch-v1` | `stantonkingdom-dev` |
| Status | **live candidate — leave alone** | working copy |
