export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get('key');
  if (!key || !env.PROFILE_PHOTOS) return new Response('Not found', { status: 404 });
  const object = await env.PROFILE_PHOTOS.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=3600');
  return new Response(object.body, { headers });
}
