# Anti-Patterns: CSP Nonce/Script-Src/Style-Src Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | CSP Nonce/Script-Src/Style-Src Configuration |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-CN-01 | unsafe-inline Alongside Nonces | Critical | High | Low |
| AP-CN-02 | Static/Reused Nonce | Critical | Medium | Low |
| AP-CN-03 | Missing Nonce on Script Tags | High | Medium | Low |
| AP-CN-04 | No strict-dynamic for Dynamic Scripts | Medium | Medium | Low |
| AP-CN-05 | Nonce in Cached HTML | Medium | Low | High |

---

## Repository-Wide Anti-Patterns

- **Nonce Generated in Partial Views**: Multiple nonces per request, inconsistent
- **No CSP Reporting Endpoint**: Violations undetected in both Report-Only and enforce mode
- **Nonce Applied to All Directives**: Nonce used in `img-src` or `font-src` which don't support it

---

## 1. unsafe-inline Alongside Nonces

### Category
Security · Critical

### Description
Including `'unsafe-inline'` in the same CSP directive that uses `'nonce-...'`, which tells the browser to allow all inline scripts, completely bypassing the nonce protection.

### Why It Happens
Developers add nonces but keep `'unsafe-inline'` as a fallback "in case something breaks." The CSP spec says `'unsafe-inline'` overrides nonces in modern browsers. The nonce is present but provides zero protection.

### Warning Signs
- CSP directive contains both `'nonce-...'` and `'unsafe-inline'`
- Browser console shows nonce is valid but all inline scripts run regardless
- Removing `'unsafe-inline'` causes scripts to be blocked
- CSP audit tools flag the unsafe-inline redundancy

### Why Harmful
The nonce is rendered completely useless. Any inline script executes, including injected XSS payloads. The development effort to implement nonces is wasted. The application has the same XSS vulnerability as without CSP.

### Real-World Consequences
- Months of nonce implementation negated by `'unsafe-inline'` fallback
- XSS vulnerability present despite CSP nonce configuration
- Security audit: "CSP nonces bypassed by unsafe-inline"
- False sense of security — team thinks CSP is protecting against XSS

### Preferred Alternative
Remove `'unsafe-inline'` entirely when using nonces.

### Refactoring Strategy
1. Remove `'unsafe-inline'` from `script-src` and `style-src`
2. If scripts are blocked, add nonces to those scripts
3. Use Report-Only mode during the transition to identify all inline scripts
4. Ensure every `<script>` and `<style>` tag has a nonce

### Detection Checklist
- [ ] Does CSP contain both `'nonce-...'` and `'unsafe-inline'`?
- [ ] Is `'unsafe-inline'` present in any CSP directive?
- [ ] Would removing `'unsafe-inline'` block legitimate scripts?
- [ ] Are nonces actually enforced?
- [ ] Do CSP audit tools flag the redundancy?

### Related Rules/Skills/Trees
- Never Use `'unsafe-inline'` as Nonce Fallback (05-rules.md)
- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)

---

## 2. Static/Reused Nonce

### Category
Security · Critical

### Description
Using a static predetermined nonce value instead of generating a fresh cryptographically random nonce per request.

### Why It Happens
For simplicity, developers hardcode a nonce: `$nonce = 'abc123'`. Or they generate it once at application startup and reuse it across all requests. It works during testing because CSP sees the nonce and allows the script.

### Warning Signs
- Nonce is a hardcoded string
- Nonce generated outside the request lifecycle (e.g., in service provider singleton)
- Same nonce value across multiple page loads
- Nonce is `base64_encode('static-value')` instead of `base64_encode(random_bytes(32))`

### Why Harmful
A static nonce defeats the purpose of CSP nonces entirely. If the nonce is the same for every request, an attacker can include `<script nonce="abc123">alert(1)</script>` in any injected content and it will execute.

### Real-World Consequences
- XSS injection bypasses CSP because attacker knows the nonce
- Attacker observes the nonce once, uses it in any subsequent injection
- CSP provides zero protection against stored XSS

### Preferred Alternative
Generate a fresh nonce per request using `base64_encode(random_bytes(32))`.

### Refactoring Strategy
1. Replace hardcoded nonce with `base64_encode(random_bytes(32))`
2. Ensure nonce is generated in middleware (per request)
3. Share the nonce via `View::share()` or request attributes

### Detection Checklist
- [ ] Is the nonce hardcoded or generated once?
- [ ] Does each request get a unique nonce?
- [ ] Is `random_bytes()` used for nonce generation?
- [ ] Can an attacker predict or reuse the nonce?
- [ ] Does refreshing the page produce a different nonce?

### Related Rules/Skills/Trees
- Generate a Fresh Nonce Per Request (05-rules.md)
- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)

---

## 3. Missing Nonce on Script Tags

### Category
Security · High

### Description
Configuring CSP with nonces but not adding the nonce attribute to all inline `<script>` and `<style>` tags, causing legitimate scripts to be blocked by CSP.

### Why It Happens
The CSP header includes `'nonce-...'`, but individual Blade templates don't include `nonce="{{ $nonce }}"` on their script tags. The developer configured CSP globally but forgot to update templates.

