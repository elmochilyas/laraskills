# Rules: Blade Auto-Escaping and XSS Prevention

## Default to {{ }} for All User-Content Output
---
## Category
Security
---
## Rule
Use `{{ $var }}` (escaped output) for all user-generated content in Blade templates. Only use `{!! $var !!}` (raw output) when the content has been explicitly sanitized.
---
## Reason
`{{ }}` uses `htmlspecialchars()` to escape HTML entities, preventing XSS attacks. `{!! !!}` outputs raw HTML — if the content contains `<script>`, it executes in the user's browser. The vast majority of Blade output should use escaped syntax.
---
## Bad Example
```blade
<p>{!! $post->body !!}</p> {{-- XSS if $post->body contains <script> --}}
```
---
## Good Example
```blade
<p>{{ $post->body }}</p> {{-- Escaped — safe --}}
```
---
## Exceptions
Pre-sanitized rich HTML content (e.g., markdown rendered through HTMLPurifier).
---
## Consequences Of Violation
XSS vulnerability, script injection, data theft.
---

## Sanitize Rich Text Before Using {!! !!}
---
## Category
Security
---
## Rule
Pass any user-generated HTML content through an HTML sanitizer (HTMLPurifier, DOMPurify server-side) before outputting it with `{!! !!}`.
---
## Reason
User-generated rich text (WYSIWYG editor output, markdown) may contain malicious HTML. Sanitization strips dangerous tags and attributes (`<script>`, `onclick`, `javascript:`), leaving only safe HTML. Never trust raw user content as safe HTML.
---
## Bad Example
```blade
{{-- WYSIWYG output without sanitization --}}
<p>{!! $post->wysiwyg_content !!}</p>
```
---
## Good Example
```php
// Controller: sanitize before storing
$post->wysiwyg_content = HTMLPurifier::getInstance()->purify($request->input('body'));
```
```blade
{{-- Sanitized content — safe for raw output --}}
<p>{!! $post->wysiwyg_content !!}</p>
```
---
## Exceptions
Admin-generated HTML content from trusted sources (trusted based on role, not user ID).
---
## Consequences Of Violation
XSS via unsanitized rich text, script injection.
---

## Use @json() for JavaScript Data Embedding
---
## Category
Security
---
## Rule
Use `@json($data)` in Blade to pass PHP data to JavaScript. Never use `{!! json_encode($data) !!}` or manual string concatenation.
---
## Reason
`@json()` correctly escapes data for JavaScript context, preventing XSS injection through JSON output. Manual `json_encode()` with `{!! !!}` does not escape for the JavaScript context and can introduce XSS vectors through JSON strings containing `</script>` or other dangerous sequences.
---
## Bad Example
```blade
<script>
    var user = {!! json_encode($user) !!}; // XSS risk
</script>
```
---
## Good Example
```blade
<script>
    var user = @json($user); // Safe — properly escaped
    var postTitle = '{{ $post->title }}'; // Safe — Blade escaped
</script>
```
---
## Exceptions
No common exceptions — `@json()` is always the correct approach.
---
## Consequences Of Violation
XSS vulnerability through JavaScript context injection.
---

## Grep and Audit Every {!! !!} Usage
---
## Category
Maintainability
---
## Rule
Search the codebase for `{!!` regularly and verify each occurrence is justified and the content is sanitized. Minimize `{!! !!}` usage.
---
## Reason
Each `{!! !!}` is a potential XSS vector if the content is not properly sanitized. Regular auditing ensures no new unsafe raw output has been introduced. Minimizing `{!! !!}` reduces the attack surface.
---
## Bad Example
```bash
# Never audited — {!! !!} usage unknown
```
---
## Good Example
```bash
grep -r '{!!' resources/views/ --include="*.blade.php"
# Review each result for justification and sanitization
```
---
## Exceptions
No common exceptions — regular auditing is best practice.
---
## Consequences Of Violation
Undetected XSS vectors, security regression.
---

## Use CSP as Defense-in-Depth, Not Primary XSS Protection
---
## Category
Security
---
## Rule
Configure CSP headers as a secondary fallback layer. Never rely on CSP alone to prevent XSS — Blade escaping is the primary defense.
---
## Reason
CSP can be bypassed in certain scenarios (script gadgets, JSONP endpoints, browser extensions). Blade escaping prevents XSS at the output level regardless of CSP configuration. CSP is a complementary defense, not a replacement for proper escaping.
---
## Bad Example
```blade
{{-- Relying on CSP to block injected script --}}
<p>{!! $unsanitizedContent !!}</p>
```
---
## Good Example
```blade
{{-- Escaping is primary --}}
<p>{{ $content }}</p>
{{-- CSP is secondary defense --}}
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```
---
## Exceptions
No common exceptions — CSP is defense-in-depth only.
---
## Consequences Of Violation
XSS compromise if CSP is bypassed.
---

## Encode for the Correct Output Context
---
## Category
Security
---
## Rule
Use context-appropriate encoding for user data in HTML, JavaScript, CSS, and URL contexts. Blade's `{{ }}` only escapes for HTML context.
---
## Reason
HTML escaping does not protect against injection in JavaScript strings, CSS values, or URLs. For example, `{{ $url }}` in an `href` attribute prevents attribute injection but does not prevent `javascript:` URL injection. Each context requires specific encoding.
---
## Bad Example
```blade
<a href="{{ $userProvidedUrl }}">Click</a>
{{-- javascript:alert(1) would still execute --}}
```
---
## Good Example
```blade
<a href="{{ Str::startsWith($url, 'https://') ? $url : '#' }}">Click</a>
{{-- URL validation + Blade escaping --}}
```
---
## Exceptions
No common exceptions — context-aware encoding is required.
---
## Consequences Of Violation
URL injection, JavaScript injection, CSS injection.
