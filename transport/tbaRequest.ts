import { createHmac, randomBytes } from 'crypto';
import { INetSuiteCredentials, INetSuiteRequestOptions, INetSuiteResponse, NetSuiteRequestType } from '../nodes/NetSuite/NetSuite.node.types';

const encode = (value: string): string =>
	encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
		'%' + character.charCodeAt(0).toString(16).toUpperCase());

function hostUrl(c: INetSuiteCredentials): URL {
	const raw = c.hostname.trim();
	const host = new URL(raw.startsWith('https://') ? raw : 'https://' + raw);
	if (
		host.protocol !== 'https:' || host.username || host.password || host.port ||
		host.pathname !== '/' || host.search || host.hash ||
		!/^[a-z0-9-]+\.suitetalk\.api\.netsuite\.com$/i.test(host.hostname)
	) {
		throw new Error('Hostname must be an account-specific NetSuite SuiteTalk API hostname');
	}
	return host;
}

function authorization(url: URL, method: string, c: INetSuiteCredentials): string {
	const required: Array<keyof INetSuiteCredentials> = [
		'accountId', 'consumerKey', 'consumerSecret', 'tokenKey', 'tokenSecret',
	];
	const missing = required.filter((key) => !c[key]);
	if (missing.length) throw new Error('Missing NetSuite TBA credentials: ' + missing.join(', '));

	const oauth: Record<string, string> = {
		oauth_consumer_key: c.consumerKey,
		oauth_token: c.tokenKey,
		oauth_nonce: randomBytes(15).toString('hex').slice(0, 20),
		oauth_timestamp: String(Math.floor(Date.now() / 1000)),
		oauth_signature_method: 'HMAC-SHA256',
		oauth_version: '1.0',
	};
	const parameters: Array<[string, string]> = [
		...Array.from(url.searchParams.entries()),
		...Object.entries(oauth),
	];
	const normalized = parameters
		.map(([key, value]): [string, string] => [encode(key), encode(value)])
		.sort(([ak, av], [bk, bv]) => ak < bk ? -1 : ak > bk ? 1 : av < bv ? -1 : av > bv ? 1 : 0)
		.map(([key, value]) => key + '=' + value)
		.join('&');
	const baseUrl = url.protocol + '//' + url.host + url.pathname;
	const signatureBase = [method.toUpperCase(), encode(baseUrl), encode(normalized)].join('&');
	const signingKey = encode(c.consumerSecret) + '&' + encode(c.tokenSecret);
	const signature = createHmac('sha256', signingKey).update(signatureBase).digest('base64');
	const header = { realm: c.accountId, ...oauth, oauth_signature: signature };
	return 'OAuth ' + Object.entries(header)
		.map(([key, value]) => encode(key) + '="' + encode(value) + '"')
		.join(', ');
}

function requestUrl(c: INetSuiteCredentials, req: INetSuiteRequestOptions): URL {
	const host = hostUrl(c);
	const url = new URL(req.nextUrl || req.path || '', host);
	if (url.origin !== host.origin || !url.pathname.startsWith('/services/rest/')) {
		throw new Error('NetSuite request URL must stay on the configured SuiteTalk API host');
	}
	if (req.requestType === NetSuiteRequestType.SuiteQL && !url.searchParams.has('limit')) {
		url.searchParams.set('limit', String(c.netsuiteQueryLimit || 1000));
		url.searchParams.set('offset', '0');
	}
	return url;
}

/**
 * Native OAuth 1.0 TBA request implementation.
 * Preserve the upstream response contract: HTTP error status responses are
 * returned to the node, not thrown by this transport.
 */
export async function makeTBARequest(c: INetSuiteCredentials, req: INetSuiteRequestOptions): Promise<INetSuiteResponse> {
	const method = req.method.toUpperCase();
	const url = requestUrl(c, req);
	const headers: Record<string, string> = {
		Authorization: '',
		'Accept-Language': 'en',
		'Content-Language': 'en',
		'Content-Type': 'application/json; charset=utf-8',
		Accept: 'application/json',
		Prefer: 'transient',
		...(req.headers || {}),
	};
	// Do not allow user-supplied headers to replace the OAuth signature.
	headers.Authorization = authorization(url, method, c);
	let body: string | undefined;
	if (req.requestType === NetSuiteRequestType.SuiteQL && typeof req.query === 'string') {
		body = JSON.stringify({ q: req.query });
	} else if (req.query !== undefined && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
		body = typeof req.query === 'string' ? req.query : JSON.stringify(req.query);
	} else if (req.body !== undefined) {
		body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
	}
	const response = await fetch(url, { method, headers, body });
	const raw = await response.text();
	let parsed: Record<string, unknown> = {};
	if (raw) {
		try {
			parsed = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			parsed = { message: raw.slice(0, 2000) };
		}
	}
	const responseHeaders: Record<string, string> = {};
	response.headers.forEach((value, key) => { responseHeaders[key.toLowerCase()] = value; });
	return {
		statusCode: response.status,
		statusText: response.statusText,
		body: parsed as INetSuiteResponse['body'],
		headers: responseHeaders,
		request: { options: { method } },
	};
}
