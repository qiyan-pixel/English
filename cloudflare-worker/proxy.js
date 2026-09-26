// Minimal CORS-fixing reverse proxy for one OpenAI-compatible AI provider
// (e.g. Kimi Code Plan, or any other API whose server doesn't send CORS
// headers for direct browser calls). Runs on Cloudflare's free tier.
//
// Why this exists: some providers' /chat/completions endpoints only work
// from a server/CLI, not from client-side JavaScript in a browser, because
// their server never implements a CORS preflight (OPTIONS) handler. A
// server-to-server call (this Worker -> the provider) isn't subject to
// browser CORS at all, so proxying through here fixes it without needing a
// native app or giving up the "just open a link" simplicity of a website.
//
// Deploy: paste this whole file into the Cloudflare dashboard's Worker code
// editor (Workers & Pages -> your worker -> Edit code), then set these three
// variables under Settings -> Variables (add as "secret" so they're
// encrypted and never shown again after saving):
//   UPSTREAM_BASE_URL  e.g. https://api.kimi.com/coding/v1
//   UPSTREAM_API_KEY   your real provider API key (never goes in this file,
//                       never goes in the site, never goes in this repo)
//   PROXY_TOKEN        a password YOU invent for this Worker (not the real
//                       provider key) - the English site uses this as its
//                       "API Key" field when pointed at this Worker's URL
//
// See ../README.md for the full step-by-step walkthrough.

const ALLOWED_ORIGIN = "https://qiyan-pixel.github.io";
// If you also test the site locally, temporarily add that origin here too,
// e.g. change to a check against ["https://qiyan-pixel.github.io", "http://127.0.0.1:8420"].

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!env.PROXY_TOKEN || token !== env.PROXY_TOKEN) {
      return new Response(JSON.stringify({ error: { message: "Invalid proxy token" } }), {
        status: 401,
        headers: { ...headers, "content-type": "application/json" },
      });
    }
    if (!env.UPSTREAM_BASE_URL || !env.UPSTREAM_API_KEY) {
      return new Response(JSON.stringify({ error: { message: "Worker is missing UPSTREAM_BASE_URL or UPSTREAM_API_KEY" } }), {
        status: 500,
        headers: { ...headers, "content-type": "application/json" },
      });
    }

    const body = await request.text();
    const upstreamUrl = `${env.UPSTREAM_BASE_URL.replace(/\/+$/, "")}/chat/completions`;

    let upstreamRes;
    try {
      upstreamRes = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.UPSTREAM_API_KEY}`,
        },
        body,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: `Upstream request failed: ${err.message}` } }), {
        status: 502,
        headers: { ...headers, "content-type": "application/json" },
      });
    }

    const responseBody = await upstreamRes.text();
    return new Response(responseBody, {
      status: upstreamRes.status,
      headers: { ...headers, "content-type": "application/json" },
    });
  },
};
