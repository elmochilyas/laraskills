# Decision Trees: Input Sanitization Techniques

## Tree 1: Sanitization vs Validation

```
Is the input value... 
├── Unacceptable (malformed, malicious, out of range) → VALIDATE: Reject with error
├── Acceptable but messy (whitespace, wrong case, extra characters) → SANITIZE: Clean and normalize
├── Acceptable but risky (contains HTML in text field) → SANITIZE: Strip or encode
└── Acceptable as-is → PASS THROUGH: No sanitization needed
```

## Tree 2: HTML Handling Strategy

```
Is HTML expected in this field?
├── NO → strip_tags() or Str::stripTags(). Remove all HTML.
├── YES, but only simple formatting → Allow specific tags: strip_tags($input, '<b><i><u><a>')
├── YES, rich HTML content → HTMLPurifier or similar. Sanitize by allowlist.
└── UNSURE → Assume no HTML. Strip. If requirement arises, add allowlist later.
```

## Tree 3: String Sanitization Operations

```
What type of string is this?
├── Email → trim() + strtolower()
├── Name → trim() + strip_tags(). Optionally capitalize words.
├── URL or URI → trim() + strip_tags(). Validate format separately.
├── Phone number → trim() + strip non-numeric characters. Store in consistent format.
├── Free text (bio, description) → trim() + strip_tags() if no HTML expected.
└── Slug → Str::slug() — transliterate, lowercase, replace spaces with hyphens.
```
