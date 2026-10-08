# Agent readiness deployment

## Published with GitHub Pages

- Person JSON-LD on the homepage, with existing public email, profile links, and Copenhagen location.
- `/llms.txt`: follows the published llms.txt structure, including linked when-to-use guidance.
- `/index.md`, `/stories.md`, `/404.md`: raw Markdown alternatives discovered by HTML link relations.
- No layout, JavaScript behaviour, crawling permissions, or backend changes.

The site is a personal portfolio. An Organization with a postal address is deliberately not invented. Add that only if Radim confirms an actual business identity and an address suitable for publication.

## Pending hosting decision: negotiated responses

GitHub Pages cannot implement request-time Accept negotiation. Static Markdown files alone DO NOT satisfy the homepage negotiation or Markdown 404 checks. `worker.mjs` is a prepared and locally tested Cloudflare Worker; it is not deployed by a GitHub Pages push.

To activate after obtaining Cloudflare access:

1. Add the domain to a Cloudflare account. Review/import all Porkbun DNS records, especially mail records; do not change nameservers until the zone is complete and approved.
2. Retain GitHub Pages as the origin and proxy the apex and www web records. Configure HTTPS to the origin (Full strict) and preserve the current canonical redirect.
3. Authenticate Wrangler to that account. From this directory run `npx wrangler deploy --config wrangler.jsonc`. This uses Worker **routes**, not Worker Custom Domains. Route subrequests use the underlying origin; do not point origin records at the Worker itself.
4. Confirm the original HTML, images, video, stories API/CORS, and owner pages still work. No Firebase changes are needed.
5. Run `node agent-support/verify-public.mjs` from the repository root. Inspect final response status, body, content type and Vary, after redirects, for both hosts. Re-run the external readiness audit only after these pass.

The Worker offers HTML and Markdown for the homepage and Stories guide, and for origin 404s. It honors q-values and media-range specificity, defaults wildcard ties to HTML, returns 406 when neither representation is acceptable, preserves HTML 404s and returns Markdown 404s with recovery links. Cache-Control no-store avoids mixing representations; Vary preserves origin values and adds Accept. HEAD has no body. Assets, redirects, POSTs and successful unrelated pages pass through. An unavailable Markdown source returns 502 rather than claiming HTML is Markdown.

Rollback: remove the Worker routes to restore direct GitHub Pages behaviour. The static metadata and guidance can remain. No DNS change has been made in this task.

## Verification

`node --test agent-support/test/*.test.mjs`

`node agent-support/verify-public.mjs` reports live checks without suppressing current failures. Local mocked tests verify negotiation but are not proof of live deployment.

References: https://acceptmarkdown.com/reference, https://llmstxt.org/, https://schema.org/Person, https://developers.cloudflare.com/workers/configuration/routing/routes/