### Warning Signs
- CSP header includes nonce but templates lack `nonce` attributes
- Browser console shows CSP violations for inline scripts
- Some JavaScript functionality silently fails
- Third-party widget scripts without nonce are blocked
- Layout has nonce but partial views don't

### Why Harmful
All inline scripts and styles without the nonce attribute are blocked by the browser. The page may render without styling or JavaScript functionality. Users experience a broken interface without obvious error messages.

### Real-World Consequences
- All inline JavaScript stops working — SPA framework fails to initialize
- Styles missing — page renders without CSS
- Third-party widgets (chat, analytics) broken
- Silent failures — users see broken page, no console

### Preferred Alternative
Add `nonce="{{ $nonce }}"` to every `<script>` and `<style>` tag.

### Refactoring Strategy
1. Make nonce available in all views via `View::share()`
2. Audit all inline `<script>` and `<style>` tags
3. Add `nonce="{{ $nonce }}"` to each
4. Check third-party widget scripts

### Detection Checklist
- [ ] Do all inline `<script>` tags have `nonce` attributes?
- [ ] Do all inline `<style>` tags have `nonce` attributes?
- [ ] Is the nonce shared to all views?
- [ ] Are third-party scripts nonced?
- [ ] Does the browser console show CSP violations?

### Related Rules/Skills/Trees
- Add Nonce to Every Inline Script and Style Tag (05-rules.md)
- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)

---

## 4. No strict-dynamic for Dynamic Scripts

### Category
Architecture · Medium

### Description
Using nonce-based CSP without `'strict-dynamic'`, causing scripts loaded dynamically by nonced scripts to be blocked.

### Why It Happens
Developers implement basic nonce CSP without understanding `strict-dynamic`. The nonced script itself runs, but if it creates new DOM script elements (common in SPAs, module loaders, and CDN widgets), those dynamically created scripts are blocked.

### Warning Signs
- CSP uses `'nonce-...'` without `'strict-dynamic'`
- Some JavaScript features work, others silently fail
- SPA framework partially loads
- Module-loaded scripts are blocked
- Console shows CSP violations for dynamically created scripts

### Why Harmful
Dynamic script loading, a common pattern in modern JavaScript, is blocked. SPAs, component frameworks, and CDN-based dependency loaders may not function correctly.

### Real-World Consequences
- SPA creates script elements for lazy-loaded modules — blocked by CSP
- CDN widget loads fine but its sub-dependencies are blocked
- `import()` or dynamic `<script>` creation fails silently
- Page functionality partially broken

### Preferred Alternative
Add `'strict-dynamic'` to `script-src` when using nonces.

### Refactoring Strategy
1. Add `'strict-dynamic'` to the `script-src` CSP directive
2. Remove `'unsafe-inline'` if present (redundant and counterproductive)
3. Test that dynamic script loading works

### Detection Checklist
- [ ] Does CSP include `'strict-dynamic'`?
- [ ] Are dynamically loaded scripts blocked?
- [ ] Does the application use dynamic script creation?
- [ ] Are third-party scripts loading their dependencies?
- [ ] Does `import()` or lazy loading work?

### Related Rules/Skills/Trees
- Include Both Nonce and `strict-dynamic` for Complex Apps (05-rules.md)
- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)

---

## 5. Nonce in Cached HTML

### Category
Security · Medium

### Description
Caching full HTML pages (including CSP nonces) so that the same nonce is served to multiple users and requests, breaking both security and functionality.

### Why It Happens
Full-page caching (Varnish, Cloudflare, Laravel page cache) caches the HTML response including the injected nonce. Every subsequent visitor receives the same nonce.

### Warning Signs
- Full-page caching enabled on pages with inline scripts
- Nonce is the same across multiple requests to a cached page
- CSP violation after cache TTL — scripts may be blocked
- Cached page's scripts don't execute after cache hit

### Why Harmful
A stale nonce means the browser rejects scripts — the page breaks. A reused nonce (same across users) allows an attacker to use the observed nonce in XSS payloads, defeating CSP protection.

### Real-World Consequences
- Cached page serves stale nonce — inline scripts blocked for cached visitors
- Attacker observes nonce from one cached response, uses it in XSS against another user
- Full-page cache cannot be used with nonces without dynamic nonce injection

### Preferred Alternative
Exclude nonces from cached HTML. Use Edge-Side Includes (ESI), dynamic fragments, or inject nonces client-side.

### Refactoring Strategy
1. Remove nonces from cached HTML portions
2. Use ESI or server-side includes to inject nonces dynamically
3. Alternatively, use CSP hashes for static scripts instead of nonces
4. For Varnish: use edge-side includes for nonce injection

### Detection Checklist
- [ ] Are pages with inline scripts fully cached?
- [ ] Is the same nonce served to multiple users?
- [ ] Is there a mechanism for dynamic nonce injection on cached pages?
- [ ] Are scripts blocked on cached responses?
- [ ] Are hashes an alternative to nonces for this use case?

### Related Rules/Skills/Trees
- Generate a Fresh Nonce Per Request (05-rules.md)
- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)
