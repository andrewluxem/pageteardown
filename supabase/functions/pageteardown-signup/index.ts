// Receives the site's signup form (src/components/SignupForm.astro): a native
// urlencoded POST with `email`, `list`, `source` (the form's page path, set at
// build time) and the `website` honeypot. The browser navigates here, so every
// outcome is a 303 back to the site: an invalid email goes back to the form's
// page with ?signup=invalid, and every other failure goes to
// /signed-up/?signup=error. Only a disallowed origin gets a bare 403, since
// there is no trusted site to send it to.
//
// Same flow as Social Teardown's socialteardown-signup, with its own table
// (pageteardown_signups) so the sites' lists never mix.
//
// Deployed with --no-verify-jwt: the form has no Supabase key to send.

import { EMAIL, isAllowed, LISTS, sitePath } from './rules.ts';

// An email address and the three hidden fields fit in well under 1 KB.
const MAX_BODY_BYTES = 4096;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function originOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function text(status: number, body: string, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Origin' } });
}

function redirect(location: string, origin: string): Response {
  return new Response(null, { status: 303, headers: { ...corsHeaders(origin), Location: location } });
}

/** Reads at most `limit` bytes; null if the body is larger. */
async function readCapped(req: Request, limit: number): Promise<string | null> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > limit) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

Deno.serve(async (req) => {
  const referer = req.headers.get('referer');
  const origin = req.headers.get('origin') ?? originOf(referer);
  if (!isAllowed(origin)) return text(403, 'Forbidden');

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });

  // Anything that is not a duplicate or an invalid email lands here.
  const failed = () => redirect(`${origin}/signed-up/?signup=error`, origin);

  if (req.method !== 'POST') return failed();

  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/x-www-form-urlencoded') return failed();

  const raw = await readCapped(req, MAX_BODY_BYTES);
  if (raw === null) return failed();
  const form = new URLSearchParams(raw);

  const list = form.get('list') ?? '';
  if (!LISTS.has(list)) return failed();
  const signedUp = `${origin}/signed-up/?list=${list}`;

  // Bots fill every field; people never see this one. Same answer as success.
  if ((form.get('website') ?? '') !== '') return redirect(signedUp, origin);

  // The form's own `source` field first. The site's Referrer-Policy sends only
  // the origin cross-site, so a Referer path is a fallback, trusted only from
  // the same allowed origin.
  let sourcePage = sitePath(form.get('source'));
  if (!sourcePage && referer && originOf(referer) === origin) sourcePage = sitePath(new URL(referer).pathname);

  // Back to the form's page; the form shows a message for ?signup=invalid.
  const email = (form.get('email') ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) {
    return redirect(`${origin}${sourcePage ?? '/'}?signup=invalid#signup-${list}-email`, origin);
  }

  // Duplicate (email, list) is ignored, so new and repeat signups look the same.
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pageteardown_signups?on_conflict=email,list`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({ email, list, source_page: sourcePage, consent_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      console.error('insert failed', res.status, await res.text());
      return failed();
    }
  } catch (err) {
    console.error('insert failed', err);
    return failed();
  }
  // New or duplicate: the insert ignores duplicates, so this cannot tell them apart.
  console.log('signup accepted', list);
  return redirect(signedUp, origin);
});
