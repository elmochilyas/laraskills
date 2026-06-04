# Decision Trees: Controller Exception Handling

## Tree 1: Handle vs Re-throw Decision

```
What type of exception was thrown?
├── Domain exception (InsufficientInventoryException, DuplicateEmailException)
│   ├── Action can provide fallback/alternative → Handle with appropriate status code
│   └── Action cannot recover → Handle with error response. Don't re-throw.
├── Client error equivalent (ModelNotFoundException → 404, AuthorizationException → 403)
│   ├── Controller-specific response needed → Catch and format error envelope
│   └── Generic response sufficient → Let global handler manage it
├── Infrastructure exception (ConnectionException, TimeoutException)
│   ├── Recovery possible (retry) → Implement retry logic
│   └── Recovery not possible → Re-throw for global handler (500 response)
└── Programming error (TypeError, LogicException, ParseError)
    ├── Always re-throw → These should be visible to developers via global handler
    └── Never catch in controller → Bubbles to global handler automatically
```

## Tree 2: Log Level Selection

```
What is the HTTP status code mapped to this exception?
├── 4xx (client error) → Log as warning. Client-correctable issue.
├── 5xx (server error) → Log as error. Requires investigation.
├── 429 (rate limit) → Log as info. Expected behavior.
└── 409 (conflict) → Log as info. Business rule enforcement.
```

## Tree 3: Try-Catch Placement

```
Where does the exception originate?
├── Action class → Catch around the action call. Not around entire controller method.
├── External service call → Catch around the service call only. Not around other controller logic.
├── File/stream operation → Catch around the file operation only.
└── Complex operation with multiple failure points → Consider wrapping at action level instead of controller.
```
