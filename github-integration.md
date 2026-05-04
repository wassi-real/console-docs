# GitHub integration — environment variables and setup

This console connects to GitHub using a **GitHub App**. The server reads secrets from environment variables (see [`.env.example`](../.env.example) in the repo root).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_APP_ID` | Yes | Numeric ID of your GitHub App (App settings page). |
| `GITHUB_APP_PRIVATE_KEY` | Yes | PEM private key generated for the app. In `.env`, you can use a single line with `\n` for newlines (the app replaces `\\n` with real newlines). |
| `GITHUB_WEBHOOK_SECRET` | Yes | Same value as **Webhook secret** on the GitHub App; used to verify `X-Hub-Signature-256` on incoming webhooks. |
| `GITHUB_APP_CLIENT_ID` | No | OAuth client ID from the app; reserved for future flows. |
| `GITHUB_APP_CLIENT_SECRET` | No | OAuth client secret; reserved for future flows. |

Supabase variables (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are still required for the rest of the app.

---

## Step-by-step: integrate GitHub

### 1. Create a GitHub App

1. Open [New GitHub App](https://github.com/settings/apps/new) (or your org’s **Settings → Developer settings → GitHub Apps → New GitHub App**).
2. Set **GitHub App name**, **Homepage URL** (e.g. your console URL), and optionally **Webhook** to **Active**.
3. **Webhook URL**: `https://<your-console-host>/api/github/webhook`  
   - Local dev: use a tunnel (e.g. ngrok, Cloudflare Tunnel) so GitHub can reach your machine, e.g. `https://abc123.ngrok.io/api/github/webhook`.
4. **Webhook secret**: generate a long random string; save it — you will put the same value in `GITHUB_WEBHOOK_SECRET`.
5. **Repository permissions** (read is enough for sync):
   - **Contents**: Read-only  
   - **Metadata**: Read-only (often default)  
   - **Pull requests**: Read-only  
   - **Actions**: Read-only  
   - **Deployments**: Read-only  
6. **Subscribe to events** (match what the webhook handler processes):
   - Push  
   - Pull request  
   - Workflow run  
   - Deployment  
   - Deployment status  
7. **Where can this GitHub App be installed?** — choose **Only on this account** or **Any account** as fits your product.
8. Create the app, then **Generate a private key** and download the `.pem` file.

### 2. Configure `.env`

1. Copy `.env.example` to `.env` if you do not have one yet.
2. Set `GITHUB_APP_ID` to the numeric **App ID** on the app’s settings page.
3. Set `GITHUB_APP_PRIVATE_KEY` to the PEM contents. Easiest in `.env`: one line with escaped newlines, e.g.  
   `GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"`
4. Set `GITHUB_WEBHOOK_SECRET` to the exact webhook secret from step 1.
5. Restart the SvelteKit dev server or redeploy so new env vars load.

### 3. Install the app and get the Installation ID

1. On the GitHub App page, use **Install App** and pick the user or organization that owns the repositories you want.
2. After install, open the installation URL. It looks like:  
   `https://github.com/settings/installations/12345678`  
   The number at the end is the **Installation ID** (not the App ID).

### 4. Connect in MintMVP Console

1. Sign in to the console and open a **project**.
2. Go to **Settings** → under **Integrations**, open **GitHub** (URL shape: `/projects/<project-id>/settings/github`).
3. Enter the **Installation ID** and submit **Connect**.
4. Pick the **repository** to attach to this project and confirm. The console pulls an initial backfill automatically; ongoing sync runs about every five minutes while you use the project.

### 5. Verify webhooks (production)

1. Ensure your deployed site URL matches the **Webhook URL** in the GitHub App.
2. In GitHub → App → **Advanced** (or **Recent Deliveries**), trigger a push or PR and confirm deliveries return **200**.
3. In the console, open **GitHub** and **CI / CD** under the project; data should update after webhooks or the next automatic sync.

### 6. Public monitoring status (optional)

Owners and developers can publish a **read-only** status page for stakeholders:

1. Open the project → **Monitoring**.
2. Use **Deploy public status page**. The console stores a random token and shows a URL of the form `https://<your-host>/status/<token>`.
3. Anyone with that link can see the project name, health summary, and open incident count **without signing in**. The SvelteKit server loads data with **`SUPABASE_SERVICE_ROLE_KEY`** (same as other privileged server paths); the key is never sent to the browser.

You can **Stop publishing**, **Publish again**, or **New secret link** (rotate token) from the same screen. Requires the `project_monitoring_public` migration to be applied.

### 7. Apply database migrations

If you have not already, run Supabase migrations so tables such as `project_integrations_github`, `github_*`, and `project_monitoring_public` exist (e.g. `supabase db push` or your hosted migration process).

---

## Troubleshooting

- **`Invalid keyData` when connecting** — Usually fixed in current code: the app signs JWTs with Node’s `createPrivateKey`, which supports GitHub’s default **`BEGIN RSA PRIVATE KEY`** PEM. If you still see errors, confirm the PEM is complete (including `BEGIN` / `END` lines), uses UTF-8, and that literal line breaks in `.env` are stored as `\n` escapes on one line (see `.env.example`).
- **“GitHub App Not Configured” in the UI** — `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, or `GITHUB_WEBHOOK_SECRET` is missing or invalid; check `.env` and restart.
- **401 on webhook** — signature mismatch: confirm `GITHUB_WEBHOOK_SECRET` matches GitHub exactly and the raw request body is what GitHub signed (no proxy stripping or re-encoding).
- **Connect fails with installation error** — wrong Installation ID, app not installed on that org/user, or private key / App ID does not belong to the same app.
- **Empty data after sync** — token works but repo has no branches/PRs/actions yet, or permissions on the GitHub App are too narrow.
- **`403` / “Resource not accessible by integration”** (often on **list branches**):
  1. **GitHub App → Repository permissions**: set **Contents** to **Read-only** (or Read and write). Without Contents read, the installation token cannot list branches or commits.
  2. **github.com/settings/installations → your app → Configure**: under repository access, ensure **this repository** is included (if you chose “Only select repositories”, add it).
  3. If you changed permissions after the app was installed, GitHub may show **“Update”** on the installation — accept so the new scopes apply.
  4. Confirm the **owner/name** in the console matches the repo on GitHub (forks under another account need that account’s installation).
