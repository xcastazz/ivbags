/** Dirección pública del sitio, para Google y las redes (sitemap, robots, enlaces compartidos). */
const env = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_URL = env && !env.includes("localhost") ? env.replace(/\/$/, "") : "https://ivbagss.com";
