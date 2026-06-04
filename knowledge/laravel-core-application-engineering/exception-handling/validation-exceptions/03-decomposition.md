# Decomposition: Validation Exceptions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Validation Exceptions
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: ValidationException Structure
- **Topics:** Error messages, error bag, input data, status code
- **Key Content:** `$exception->errors()`, `$exception->errorBag`, `$exception->getMessage()`, 422 status
- **Learning Objectives:** Describe the structure of `ValidationException` and access its components

### Chunk 2: Automatic Handling in Form Requests
- **Topics:** How FormRequest throws `ValidationException`, redirect vs JSON response
- **Key Content:** Failed validation redirects back with `$errors` (HTML) or returns 422 JSON (API)
- **Learning Objectives:** Explain how Laravel automatically handles validation exceptions from FormRequests

### Chunk 3: Manual Validation and Exception Handling
- **Topics:** `Validator::validate()` throwing `ValidationException`, custom error handling
- **Key Content:** Catching `ValidationException` in manual validation flows, custom error formatting
- **Learning Objectives:** Handle `ValidationException` from manual validator calls and customize the error format

### Chunk 4: Customizing Validation Error Responses
- **Topics:** Overriding `failedValidation()` on FormRequest, custom JSON structure, error bag selection
- **Key Content:** Custom error format (field => message vs nested), localization, API-specific error shapes
- **Learning Objectives:** Customize the validation error response format for different client expectations
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization