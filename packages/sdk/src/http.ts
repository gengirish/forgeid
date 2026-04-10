import { ForgeIDSDKError } from './errors.js';

export type ForgeIDAuthMode = 'api_key' | 'access_token' | 'none';

export interface HttpClientConfig {
  apiKey: string;
  accessToken?: string;
  baseUrl: string;
  timeoutMs: number;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** How to authorize the request. Defaults to `api_key`. */
  auth?: ForgeIDAuthMode;
}

/**
 * Minimal fetch-based HTTP layer for Node.js, Deno, and browsers.
 */
export class HttpClient {
  constructor(private readonly cfg: HttpClientConfig) {}

  private resolveAuthHeader(mode: ForgeIDAuthMode): string | undefined {
    if (mode === 'none') return undefined;
    if (mode === 'access_token') {
      const t = this.cfg.accessToken;
      if (!t) {
        throw ForgeIDSDKError.requestFailed(
          'ForgeIDConfig.accessToken is required for this operation (Bearer JWT).',
        );
      }
      return `Bearer ${t}`;
    }
    return `Bearer ${this.cfg.apiKey}`;
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const base = this.cfg.baseUrl.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${p}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private async parseJsonResponse(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw ForgeIDSDKError.requestFailed(`Invalid JSON response (HTTP ${res.status})`, res.status);
    }
  }

  /**
   * Performs an HTTP request, parses JSON, and returns the API `data` field.
   * On error responses, throws {@link ForgeIDSDKError} with `code`, `statusCode`, and `docUrl`.
   */
  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const { query, body, auth = 'api_key' } = options;
    const url = this.buildUrl(path, query);
    const headers = new Headers();
    headers.set('Accept', 'application/json');
    const authHeader = this.resolveAuthHeader(auth);
    if (authHeader) headers.set('Authorization', authHeader);
    if (body !== undefined) headers.set('Content-Type', 'application/json');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw ForgeIDSDKError.requestFailed(`Request timed out after ${this.cfg.timeoutMs}ms`);
      }
      throw ForgeIDSDKError.requestFailed(e instanceof Error ? e.message : 'Network error');
    } finally {
      clearTimeout(timeoutId);
    }

    const payload = await this.parseJsonResponse(res);

    if (!res.ok) {
      throw ForgeIDSDKError.fromResponse(payload, res.status);
    }

    if (payload && typeof payload === 'object' && 'error' in payload) {
      throw ForgeIDSDKError.fromResponse(payload, res.status);
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as { data: T }).data;
    }

    return payload as T;
  }

  /** Sends a GET request and returns the JSON `data` payload. */
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  /** Sends a POST request with an optional JSON body. */
  post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  /** Sends a PATCH request with an optional JSON body. */
  patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  /** Sends a DELETE request. */
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}
