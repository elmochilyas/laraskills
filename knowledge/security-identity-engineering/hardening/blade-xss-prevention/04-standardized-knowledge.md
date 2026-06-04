# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Blade Auto-Escaping and XSS Prevention |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Blade's `{{ $var }}` syntax automatically escapes output using PHP's `htmlspecialchars()` function, preventing XSS (Cross-Site Scripting) attacks. The raw `{!! $var !!}` syntax outputs unescaped HTML and should ONLY be used with trusted, pre-sanitized content. Blade escaping is the primary XSS defense in Laravel; CSP (Content Security Policy) is a secondary fallback layer. Context-aware encoding (HTML, JavaScript, CSS, URL) should be used when outputting user data in non-HTML contexts.

---

## Core Concepts

- **`{{ }}` — Escaped Output**: `htmlspecialchars($value, ENT_QUOTES, 'UTF-8')`. Converts `<>&"'` to HTML entities. Safe for all user-generated content.
- **`{!! !!}` — Raw Output**: Outputs the string as-is. DANGEROUS with user content. Only use with trusted HTML (markdown output, WYSIWYG content after sanitization).
- **`htmlspecialchars()`**: PHP function that escapes `<` to `&lt;`, `>` to `&gt;`, `&` to `&amp;`, `"` to `&quot;`, `'` to `&#039;` (or `&apos;`).
- **JavaScript Context**: When outputting user data in JavaScript strings, use `@json()` or `json_encode()` for safe embedding.
- **HTML Attribute Context**: Use `{{ }}` in attribute values — Blade escapes quotes to prevent attribute injection.

---

## When To Use

- `{{ }}` — Every user-generated content output. Default choice for all output.
- `{!! !!}` — Only with trusted content: admin-generated HTML, pre-sanitized markdown, safe HTML from rich text editors (after passing through HTML sanitizer like HTMLPurifier).
- CSP as fallback — when legacy code may have unescaped output or when user content includes rich media.

## When NOT To Use

- `{!! !!}` — Never use with raw user input, unsanitized database content, or content from untrusted sources.
- Relying solely on CSP for XSS protection — CSP is a fallback, not a replacement for escaping.

---

## Best Practices

- **Default to `{{ }}`**: Use escaped output for everything. Only use `{!! !!}` when you have explicitly sanitized the content.
- **Sanitize Rich Text**: If you need to render user-generated HTML, pass it through an HTML sanitizer (HTMLPurifier, DOMPurify server-side) before using `{!! !!}`.
- **Use `@json()` for JavaScript**: When passing data to JavaScript, use `@json($data)` instead of `json_encode()` — it handles quoting and escaping correctly.
- **CSP as Defense in Depth**: Configure Content-Security-Policy headers as a fallback shield — if a XSS vulnerability slips through, CSP can prevent exploitation.

---

## Architecture Guidelines

- `{{ }}` is the default Blade output syntax — always use it unless you have a specific reason not to
- `{!! !!}` usage should be limited and audited — grep for `{!!` in the codebase
- Rich text rendering: sanitize with HTMLPurifier or similar, then output with `{!! !!}`
- JavaScript embedding: `@json()` for data, `{{ }}` for strings in JS contexts (remember to use quotes)

---

## Performance Considerations

- `htmlspecialchars()` is fast — ~0.001ms per call
- HTML sanitization (HTMLPurifier) is slow — ~10-50ms per render. Cache sanitized output
- CSP parsing: browser-side — no server impact

---

## Security Considerations

- **XSS is the Most Common Web Vulnerability**: Blade's auto-escaping prevents the majority of XSS attacks automatically.
- **`{!! !!}` is the #1 XSS Vector**: Every `{!! !!}` usage is a potential XSS vulnerability if the content is not sanitized.
- **Context Matters**: HTML escaping does not protect against JavaScript context attacks. Use `@json()` for JS, URL encoding for URLs.
- **CSP Mitigation**: Even with proper escaping, CSP prevents exploitation if an escaping bypass is discovered.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `{!! !!}` without sanitization | Convenience for rich text | XSS vulnerability | Sanitize with HTMLPurifier first |
| Forgetting to escape in JavaScript context | `{{ $data }}` inside `<script>` | XSS via string injection | Use `@json($data)` for JS data |
| Not escaping in HTML attributes | `href="{{ $url }}"` without URL encoding | Attribute injection | Use proper URL escaping or validation |
| Relying solely on CSP | Assuming CSP catches everything | CSP bypass + XSS = full compromise | Escaping is primary; CSP is fallback |

---

## Anti-Patterns

- **Disabling Blade escaping globally**: Removes the primary XSS defense
- **`{!! json_encode($data) !!}`**: Use `@json($data)` — handles escaping correctly
- **Storing unsanitized HTML from users**: Sanitize on input and/or output

---

## Examples

**Safe user content (escaped):**
```blade
<h1>{{ $post->title }}</h1>
<p>{{ $post->excerpt }}</p>
```

**Dangerous (raw user content):**
```blade
{{-- XSS vulnerability if $post->body contains <script> --}}
<p>{!! $post->body !!}</p>
```

**Safe rich text (sanitized):**
```blade
{{-- Assuming body is sanitized through HTMLPurifier --}}
<p>{!! $post->sanitized_body !!}</p>
```

**Safe JavaScript embedding:**
```blade
<script>
    const user = @json($user);
    const postTitle = '{{ $post->title }}';
</script>
```

---

## Related Topics

- Content-Security-Policy (CSP) headers
- SQL injection prevention
- Mass assignment protection
- Input validation security

---

## AI Agent Notes

- Blade escaping is the most important XSS defense. Check that the project doesn't overuse `{!! !!}`.
- Grep for `{!!` in the codebase — each occurrence should be justified and the content should be sanitized.
- CSP is a complementary defense — if the project has no CSP headers, add it as a fallback layer.

---

## Verification

- [ ] All user content output uses `{{ }}` (escaped)
- [ ] `{!! !!}` usage is minimal and each occurrence is justified
- [ ] Rich text content sanitized before `{!! !!}` output
- [ ] JavaScript context uses `@json()` for data embedding
- [ ] CSP headers configured as fallback defense
- [ ] No Blade template outputs raw user input without escaping
- [ ] HTMLPurifier or similar sanitizer installed for rich text content
