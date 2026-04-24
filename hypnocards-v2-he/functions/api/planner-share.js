function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function createId() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  let b64 = btoa(String.fromCharCode(...bytes));
  b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return b64;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env || !env.PLANNER_SHARE_KV) {
    return json({ error: 'share_storage_not_configured' }, 503);
  }
  const body = await request.json().catch(() => null);
  const payload = body && typeof body.payload === 'object' ? body.payload : null;
  if (!payload) return json({ error: 'invalid_payload' }, 400);
  const serialized = JSON.stringify(payload);
  if (serialized.length > 180000) return json({ error: 'payload_too_large' }, 413);
  const id = createId();
  await env.PLANNER_SHARE_KV.put(`planner-share:${id}`, serialized, { expirationTtl: 60 * 60 * 24 * 14 });
  return json({ id });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env || !env.PLANNER_SHARE_KV) {
    return json({ error: 'share_storage_not_configured' }, 503);
  }
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!id) return json({ error: 'missing_id' }, 400);
  const raw = await env.PLANNER_SHARE_KV.get(`planner-share:${id}`);
  if (!raw) return json({ error: 'not_found' }, 404);
  const payload = JSON.parse(raw);
  return json({ payload });
}
