# Decision Trees — Exception Handling Testing

## Decision Tree 1: Reportable vs Non-Reportable Exceptions

```
Should this exception be reported to error monitoring?
│
├── Is this an application-level error (unexpected condition)?
│   └── YES → Should be REPORTED
│       Example: PaymentFailedException, OrderProcessingException
│       Test: `Exceptions::assertReported(PaymentFailedException::class)`
│       Also verify context data is included
│
├── Is this an expected client error (validation, 404, auth)?
│   └── YES → Should NOT be reported
│       Example: ValidationException, AuthenticationException, NotFoundHttpException
│       Test: `Exceptions::assertNotReported(ValidationException::class)`
│       These create noise in error monitoring
│
└── Is it unclear whether this should be reported?
    └── Default to reporting for application exceptions
        Default to NOT reporting for HTTP client errors (4xx)
        Document the decision in the exception class
```

## Decision Tree 2: Reporting vs Rendering Test

```
What aspect of exception handling needs verification?
│
├── Do you need to verify the exception reaches error monitoring?
│   └── Test REPORTING
│       1. `Exceptions::fake()`
│       2. Trigger the exception (HTTP request)
│       3. `Exceptions::assertReported(ExceptionClass::class)`
│       4. Optionally verify context: `fn($e) => $e->context['user_id'] === 1`
│
├── Do you need to verify the HTTP response the user sees?
│   └── Test RENDERING
│       1. Trigger the exception via HTTP request
│       2. `->assertStatus(402)` — correct status code
│       3. `->assertJson(['error' => 'Payment failed'])` — correct format
│
└── Both are needed for critical exceptions
    Write 2 separate tests: one for reporting, one for rendering
    They verify independent concerns
```

## Decision Tree 3: Sensitive Data Redaction

```
Does the exception context contain sensitive data?
│
├── YES — passwords, tokens, credit cards, PII
│   └── Verify redaction in tests
│       1. `Exceptions::fake()`
│       2. Trigger exception with sensitive input
│       3. `Exceptions::assertReported(fn($e) => !isset($e->context['password']))`
│       4. Also test: `!isset($e->context['credit_card'])`, `!isset($e->context['token'])`
│
├── NO — business data only (order_id, user_id, product_sku)
│   └── Still verify context is included and correct
│       `Exceptions::assertReported(fn($e) => $e->context['order_id'] === 123)`
│
└── Not sure? Check the exception handler's report() method
    Verify that `context()` or `report()` method calls `except()` on sensitive keys
```
