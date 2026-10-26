# NetSuite M2M — development and migration notes

Maintained at https://github.com/cevahirkaragoez/n8n-nodes-netsuite-m2m.

This project extends the earlier `@drowl87/n8n-nodes-netsuite` implementation (MIT license) with OAuth 2.0 Machine-to-Machine authentication. Original authors and copyright notices remain credited in `README.md` and `LICENSE.md`.

## Current status

Version `0.1.0` is a development release candidate. Local build and lint checks have passed. OAuth 1.0 TBA now uses a native HMAC-SHA256 transport and OAuth 2.0 M2M uses a native PS256 JWT transport. Both authentication paths require Sandbox verification before production use.

## Before publishing

1. Confirm the repository metadata and documentation links point to this project.
2. Run `npm ci`, `npm run build`, `npm run lint`, and `npm pack --dry-run`.
3. Configure a NetSuite Sandbox integration and certificate mapping; verify PS256 JWT claims and token exchange.
4. Test record operations, SuiteQL, pagination, raw requests, HTTP response mapping, and error handling in Sandbox.
5. Verify the intended n8n version can install and load this community node.
6. Publish only after testing and reviewing the package contents.

## Authentication and migration

The credential type is `netsuiteM2M` and the node type is `n8n-nodes-netsuite-m2m.netSuiteM2M`. Choose OAuth 1.0 TBA or OAuth 2.0 M2M in the credential.

OAuth 1.0 uses the project's own `transport/tbaRequest.ts` implementation. The former `@drowl87/netsuite-rest-api-client` runtime dependency has been removed. Preserve attribution for earlier open-source work.

The original node and this package can coexist. Existing workflows do not automatically migrate to the new node type: back up workflows, test in a separate environment, and reassign credentials when deliberately migrating.

The M2M access-token cache is in-memory per process, not shared across workers. Do not log or commit private keys or access tokens. Avoid automatic retries of non-idempotent write requests.

See [README.md](README.md) for installation, supported operations, and credential fields.
