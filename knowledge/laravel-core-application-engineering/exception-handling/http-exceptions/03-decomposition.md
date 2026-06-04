# Decomposition: HTTP Exceptions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** HTTP Exceptions
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: Standard HTTP Exception Classes
- **Topics:** `NotFoundHttpException`, `AccessDeniedHttpException`, `UnauthorizedHttpException`, etc.
- **Key Content:** Symfony HTTP exception hierarchy, Laravel's `HttpException` base, status code mapping
- **Learning Objectives:** Identify and use the built-in HTTP exception classes for standard error codes

### Chunk 2: Throwing HTTP Exceptions
- **Topics:** `abort()` helper, `throw new NotFoundHttpException()`, `AbortException`
- **Key Content:** `abort(404)`, `abort(403, 'message')`, throwing in controllers/middleware
- **Learning Objectives:** Throw HTTP exceptions correctly using both `abort()` and direct instantiation

### Chunk 3: Custom HTTP Responses
- **Topics:** Custom response bodies, headers, and content type for HTTP errors
- **Key Content:** Returning custom JSON/HTML for 404/403/500 pages, per-exception-type customization
- **Learning Objectives:** Customize the response body, content type, and headers for HTTP error responses

### Chunk 4: Default Error Pages and Customization
- **Topics:** Laravel's default error Blade templates (`errors/`) , custom 404/403 Blade pages
- **Key Content:** Publishing error views, view variables, localization of error pages
- **Learning Objectives:** Create and customize Blade error pages for different HTTP status codes
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization