# Contributing

Follow [AGENTS.md](AGENTS.md) and [docs/DECISIONS.md](docs/DECISIONS.md). Keep issues tied to the point-map use cases and regressions.

Before a PR: `bun run verify` and `bun run test:browser:all`. A proposed new map feature must name a use case and explain why it belongs in the component rather than an adapter/application.

Do not add a default external tile server, a map-engine API abstraction, a bundled map SDK or a release lockfile guessed by hand.
