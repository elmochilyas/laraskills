# Skill: Implement Sanitization and Input Normalization

## Purpose
Sanitize and normalize API inputs in `prepareForValidation()` or via `Str` helpers: trim whitespace, normalize line endings, strip HTML tags, and format phone/date/number fields before validation.

## When To Use
- Free-text input fields from untrusted sources
- Fields requiring format normalization before validation
- Preventing stored XSS via input sanitization

## When NOT To Use
- Input validation — sanitization is not validation
- Trusted internal API calls — skip unnecessary transformation
- Binary or file uploads — handle separately

## Prerequisites
- Form Request classes
- PHP string manipulation functions

## Inputs
- Field sanitization rules per field
- Normalization specifications

## Workflow
1. Override `prepareForValidation()` in Form Request for field normalization
2. Trim whitespace on all string fields: `$this->merge(['name' => trim($this->name)])`
3. Normalize line endings for textarea fields: `str_replace(["\r\n", "\r"], "\n", $value)`
4. Strip HTML tags from plain-text fields using `strip_tags()` — output encoding handled at view layer
5. Normalize phone numbers to E.164 format with country code: `+1234567890`
6. Format dates to ISO 8601: `Carbon::parse($value)->toIso8601String()`
7. Convert booleans consistently: filter_var($value, FILTER_VALIDATE_BOOLEAN)
8. Normalize case for email fields to lowercase: `strtolower(trim($value))`
9. Use `Str::slug()` for slug fields after validation
10. Log sanitization applied for audit trail — not required for standard cases

## Validation Checklist
- [ ] `prepareForValidation()` overridden for field normalization
- [ ] Whitespace trimmed on all string fields
- [ ] Line endings normalized for textarea fields
- [ ] HTML tags stripped from plain-text fields
- [ ] Phone numbers normalized to E.164 format
- [ ] Dates formatted to ISO 8601
- [ ] Booleans converted consistently
- [ ] Emails lowercased after trim
- [ ] Slugs generated from title fields
- [ ] Sanitization applied before validation rules run

## Common Failures
- Sanitizing after validation — invalid data normalized to valid but incorrect
- Double-encoding — HTML entities stored when output encoding also escapes
- Not preserving original for audit — user's original input lost, can't resolve disputes
- Over-sanitizing — stripping legitimate HTML from fields that accept it (markdown, bio)
- Assuming Unicode-safe `strip_tags()` — multibyte characters may produce unexpected results
- Phone normalization without country code — cannot determine country from number alone

## Decision Points
- Strip HTML vs encode HTML — strip for plain-text fields, encode for rich-text fields
- Normalize before vs after validation — before for format, after for slug generation
- Preserve original — store original in `_original` field for audit, use sanitized for display

## Performance Considerations
- String operations on small inputs are negligible (<0.001ms)
- Large text fields (10K+ chars) with strip_tags may take 1-2ms
- Batch normalization loops add per-field overhead — process only fields with normalization rules

## Security Considerations
- Input sanitization prevents stored XSS — but output encoding is the primary defense
- Never rely solely on server-side sanitization — XSS prevention is defense-in-depth
- Strip HTML from fields rendered as plain-text — prevents injected event handlers
- Don't strip HTML from preview/markdown fields — use proper rendering with XSS escaping
- Sanitization must happen before validation — invalid HTML may bypass validation

## Related Rules
- Use prepareForValidation For Field Normalization
- Trim Whitespace On All String Fields
- Strip HTML From Plain-Text Fields
- Normalize Phone Numbers To E.164 Format
- Normalize Emails To Lowercase
- Apply Sanitization Before Validation

## Related Skills
- Form Request Validation Logic — for validation after sanitization
- Input Validation Architecture — for overall input handling
- XSS Prevention Strategy — for output encoding

## Success Criteria
- All string fields trimmed and stripped of HTML before processing
- Phone numbers consistently stored in E.164 format
- Emails lowercased for consistent matching
- Date fields stored in ISO 8601 format
- Boolean fields consistently true/false regardless of input format
- Sanitization applied before validation — no validation bypass via HTML injection
