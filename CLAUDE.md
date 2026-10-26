# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Community n8n node package (`@drowl87/n8n-nodes-netsuite`) providing NetSuite ERP integration via the SuiteTalk REST API. Forked from `drudge/n8n-nodes-netsuite` with extended transaction types and security patches.

## Commands

```bash
npm run build       # TypeScript compile + Gulp (copies icon assets to dist/)
npm run dev         # TypeScript watch mode
npm run lint        # ESLint on nodes/ and credentials/
npm run lintfix     # ESLint with --fix
```

No test suite exists. The project has no test framework configured.

## Architecture

### File Layout

- `nodes/NetSuite/NetSuite.node.ts` — Main node class implementing `INodeType`. Contains static methods for each operation (listRecords, getRecord, insertRecord, updateRecord, removeRecord, runSuiteQL, rawRequest) plus `execute()` which dispatches by operation name.
- `nodes/NetSuite/NetSuite.node.options.ts` — n8n UI parameter definitions (`INodeTypeDescription`). Defines available operations, record types (30+), and conditional field visibility.
- `nodes/NetSuite/NetSuite.node.types.ts` — TypeScript interfaces/enums: `INetSuiteCredentials`, `NetSuiteRequestType`, `INetSuiteRequestOptions`, `INetSuitePagedBody`.
- `credentials/NetSuite.credentials.ts` — n8n credential type for OAuth 1.0 (hostname, account ID, consumer key/secret, token key/secret).

### Request Flow

`execute()` iterates input items with concurrency control (`p-limit`) → dispatches to the appropriate static operation method → calls `makeRequest()` from `@drowl87/netsuite-rest-api-client` → response parsed by `handleNetsuiteResponse()` which normalizes errors (throws `NodeApiError` unless `continueOnFail()`) and extracts headers (operation ID, job ID, location).

### Key Dependencies

- `@drowl87/netsuite-rest-api-client` — OAuth 1.0 signed HTTP client for NetSuite REST API
- `p-limit` (v3.x, CommonJS) — Concurrency limiter for parallel request processing. Must stay on v3 — v4+ is ESM-only and incompatible with n8n's CommonJS node loader.
- `n8n-workflow` — Peer dependency providing n8n framework types (`INodeType`, `IExecuteFunctions`, etc.)

### Build Output

TypeScript compiles to `dist/`. Gulp copies `.png`/`.svg` icon files from source to `dist/`. Only `dist/` is published to npm. Entry points registered in `package.json` under `n8n.nodes` and `n8n.credentials`.

### CI/CD

GitHub Actions (`.github/workflows/deploy.yml`) publishes to npm on push to main when `package.json` changes, using OIDC trusted publishing (no long-lived npm token). The workflow uses Node 24 because npm OIDC support requires npm >= 11.5.1.

## Code Conventions

- Strict TypeScript (`noImplicitAny`, `strictNullChecks`)
- Tab indentation (per `.editorconfig`)
- Node.js `debuglog('n8n-nodes-netsuite')` for debug output (enable with `NODE_DEBUG=n8n-nodes-netsuite`)
- Operations are static methods on the `NetSuite` class, not instance methods
- Record type "custom" is a special case that reads `customRecordTypeScriptId` parameter instead
