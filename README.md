# n8n-nodes-netsuite-m2m

Community node for [n8n](https://n8n.io/) to work with Oracle NetSuite SuiteTalk REST Web Services. This fork adds an **OAuth 2.0 Machine-to-Machine (M2M)** authentication option while retaining **OAuth 1.0 Token-Based Authentication (TBA)**.

> **Status:** Early release (`0.1.0`). The package has passed local build and lint checks, but end-to-end authentication and API operations have **not yet been verified against a live NetSuite account**. Test with a NetSuite Sandbox before using it in production.

## Features

- Select **OAuth 1.0 TBA** or **OAuth 2.0 M2M** in the same credential type.
- List, get, insert, update and remove NetSuite records.
- Execute SuiteQL queries.
- Send raw REST requests.
- Configure pagination and concurrency.

Supported record types depend on NetSuite's REST API and the permissions assigned to your integration role.

## Installation

For a self-hosted n8n instance that allows community packages:

1. Open **Settings → Community Nodes**.
2. Choose **Install**.
3. Enter `n8n-nodes-netsuite-m2m`.
4. Review the community-node security warning and install.

**Important:** The package must first be published to npm. Until then, the name above is not installable from the npm registry. Follow your organization's approval process before installing community code on a company n8n server.

After installation, search for **NetSuite M2M** in the workflow node picker. The credential is displayed as **NetSuite (TBA / M2M)**.

## Configuration

Both authentication modes use these fields:

| Field | Description |
| --- | --- |
| Authentication | `OAuth 1.0 TBA` or `OAuth 2.0 M2M` |
| Hostname | Account-specific SuiteTalk REST host, for example `1234567.suitetalk.api.netsuite.com` |
| Account ID | Your NetSuite account ID |

Use the account-specific hostname for the relevant Sandbox or Production account. Do not enter your NetSuite UI hostname (such as `*.app.netsuite.com`).

### OAuth 2.0 M2M

In NetSuite, configure an integration that supports OAuth 2.0 client credentials / M2M access, assign an appropriately restricted role, and register the public certificate associated with your signing key. Consult the [NetSuite documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/) for the exact setup steps applicable to your account.

In the n8n credential, select **OAuth 2.0 M2M** and provide:

| Field | Description |
| --- | --- |
| Client ID | Client ID of the NetSuite integration |
| Certificate ID | Certificate/key identifier registered in NetSuite |
| Private Key (PEM) | Private RSA key corresponding to the registered certificate |
| Scope | Defaults to `rest_webservices` |

The implementation signs a short-lived client assertion JWT with **PS256**, exchanges it for an access token, caches the token in memory until close to expiry, and sends API calls with `Authorization: Bearer <token>`.

**Security:** Never commit a private key, access token, or other credentials to GitHub. Enter the private key through n8n's credential interface. Grant only the NetSuite permissions your workflows need.

### OAuth 1.0 TBA

In NetSuite, enable Token-Based Authentication, configure an integration and a role with the required REST permissions, and generate an access token for the integration/user/role combination.

In the n8n credential, select **OAuth 1.0 TBA** and provide:

- Consumer Key
- Consumer Secret
- Token Key
- Token Secret

OAuth 1.0 requests use the existing `@drowl87/netsuite-rest-api-client` dependency.

## Operations

| Operation | Description |
| --- | --- |
| List Records | Retrieve records of a selected type, with pagination options |
| Get Record | Retrieve a record by internal ID (or supported external ID syntax) |
| Insert Record | Create a record using the incoming item's JSON |
| Update Record | Update a record using the incoming item's JSON |
| Remove Record | Delete a record |
| Execute SuiteQL | Run a SuiteQL query |
| Raw Request | Send a custom REST API request |

### Example: SuiteQL

Choose **Execute SuiteQL** and enter:

```sql
SELECT id, entityid
FROM customer
```

Use a role with access to the requested data. NetSuite account permissions and SuiteQL availability determine whether the query succeeds.

### Example: Get Record

Choose **Get Record**, set **Record Type** to **Customer**, and enter the customer's internal ID in **ID**.

## Compatibility and testing

- Package version: `0.1.0`
- Node.js requirement declared by the package: `>=20`
- Designed as an n8n community node; n8n 2.x runtime compatibility has **not yet been confirmed by a live installation test**.

Before production use, test both authentication methods, SuiteQL, record reads and writes, error handling, and pagination in a non-production NetSuite environment.

## Development

```bash
npm install
npm run build
npm run lint
npm pack --dry-run
```

To publish a new version, update the version number and verify the package contents and functionality first. The GitHub Actions deployment workflow is configured for **manual triggering**, not automatic publishing on every push.

## Project and support

- Repository: https://github.com/cevahirkaragoez/n8n-nodes-netsuite-m2m
- Issues: https://github.com/cevahirkaragoez/n8n-nodes-netsuite-m2m/issues
- npm package: https://www.npmjs.com/package/n8n-nodes-netsuite-m2m (available after first publication)

## Credits and license

This project builds on the earlier NetSuite community-node work by [Nicholas Penree](https://github.com/drudge), [Ian Dela Cruz](https://github.com/ianpogi5), and [David Rowley](https://github.com/drowl87).

Licensed under the **MIT License**. See [LICENSE.md](LICENSE.md) for the original copyright notice and license terms.
