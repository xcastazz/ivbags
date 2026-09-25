import { onRequestPost as register } from './cloudflare/functions/api/auth/register.js';
import { onRequestPost as verify } from './cloudflare/functions/api/auth/verify.js';
import { onRequestPost as login } from './cloudflare/functions/api/auth/login.js';
import { onRequestPost as resend } from './cloudflare/functions/api/auth/resend.js';
import { onRequestGet as health } from './cloudflare/functions/api/health.js';
import { onRequestGet as getOrder, onRequestPost as orders } from './cloudflare/functions/api/orders.js';
import { onRequestPost as signature } from './cloudflare/functions/api/wompi/signature.js';
import { onRequestGet as getAdminProfile, onRequestPut as updateAdminProfile } from './cloudflare/functions/api/admin/profile.js';
import { onRequestGet as getProfilePhoto } from './cloudflare/functions/api/admin/profile-photo.js';
import { onRequestGet as getWhatsappMessages, onRequestPost as sendWhatsappMessage } from './cloudflare/functions/api/whatsapp/messages.js';
import { onRequestGet as whatsappWebhookGet, onRequestPost as whatsappWebhookPost } from './cloudflare/functions/api/whatsapp/webhook.js';
import { onRequestGet as getProducts, onRequestPost as createProduct, onRequestPut as updateProduct } from './cloudflare/functions/api/products.js';
import { onRequestGet as getAdminOrders, onRequestPatch as updateAdminOrder, onRequestDelete as deleteAdminOrder } from './cloudflare/functions/api/admin/orders.js';
import { onRequestGet as getCustomers } from './cloudflare/functions/api/admin/customers.js';

const routes = new Map([
  ['POST /api/auth/register', register],
  ['POST /api/auth/verify', verify],
  ['POST /api/auth/login', login],
  ['POST /api/auth/resend', resend],
  ['GET /api/health', health],
  ['POST /api/orders', orders],
  ['GET /api/orders', getOrder],
  ['POST /api/wompi/signature', signature],
  ['GET /api/products', getProducts],
  ['POST /api/products', createProduct],
  ['PUT /api/products', updateProduct],
  ['GET /api/admin/orders', getAdminOrders],
  ['PATCH /api/admin/orders', updateAdminOrder],
  ['DELETE /api/admin/orders', deleteAdminOrder],
  ['GET /api/admin/customers', getCustomers],
  ['GET /api/admin/profile', getAdminProfile],
  ['PUT /api/admin/profile', updateAdminProfile],
  ['GET /api/admin/profile-photo', getProfilePhoto],
  ['GET /api/whatsapp/messages', getWhatsappMessages],
  ['POST /api/whatsapp/messages', sendWhatsappMessage],
  ['GET /api/whatsapp/webhook', whatsappWebhookGet],
  ['POST /api/whatsapp/webhook', whatsappWebhookPost],
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const handler = routes.get(`${request.method} ${url.pathname}`);
    if (handler) return handler({ request, env, ctx, params: {} });
    const assetRequest = new Request(request, { cf: { cacheTtl: 0, cacheEverything: false } });
    const assetResponse = await env.ASSETS.fetch(assetRequest);
    const contentType = assetResponse.headers.get('Content-Type') || '';
    if (contentType.includes('text/html') || contentType.includes('text/css') || contentType.includes('javascript')) {
      const headers = new Headers(assetResponse.headers);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      return new Response(assetResponse.body, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
    }
    return assetResponse;
  },
};
