# Decomposition: Custom Exception Classes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Custom Exception Classes
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Domain-Specific Exception Design
- **Topics:** Named exception classes per domain concept, exception hierarchy, namespace strategy
- **Key Content:** `PaymentFailedException`, `InsufficientInventoryException` — naming conventions, inheritance from `\Exception`
- **Learning Objectives:** Design custom exception classes that precisely communicate domain error conditions

### Chunk 2: Carrying Contextual Data
- **Topics:** Exception properties (status code, errors, model IDs), constructor parameters, getter methods
- **Key Content:** Carrying the data needed for handling, logging, and user feedback; serialization of context
- **Learning Objectives:** Implement custom exceptions that carry structured context data for handlers and loggers

### Chunk 3: Report/Render Methods on Custom Exceptions
- **Topics:** Defining `report()` and `render()` directly on the exception class
- **Key Content:** Self-reporting/renderable exceptions, when to use method-on-exception vs Handler callbacks
- **Learning Objectives:** Implement exception-level report and render methods for self-contained error handling

### Chunk 4: Exception Hierarchy and Categorization
- **Topics:** Base exception per domain, abstract exception types, catch granularity
- **Key Content:** `BillingException` → `PaymentFailedException`, catching base vs specific types, semantic categorization
- **Learning Objectives:** Build an exception hierarchy that enables appropriate catch granularity across application layers
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization