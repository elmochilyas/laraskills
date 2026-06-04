# Anti-Patterns: Input Sanitization Techniques

## Sanitize After Validation
**Description:** Running validation rules on raw input and sanitizing after validation passes.
**Why it happens:** Developers write validation first, then add sanitization later.
**Consequences:** Validation rules may reject valid-but-messy input (like "User@Example.Com" failing unique email check because a different case version exists).
**Better approach:** Sanitize in `prepareForValidation()` before rules run.

## Over-Sanitization
**Description:** Stripping characters that are valid and expected — removing punctuation from names, stripping special characters from passwords.
**Why it happens:** Overzealous security approach that treats all special characters as dangerous.
**Consequences:** User frustration; data loss; names like "O'Brien" become "OBrien".
**Better approach:** Sanitize only what's necessary. Let validation reject truly invalid input.

## Sanitization Via Blacklist
**Description:** Removing specific "bad" patterns from input (blacklisting) instead of allowing only "good" patterns (allowlisting).
**Why it happens:** Developers think "remove what's dangerous" is simpler.
**Consequences:** Blacklists are never complete; new attack patterns bypass them.
**Better approach:** Use allowlist approach. Define what IS allowed; strip or reject everything else.

## Single-Layer Sanitization
**Description:** Relying solely on input sanitization without encoding at the output layer.
**Why it happens:** Developers think "I sanitized on input, so the data is safe."
**Consequences:** If the display context changes (API output, JSON export), stored data may be rendered unsafely.
**Better approach:** Sanitize for storage (normalize, strip unwanted content). Encode for display (escape for the output context).

## Confusing Sanitization and Validation
**Description:** Using validation rules (like `regex:/^[a-zA-Z]+$/`) to enforce sanitization concerns.
**Why it happens:** Developers treat "clean input" as a validation concern.
**Consequences:** Valid input is rejected because it doesn't match a sanitization pattern; error messages are confusing.
**Better approach:** Validation ensures data meets requirements. Sanitization normalizes acceptable variations. Use both, but don't conflate them.
