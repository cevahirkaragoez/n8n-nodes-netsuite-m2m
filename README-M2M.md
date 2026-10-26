# NetSuite M2M fork — development preview

Based on `@drowl87/n8n-nodes-netsuite` 0.7.27 (MIT). Keep upstream license and attribution.

## Status
This is a first implementation draft, **not production verified**. It retains all seven original operations and OAuth 1.0 via the upstream client, and adds OAuth 2.0 M2M via a separate transport.

## Required checks before publishing
1. Set your own repository/homepage/bugs in package.json (currently placeholders).
2. `npm install`, `npm run build`, `npm run lint` and test in a separate n8n instance.
3. Verify JWT claims and token endpoint against your NetSuite account, including PS256 and certificate mapping.
4. Validate all seven operations, pagination, SuiteQL, query strings, raw requests, 204/201 response mapping, and error handling against sandbox. Compare with the original client.
5. OAuth 1.0 uses the original `@drowl87/netsuite-rest-api-client` dependency. New package has its own `netSuiteM2M` node type and `netsuiteM2M` credential type, so old workflows do not automatically migrate.
6. The in-memory token cache is per worker, not distributed. It is intentionally not persisted and no private keys or tokens should be logged.
7. Avoid retrying non-idempotent writes automatically after failures.
8. Confirm n8n version and community node publishing requirements before release.

## Credentials
Hostname: `<account>.suitetalk.api.netsuite.com` (not a generic hostname); Account ID; OAuth 1.0 consumer/token credentials OR OAuth 2.0 Client ID, Certificate ID, RSA PEM private key, scope.

## Migration
Original and fork can coexist. Export/test workflows, replace original node types with `n8n-nodes-netsuite-m2m.netSuiteM2M` only in a controlled migration, and reassign credentials. Back up workflows before any conversion.
