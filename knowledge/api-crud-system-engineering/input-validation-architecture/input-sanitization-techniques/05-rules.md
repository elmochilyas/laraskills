# Rules: Input Sanitization Techniques

## Rule: Sanitize Before Validation
- **Condition:** When implementing input sanitization in Form Requests
- **Action:** Sanitize input in `prepareForValidation()` before validation rules execute. Use `$this->merge()` to update request data.
- **Consequence:** Validators evaluate clean, normalized data; valid-but-messy input is not rejected.
- **Enforcement:** Review ensures sanitization is in prepareForValidation, not after validation.

## Rule: Cast Inputs to Expected Types
- **Condition:** When receiving scalar values from request input
- **Action:** Explicitly cast to expected types: `(int)`, `(float)`, `(bool)`, `(string)` in the input preparation phase.
- **Consequence:** Type confusion vulnerabilities are prevented; database receives expected types.
- **Enforcement:** PHPStan detects missing casts where types are declared.

## Rule: Strip HTML From Non-HTML Fields
- **Condition:** When storing text that will be rendered in web contexts
- **Action:** Strip HTML tags from fields where HTML is not expected. Use `strip_tags()` for simple fields or HTMLPurifier for rich content.
- **Consequence:** Stored XSS is prevented; data is consistent.
- **Enforcement:** Security tests verify HTML stripping for text fields.

## Rule: Normalize Email Addresses
- **Condition:** When accepting email address input
- **Action:** Lowercase and trim email addresses before validation and storage.
- **Consequence:** Prevents duplicate accounts due to case differences.
- **Enforcement:** Integration test verifies email normalization creates consistent records.

## Rule: Sanitize File Upload Metadata
- **Condition:** When accepting file uploads
- **Action:** Strip path traversal sequences, normalize filenames to safe characters, and validate MIME types server-side.
- **Consequence:** Prevents path traversal attacks and file type confusion.
- **Enforcement:** Security tests verify path traversal sequences are removed from filenames.

## Rule: Sanitize At Input Layer Only Once
- **Condition:** When establishing sanitization responsibilities
- **Action:** Sanitize once during input preparation. Do not re-sanitize in controllers, services, or actions. Encode at presentation layer.
- **Consequence:** Single source of truth for sanitized data; no duplicate processing.
- **Enforcement:** Code review flags sanitization operations outside input preparation layer.
