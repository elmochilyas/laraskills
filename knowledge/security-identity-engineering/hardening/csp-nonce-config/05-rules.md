# Rules: CSP Nonce Configuration

## Generate a Fresh Nonce Per Request
---
## Category
Security
---
## Rule
Generate a unique nonce per request using `base64_encode(random_bytes(32))` or a framework helper. Never reuse a nonce across multiple requests.
---
## Reason
A nonce is only secure if it is unpredictable and single-use. Reusing a nonce across requests means an attacker can inject inline scripts in a different request using the same nonce, bypassing CSP. Each request must have a fresh, random nonce.
---
## Bad Example
```php
// Nonce generated once — reused across all requests
$nonce = base64_encode('static-nonce');
```
---
## Good Example
```php
// Fresh nonce per request
$nonce = base64_encode(random_bytes(32));
```
---
## Exceptions
No common exceptions — per-request nonce generation is required.
---
## Consequences Of Violation
CSP nonce-based bypass, inline script injection.
---

## Add Nonce to Every Inline Script and Style Tag
---
## Category
Security
---
## Rule
Apply `nonce="{{ $nonce }}"` to every `<script>` and `<style>` tag in Blade templates, including third-party widget scripts.
---
## Reason
CSP with a strict policy (`script-src 'nonce-...'`) blocks all inline scripts without a matching nonce. Omitting the nonce from a single script tag causes the browser to block it, breaking page functionality. All inline scripts must include the nonce.
---
## Bad Example
```blade
<script nonce="{{ $nonce }}">console.log('safe')</script>
<script>console.log('blocked')</script> {{-- CSP blocks this --}}
```
---
## Good Example
```blade
<script nonce="{{ $nonce }}">console.log('safe')</script>
<script nonce="{{ $nonce }}">console.log('also safe')</script>
```
---
## Exceptions
External script files loaded via `<script src="...">` — nonce not needed for `src` attributes.
---
## Consequences Of Violation
CSP blocks inline scripts, broken page functionality.
---

## Never Use 'unsafe-inline' as Nonce Fallback
---
## Category
Security
---
## Rule
Remove `'unsafe-inline'` from CSP directives when using nonces. `'unsafe-inline'` completely bypasses the nonce protection.
---
## Reason
Adding `'unsafe-inline'` alongside `'nonce-...'` tells the browser to allow all inline scripts, ignoring the nonce. This renders the nonce useless and opens the full XSS attack surface. A nonce-only CSP is the only way to get real protection.
---
## Bad Example
```php
"script-src 'nonce-".$nonce."' 'unsafe-inline'" // unsafe-inline bypasses nonce
```
---
## Good Example
```php
"script-src 'nonce-".$nonce."'" // Nonce-only — strict CSP
```
---
## Exceptions
Legacy browsers that do not support nonces — use a hash-based CSP instead.
---
## Consequences Of Violation
Nonce bypassed, no XSS protection from CSP.
---

## Include Both Nonce and Strict-Dynamic for Complex Apps
---
## Category
Architecture
---
## Rule
Add `'strict-dynamic'` to the CSP directive when using modern SPAs or dependency-loaded scripts. This allows scripts loaded by nonced scripts to execute.
---
## Reason
Strict CSP with nonces blocks dynamically created scripts (e.g., a nonced `<script>` that appends another `<script>` to the DOM). `'strict-dynamic'` whitelists scripts loaded by nonced scripts, supporting modern JS module loading patterns without opening XSS vectors.
---
## Bad Example
```php
"script-src 'nonce-".$nonce."'" // Blocks dynamic script loading
```
---
## Good Example
```php
"script-src 'nonce-".$nonce."' 'strict-dynamic'" // Supports JS module loading
```
---
## Exceptions
SPAs that load all scripts statically — `strict-dynamic` may not be required.
---
## Consequences Of Violation
Dynamic scripts blocked by CSP, broken JS functionality.
---

## Store Nonce in View Data for Reuse Across Layout/Partials
---
## Category
Architecture
---
## Rule
Generate the nonce in middleware or the base controller and pass it to all views as a shared variable. Avoid generating separate nonces in each partial.
---
## Reason
A single nonce per request should be shared across the entire page (layout, partials, components). Generating multiple nonces in different templates wastes entropy and complicates the CSP directive. A shared nonce variable ensures consistency.
---
## Bad Example
```php
// Separate nonce in each partial — inconsistent
// header.blade.php: $nonce = base64_encode(random_bytes(32));
// footer.blade.php: $nonce = base64_encode(random_bytes(32));
```
---
## Good Example
```php
// Middleware: generate once for the request
View::share('nonce', base64_encode(random_bytes(32)));
```
```blade
{{-- Layout uses the shared nonce --}}
<script nonce="{{ $nonce }}">...</script>
```
---
## Exceptions
No common exceptions — single nonce per request is standard.
---
## Consequences Of Violation
Inconsistent nonces, wasted entropy, complex CSP maintenance.
---

## Include Nonce in All CSP Directives, Not Just script-src
---
## Category
Security
---
## Rule
Apply the nonce to `style-src` and `script-src` directives. Do not apply it to directives that do not support nonces (`img-src`, `font-src`).
---
## Reason
Nonces are only supported for `script-src`, `style-src`, and a few others. Applying nonces to `img-src` or `font-src` is invalid and may cause the browser to ignore the directive entirely. Refer to the CSP specification for nonce-supporting directives.
---
## Bad Example
```php
"script-src 'nonce-".$nonce."'; img-src 'nonce-".$nonce."'" // img-src does not support nonces
```
---
## Good Example
```php
"script-src 'nonce-".$nonce."'; style-src 'nonce-".$nonce."'" // Valid nonce directives
```
---
## Exceptions
No common exceptions — nonces are directive-specific per CSP spec.
---
## Consequences Of Violation
Invalid CSP directive, browser may ignore CSP policy.
