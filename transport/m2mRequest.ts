import { constants, createHash, createPrivateKey, randomUUID, sign } from 'crypto';
import { INetSuiteCredentials, INetSuiteRequestOptions, INetSuiteResponse, NetSuiteRequestType } from '../nodes/NetSuite/NetSuite.node.types';

type CachedToken = { token: string; expiresAt: number };
const tokens = new Map<string, CachedToken>();
const inflight = new Map<string, Promise<string>>();
const b64 = (v: object): string => Buffer.from(JSON.stringify(v)).toString('base64url');

function baseHost(c: INetSuiteCredentials): URL {
  const raw = c.hostname.trim();
  const u = new URL(raw.startsWith('https://') ? raw : `https://${raw}`);
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.pathname !== '/' || u.search || u.hash || !/^[a-z0-9-]+\.suitetalk\.api\.netsuite\.com$/i.test(u.hostname)) {
    throw new Error('Hostname must be an account-specific NetSuite SuiteTalk API hostname');
  }
  return u;
}

async function accessToken(c: INetSuiteCredentials): Promise<string> {
  const host = baseHost(c);
  const key = createHash('sha256').update([host.hostname, c.accountId, c.clientId, c.certificateId, c.scope || 'rest_webservices', c.privateKey].join('\0')).digest('hex');
  const saved = tokens.get(key);
  if (saved && saved.expiresAt > Date.now() + 60000) return saved.token;
  const running = inflight.get(key);
  if (running) return running;
  const task = (async () => {
    const endpoint = new URL('/services/rest/auth/oauth2/v1/token', host).toString();
    const now = Math.floor(Date.now() / 1000);
    const assertion = `${b64({ typ: 'JWT', alg: 'PS256', kid: c.certificateId })}.${b64({ iss: c.clientId, scope: c.scope || 'rest_webservices', aud: endpoint, iat: now, exp: now + 300, jti: randomUUID() })}`;
    const pem = (c.privateKey || '').replace(/\\n/g, '\n');
    const signature = sign('sha256', Buffer.from(assertion), { key: createPrivateKey(pem), padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }).toString('base64url');
    const params = new URLSearchParams({ grant_type: 'client_credentials', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer', client_assertion: `${assertion}.${signature}` });
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
    if (!res.ok) throw new Error(`NetSuite token request failed (HTTP ${res.status}): ${res.statusText}`);
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error('NetSuite token response has no access_token');
    tokens.set(key, { token: data.access_token, expiresAt: Date.now() + Math.max(0, Number(data.expires_in || 0)) * 1000 });
    return data.access_token;
  })();
  inflight.set(key, task);
  try { return await task; } finally { inflight.delete(key); }
}

function requestUrl(c: INetSuiteCredentials, req: INetSuiteRequestOptions): URL {
  const host = baseHost(c);
  const url = new URL(req.nextUrl || req.path || '', host);
  if (url.origin !== host.origin || !url.pathname.startsWith('/services/rest/')) throw new Error('NetSuite request URL must stay on the configured SuiteTalk API host');
  if (req.query && ['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase()) && req.requestType !== NetSuiteRequestType.SuiteQL) {
    const q = typeof req.query === 'string'
		? new URLSearchParams(req.query)
		: new URLSearchParams(
			Object.entries(req.query).map(
				([k, v]): [string, string] => [k, String(v)]
      )
    );
    q.forEach((v,k) => url.searchParams.set(k,v));
  }
  return url;
}

export async function makeM2MRequest(c: INetSuiteCredentials, req: INetSuiteRequestOptions): Promise<INetSuiteResponse> {
  const token = await accessToken(c);
  const url = requestUrl(c, req);
  const headers: Record<string,string> = { Accept: 'application/json', ...(req.headers || {}), Authorization: `Bearer ${token}` };
  let body: string | undefined;
  if (req.requestType === NetSuiteRequestType.SuiteQL && typeof req.query === 'string') {
    body = JSON.stringify({ q: req.query });
    headers['Content-Type'] = 'application/json';
  } else if (req.query !== undefined && !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    body = typeof req.query === 'string' ? req.query : JSON.stringify(req.query);
    headers['Content-Type'] = 'application/json';
  } else if (req.body !== undefined) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
  }
  const method = req.method.toUpperCase();
  const res = await fetch(url, { method, headers, body });
  const raw = await res.text();
  let parsed: Record<string, unknown> = {};
  if (raw) { try { parsed = JSON.parse(raw) as Record<string, unknown>; } catch { parsed = { message: raw.slice(0, 2000) }; } }
  const responseHeaders: Record<string,string> = {};
  res.headers.forEach((v,k) => { responseHeaders[k.toLowerCase()] = v; });
  return { statusCode: res.status, statusText: res.statusText, body: parsed as INetSuiteResponse['body'], headers: responseHeaders, request: { options: { method } } };
}
