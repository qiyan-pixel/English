# Fixing "CORS" / "Load failed" for a provider (e.g. Kimi Code Plan)

Some AI providers' APIs only work when called from a server or CLI tool, not
from a webpage's JavaScript — their server never implements the CORS
preflight handshake browsers require. Anthropic's API is a documented
exception (that's why "Anthropic Claude" works directly in this site's
settings); most others, possibly including Kimi's Coding Plan endpoint,
are not. `proxy.js` in this folder is a tiny reverse proxy that fixes this:
it runs your real API key server-side, so the actual call to the provider
happens server-to-server (never subject to browser CORS), while your key
never touches the website or this repository.

This costs nothing (Cloudflare's free tier) and takes about 10 minutes,
all done by clicking around in Cloudflare's dashboard — no command line,
no install.

## 1. Create a free Cloudflare account

Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) and sign up (email + password is enough).

## 2. Create the Worker

1. In the Cloudflare dashboard sidebar, click **Workers & Pages**.
2. Click **Create** → **Create Worker**.
3. Give it any name (e.g. `my-ai-proxy`) and click **Deploy**. This creates a placeholder "Hello World" worker — that's expected, you'll replace it next.
4. Click **Edit code** (sometimes labeled "Edit" or a `</>` icon).
5. Delete everything in the editor and paste in the entire contents of [`proxy.js`](./proxy.js) from this folder.
6. Click **Save and deploy** (sometimes labeled **Deploy**).

## 3. Set your three variables

1. Go back to the Worker's page, click **Settings** → **Variables and Secrets** (naming varies slightly by dashboard version).
2. Add three variables, each as **Secret** (not plain text) so they stay encrypted:
   - `UPSTREAM_BASE_URL` — the real provider's base URL, e.g. `https://api.kimi.com/coding/v1`
   - `UPSTREAM_API_KEY` — your real provider API key
   - `PROXY_TOKEN` — a password **you make up** (not the real key). Anything long and random works, e.g. generate one at [1password.com/password-generator](https://1password.com/password-generator) or just mash the keyboard for 20+ characters.
3. Save. The Worker redeploys automatically.

## 4. Copy your Worker's URL

At the top of the Worker's dashboard page you'll see a URL like:

```
https://my-ai-proxy.<your-account-name>.workers.dev
```

Copy it.

## 5. Point the English site at your Worker

Open the site → ⚙️ Settings → AI 服务商 Provider → **其他 (OpenAI 兼容接口)**, then fill in:

- **接口地址 Base URL**: your Worker's URL from step 4 (e.g. `https://my-ai-proxy.yourname.workers.dev`)
- **API Key**: the `PROXY_TOKEN` you invented in step 3 — **not** your real provider key
- **模型名称 Model name**: whatever model ID your provider expects (e.g. `kimi-for-coding`, or check your provider's own docs/dashboard for the exact model name)

Click **🔌 测试连接 Test Connection**. It should now succeed — the browser is calling your Worker (which allows it, via `Access-Control-Allow-Origin`), and your Worker is calling the real provider server-to-server (which isn't subject to CORS at all).

## Notes

- `proxy.js` only allows requests from `https://qiyan-pixel.github.io` by default (see `ALLOWED_ORIGIN` near the top of the file) and requires the correct `PROXY_TOKEN`, so a stranger who happens to find your Worker's URL can't use it to spend your API budget without also knowing your token.
- This Worker is a thin pipe for one provider at a time. If you want to proxy a second CORS-blocked provider later, create a second Worker (repeat steps 2-4 with a new name and its own three variables).
- If you ever rotate your real provider key, just update `UPSTREAM_API_KEY` in the Worker's variables — nothing on the website side needs to change.
