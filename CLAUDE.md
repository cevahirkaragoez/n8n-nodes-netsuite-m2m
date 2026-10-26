# CLAUDE.md

Guidance for AI coding assistants working in this repository.

## Project

- Package: `n8n-nodes-netsuite-m2m`
- Maintainer / GitHub owner: `cevahirkaragoez`
- Repository: https://github.com/cevahirkaragoez/n8n-nodes-netsuite-m2m
- Purpose: n8n community node for Oracle NetSuite SuiteTalk REST API supporting OAuth 1.0 TBA and OAuth 2.0 M2M.
- Heritage: derived from earlier NetSuite community-node work by Nicholas Penree, Ian Dela Cruz, and David Rowley. Preserve upstream MIT copyright and attribution.

## Commands

```bash
npm ci
npm run build
npm run dev
npm run lint
npm run lintfix
npm pack --dry-run
```

No automated test suite is currently configured. The native OAuth 1.0 TBA replacement and OAuth 2.0 M2M have not yet been validated against a live NetSuite Sandbox.

## Architecture

- `nodes/NetSuite/NetSuite.node.ts`: operations and execution dispatcher. Routes requests by credential authentication type.
- `nodes/NetSuite/NetSuite.node.options.ts`: node UI fields and supported operations.
- `nodes/NetSuite/NetSuite.node.types.ts`: shared types and request/response interfaces.
- `credentials/NetSuiteM2M.credentials.ts`: credential type `netsuiteM2M`, with selectable OAuth 1.0 TBA and OAuth 2.0 M2M.
- `transport/m2mRequest.ts`: OAuth 2.0 M2M JWT assertion, token exchange, token caching, and REST transport.
- `transport/tbaRequest.ts`: native OAuth 1.0 TBA HMAC-SHA256 signing and REST transport.
- `nodes/NetSuite/NetSuite.node.json`: node metadata and documentation links.

## Request flow

`execute()` dispatches operations with concurrency control (`p-limit`). `makeRequest()` selects `makeM2MRequest()` for `oauth2M2M`; otherwise it uses native `makeTBARequest()` for OAuth 1.0. Record and SuiteQL operations process responses through `handleNetsuiteResponse()`. Raw Request returns the response body or full response directly, including HTTP error responses; preserve that behavior unless explicitly asked to change it.

## Dependencies

- `p-limit` v3: CommonJS-compatible concurrency limiter.
- `n8n-workflow`: n8n interfaces and runtime types.

## Build and release

TypeScript compiles into `dist/`; Gulp copies icon assets. The package publishes `dist/` and registers its node and credential paths in `package.json`.

GitHub Actions deployment in `.github/workflows/deploy.yml` is **manual only** (`workflow_dispatch`). It uses npm Trusted Publishing/OIDC; do not assume a push automatically publishes a release.

## Conventions and safeguards

- Preserve OAuth 1.0 behavior and existing HTTP 400/401/500 response handling unless explicitly requested otherwise.
- Do not introduce token retries, request timeouts, or pagination behavior changes without approval.
- Keep secrets, private keys, and tokens out of commits and logs.
- Follow existing TypeScript conventions and the repository's `.editorconfig`.
- Use `NODE_DEBUG=n8n-nodes-netsuite` for the current debug namespace.
- Preserve upstream attribution and MIT license notices.
