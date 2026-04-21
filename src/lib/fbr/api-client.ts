// FBR API Client — Server-side only
// Resolves token from per-user business profile; falls back to process.env.FBR_API_TOKEN
// Token MUST NEVER appear in client-side code (Constitution Principle VIII)

export type FBREnv = 'sandbox' | 'production';

export class FBRApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body: unknown
  ) {
    super(message);
    this.name = 'FBRApiError';
  }
}

// Base URLs per environment
const BASE_URLS: Record<FBREnv, string> = {
  sandbox: 'https://gw.fbr.gov.pk',
  production: 'https://gw.fbr.gov.pk',
};

// FBR API path prefixes (same host, different paths)
const SUBMIT_PATHS = {
  sandbox: '/di_data/v1/di',
  production: '/di_data/v1/di',
};

async function resolveToken(userId?: string): Promise<string> {
  // Try per-user token first
  if (userId) {
    try {
      const { db } = await import('@/lib/db');
      const { businessProfiles } = await import('@/lib/db/schema/business-profiles');
      const { eq } = await import('drizzle-orm');
      const { decrypt } = await import('@/lib/settings/encryption');

      const rows = await db
        .select({
          fbrTokenEncrypted: businessProfiles.fbrTokenEncrypted,
          fbrTokenExpiresAt: businessProfiles.fbrTokenExpiresAt,
        })
        .from(businessProfiles)
        .where(eq(businessProfiles.userId, userId))
        .limit(1);

      const encrypted = rows[0]?.fbrTokenEncrypted;
      if (encrypted) {
        const expiresAt = rows[0]?.fbrTokenExpiresAt;
        if (expiresAt && expiresAt < new Date()) {
          const err = new Error('FBR_TOKEN_EXPIRED') as Error & { code: string };
          err.code = 'FBR_TOKEN_EXPIRED';
          throw err;
        }
        try {
          const token = decrypt(encrypted).trim();
          if (!token) {
            const err = new Error('FBR_TOKEN_DECRYPT_EMPTY') as Error & { code: string };
            err.code = 'FBR_TOKEN_DECRYPT_FAILED';
            throw err;
          }
          return token;
        } catch (decryptErr) {
          console.error('[FBR] Token decrypt failed for user', userId, '-', (decryptErr as Error).message);
          const err = new Error('FBR_TOKEN_DECRYPT_FAILED: re-save your FBR token in Settings (encryption key may have changed)') as Error & { code: string };
          err.code = 'FBR_TOKEN_DECRYPT_FAILED';
          throw err;
        }
      }
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      if (
        code === 'FBR_TOKEN_EXPIRED' ||
        code === 'FBR_TOKEN_MISSING' ||
        code === 'FBR_TOKEN_DECRYPT_FAILED'
      ) throw err;
      console.error('[FBR] Unexpected token resolution error, falling back to env var:', (err as Error).message);
    }
  }

  // Fall back to shared env var
  const token = process.env.FBR_API_TOKEN;
  if (!token) {
    const err = new Error('FBR_TOKEN_MISSING') as Error & { code: string };
    err.code = 'FBR_TOKEN_MISSING';
    throw err;
  }
  return token;
}


function getEnv(envOverride?: string): FBREnv {
  const env = envOverride ?? process.env.FBR_ENV ?? 'sandbox';
  return env === 'production' ? 'production' : 'sandbox';
}

function getBaseUrl(envOverride?: string): string {
  return BASE_URLS[getEnv(envOverride)];
}

function isSandbox(envOverride?: string): boolean {
  return getEnv(envOverride) === 'sandbox';
}

/**
 * Make an authenticated FBR API call.
 * @param path - e.g. '/di_data/v1/di/validateinvoicedata'
 * @param options - fetch options (method, body, etc.)
 * @param timeoutMs - timeout in ms (default 30s for submit/validate, use 10000 for reference)
 * @param userId - optional user ID for per-user token resolution
 */
async function fbrFetchOnce(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  token: string
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    if (!response.ok) {
      if (response.status === 401) {
        console.error('[FBR] 401 Unauthorized', {
          url,
          tokenLen: token.length,
          tokenHead: token.slice(0, 4),
          tokenTail: token.slice(-4),
          body,
        });
      }
      throw new FBRApiError(
        `FBR API error ${response.status}: ${response.statusText}`,
        response.status,
        body
      );
    }

    return body;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new FBRApiError('FBR API timeout', 504, null);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fbrFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
  userId?: string,
  envOverride?: string
): Promise<unknown> {
  const token = await resolveToken(userId);
  const url = `${getBaseUrl(envOverride)}${path}`;

  const maxRetries = 2;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fbrFetchOnce(url, options, timeoutMs, token);
    } catch (err) {
      lastErr = err;
      // Retry only on 5xx or 504 (timeout converted to FBRApiError above). 4xx errors are not retried.
      // Note: raw AbortError is already converted to FBRApiError(504) in fbrFetchOnce,
      // so the AbortError branch here can never be reached and is intentionally omitted.
      const isRetryable =
        err instanceof FBRApiError && (err.statusCode >= 500 || err.statusCode === 504);
      if (!isRetryable || attempt === maxRetries) throw err;
      // Exponential backoff: 1s, 2s
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }

  throw lastErr;
}

// =============================================================================
// Invoice Submit/Validate (30s timeout)
// =============================================================================

export async function fbrPost(
  path: 'validateinvoicedata' | 'postinvoicedata',
  payload: unknown,
  userId?: string,
  envOverride?: string
): Promise<unknown> {
  const suffix = isSandbox(envOverride) ? '_sb' : '';
  return fbrFetch(
    `${SUBMIT_PATHS[getEnv(envOverride)]}/${path}${suffix}`,
    { method: 'POST', body: JSON.stringify(payload) },
    30_000,
    userId,
    envOverride
  );
}

// =============================================================================
// Reference Data APIs (10s timeout)
// =============================================================================

export async function fbrGet(path: string, userId?: string): Promise<unknown> {
  return fbrFetch(path, { method: 'GET' }, 10_000, userId);
}

export async function fbrGetProvinces(): Promise<unknown> {
  return fbrGet('/pdi/v1/provinces');
}

export async function fbrGetHSCodes(userId?: string): Promise<unknown> {
  return fbrGet('/pdi/v1/itemdesccode', userId);
}

export async function fbrGetUOM(): Promise<unknown> {
  return fbrGet('/pdi/v1/uom');
}

export async function fbrGetHSUOM(hsCode: string): Promise<unknown> {
  return fbrGet(`/pdi/v2/HS_UOM?hs_code=${encodeURIComponent(hsCode)}&annexure_id=3`);
}

export async function fbrGetTaxRates(
  transTypeId: number,
  provinceCode: number,
  date: string
): Promise<unknown> {
  return fbrGet(
    `/pdi/v2/SaleTypeToRate?date=${encodeURIComponent(date)}&transTypeId=${transTypeId}&originationSupplier=${provinceCode}`
  );
}

// =============================================================================
// STATL NTN Verification (10s timeout)
// =============================================================================

export async function fbrSTATL(regno: string, date: string): Promise<unknown> {
  return fbrFetch(
    '/dist/v1/statl',
    { method: 'POST', body: JSON.stringify({ regno, date }) },
    10_000
  );
}

export async function fbrGetRegType(registrationNo: string, userId?: string): Promise<unknown> {
  return fbrFetch(
    '/dist/v1/Get_Reg_Type',
    { method: 'POST', body: JSON.stringify({ Registration_No: registrationNo }) },
    10_000,
    userId
  );
}

export { isSandbox, getEnv };
