import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "ivbags",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-16",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    workersDev: true,
    previewUrls: true,
    domains: [
      { hostname: "ivbagss.com", production: true, previews: false },
      { hostname: "www.ivbagss.com", production: true, previews: true },
    ],
    env: {
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv({ id: "a3f7dc09e3744e40a5cc83a08cd0f760" }),
      NEXT_PUBLIC_SITE_URL: bindings.text("https://ivbagss.com"),
    },
  }),
});
