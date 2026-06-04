# Decomposition: Exception Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Testing
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Unit Testing Exception Classes
- **Topics:** Testing custom exception construction, context data, message formatting
- **Key Content:** Asserting exception properties (message, code, context), edge cases (null context)
- **Learning Objectives:** Write unit tests that verify custom exception classes carry correct data

### Chunk 2: Testing Handler Behaviour
- **Topics:** Testing `report()` and `render()` methods on Handler, asserting callbacks fire
- **Key Content:** Testing reportable/renderable callbacks, `ExceptionHandler` facade/spy, asserting not reported
- **Learning Objectives:** Write tests that verify the Handler processes exceptions through the correct callbacks

### Chunk 3: Testing HTTP Error Responses
- **Topics:** Feature tests for 404/403/500 responses, JSON vs HTML content negotiation
- **Key Content:** `$response->assertStatus()`, asserting JSON error structure, custom error page content
- **Learning Objectives:** Write feature tests that assert full HTTP error responses including status, headers, and body

### Chunk 4: Testing Exception Logging and Reporting
- **Topics:** Testing that exceptions are logged, testing `Log` facade expectations, testing error service reporting
- **Key Content:** `Log::shouldReceive('error')`, `Http::fake()` for error services, asserting context data in logs
- **Learning Objectives:** Write tests that verify exceptions are logged/reported with the expected context data
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization