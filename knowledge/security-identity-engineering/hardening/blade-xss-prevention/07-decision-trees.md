# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Blade Auto-Escaping and XSS Prevention
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Output Escaping vs Raw Output | Default Blade output strategy | security, maintainability |
| 2 | Contextual Encoding Strategy | HTML vs JS vs CSS vs URL encoding | security, correctness |

---

# Architecture-Level Decision Trees

---

## Output Escaping vs Raw Output

---

## Decision Context

Whether to use `{{ }}` (escaped) or `{!! !!}` (raw) for Blade template output.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the content user-generated (from database, API, or request input)?
↓
YES → Use `{{ }}` (escaped). Period.
NO → Is the content static/developer-written HTML?
    YES → Can use `{!! !!}` (trusted, no user data)
    NO → Is the content pre-sanitized rich text (HTMLPurifier, markdown)?
        YES → `{!! !!}` acceptable after sanitization step
        NO → `{{ }}` (escaped) always

Does the content need to render HTML tags?
↓
YES → Is the content from a rich text editor (WYSIWYG)?
    YES → Sanitize with HTMLPurifier first, then `{!! !!}`
    NO → Likely does not need raw HTML
NO → `{{ }}` is correct

Is this an admin panel where admins submit HTML content?
↓
YES → Trusted content (based on role) — `{!! !!}` acceptable (but still prefer sanitization)
NO → User-facing content — always `{{ }}`

---

## Rationale

`{{ }}` escapes all HTML entities, preventing XSS. It should be the default for all output. `{!! !!}` bypasses escaping and must only be used when the content is known-safe — either because it's developer-written HTML or pre-sanitized through a proper HTML sanitizer. The majority of Blade output should use `{{ }}`.

---

## Recommended Default

**Default:** `{{ }}` for all user-generated content; `{!! !!}` only for trusted, sanitized HTML
**Reason:** Blade's auto-escaping is the #1 XSS prevention mechanism. Every `{!! !!}` is a potential XSS vector. Defaulting to `{{ }}` and auditing every `{!! !!}` usage catches 99% of XSS vulnerabilities at the output layer.

---

## Risks Of Wrong Choice

- `{!! !!}` with user content: XSS vulnerability, script injection
- `{{ }}` when HTML rendering needed: HTML tags displayed as text (not rendered)
- No escaping at all (not using Blade/raw PHP echo): XSS vulnerability
- Over-reliance on `{!! !!}`: large attack surface, each occurrence must be justified

---

## Related Rules

- Default to `{{ }}` for All User-Content Output (05-rules.md)
- Sanitize Rich Text Before Using `{!! !!}` (05-rules.md)
- Grep and Audit Every `{!! !!}` Usage (05-rules.md)

---

## Related Skills

- Prevent XSS in Blade Templates with Proper Escaping (06-skills.md)

---

## Contextual Encoding Strategy

---

## Decision Context

Determining the appropriate encoding method based on the output context — HTML, JavaScript, CSS, or URL.

---

## Decision Criteria

* security
* correctness

---

## Decision Tree

Where is the content being output?
↓
HTML body → `{{ $var }}` (HTML entity encoding — safe)
HTML attribute (e.g., `class="{{ $var }}"`) → `{{ $var }}` (Blade escapes quotes)
JavaScript string (`<script>const x = '{{ $var }}';</script>`) → `{{ $var }}` with single-quote context (use @json for complex data)
JavaScript data (`<script>const data = ...</script>`) → `@json($data)` (safe JSON embedding)
URL/href (`href="{{ $url }}"`) → `{{ $url }}` (for quote escaping) + URL validation (for javascript: protocol)
CSS value → Avoid user data in CSS; if necessary, use strict validation

Is the content passed to JavaScript as JSON?
↓
YES → `@json($data)` (correct escapes `</script>`, encodes for JS context)
NO → Is the content in a `<script>` string literal?
    YES → `{{ }}` with proper quote handling; better to pass as data attributes and read via JS
    NO → `{{ }}` is sufficient

Is the output in a URL/href attribute?
↓
YES → `{{ $url }}` escapes quotes + validate URL protocol (reject `javascript:`)
NO → HTML body or attribute — `{{ }}` is sufficient

---

## Rationale

Blade's `{{ }}` escapes HTML entities (`<>&"'`) suitable for HTML body and attributes. JavaScript context requires additional escaping (`</script>`, backslashes, quotes). `@json()` handles JS context safely. URL context needs protocol validation (preventing `javascript:` XSS). Context-aware encoding prevents XSS that HTML escaping alone cannot handle.

---

## Recommended Default

**Default:** `{{ }}` for HTML contexts; `@json($data)` for JavaScript data embedding; `{{ }}` + URL protocol validation for href attributes
**Reason:** HTML escaping does not protect against JavaScript context injection or `javascript:` URLs. Each context requires specific encoding. `@json()` is the standard safe approach for JS data embedding.

---

## Risks Of Wrong Choice

- `{{ }}` in JS context without quotes: incomplete protection (Blade only escapes HTML entities)
- `{!! json_encode($data) !!}` in JS: XSS via `</script>` injection
- No URL validation in href: `javascript:alert(1)` XSS vector
- User data in CSS context: CSS injection, data exfiltration

---

## Related Rules

- Encode for the Correct Output Context (05-rules.md)
- Use `@json()` for JavaScript Data Embedding (05-rules.md)

---

## Related Skills

- Prevent XSS in Blade Templates with Proper Escaping (06-skills.md)
