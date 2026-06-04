# Decision Trees: Exception Rendering

## Tree 1: Where To Define Error Response

```
Can you modify the exception class?
├── YES (custom exception) → Define render() method on the exception class
├── NO (third-party or framework exception)
│   ├── Single exception type needs custom rendering → renderable() callback
│   └── Multiple exception types → renderable() with type check or pattern matching
└── Framework exception with acceptable default → No custom rendering needed
```

## Tree 2: Error Response Detail Level

```
What environment is the application running in?
├── local/development → Full detail: stack trace, exception class, file path, line number
├── staging → Moderate detail: exception class, message. No file paths.
└── production → Minimal detail: error code, generic message. Log full details.
```

## Tree 3: Content Negotiation

```
What content type does the request expect?
├── application/json → JSON error envelope. Status code based on exception type.
├── application/vnd.api+json → JSON:API error format if applicable.
├── text/html or */* → HTML error page (web routes) or JSON (API routes)
└── No Accept header → Default to JSON for API routes, HTML for web routes.
```
