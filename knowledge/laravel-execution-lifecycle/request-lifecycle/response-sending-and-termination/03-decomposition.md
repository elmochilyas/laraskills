# Decomposition: Response Sending and Termination

## Boundary Analysis
This KU covers the entire post-`handle()` phase: `$response->send()` (header and content output, `fastcgi_finish_request()`), `$kernel->terminate()` (terminable middleware dispatch, Application terminate callbacks, `Terminating` event dispatch, duration lifecycle handler evaluation), and the interplay between these phases under FPM vs Octane. It excludes the middleware pipeline's construction (covered in Middleware Pipeline KU), the `RequestHandled` event details (covered in Lifecycle Events and Hooks KU), and PHP output buffering configuration (operational concern, not framework internals). Symfony Response internals (`BinaryFileResponse`, `StreamedResponse`, `JsonResponse`) are referenced but not detailed — they are HTTP response types, not lifecycle behavior.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Response sending and termination form a single conceptual phase: sending hands off to the client, termination handles post-send cleanup. These are two sub-steps of one architectural concern (post-handle lifecycle). The only plausible split would be "Terminable Middleware Internals," but terminable middleware is intrinsically tied to when `terminate()` is called relative to `send()`.

## Dependency Graph
```
Response Sending and Termination
├── HTTP Kernel Dispatch              (produces the response)
├── Middleware Pipeline               (terminable middleware origin)
├── Lifecycle Events and Hooks        (RequestHandled, Terminating)
├── Entry Point Mechanics             (calls send()+terminate())
└── Long-Running Process Architecture (Octane termination differences)
```

## Follow-up Opportunities
- "FastCGI Process Management" — The interaction between `fastcgi_finish_request()`, FPM process pool configuration (`pm.max_children`, `pm.process_idle_timeout`), and request queuing under high concurrency. This is cross-cutting with server operations but deeply affects termination behavior.
- "PHP Output Buffering Layers" — The chain of `ob_*` handlers, `zlib.output_compression`, FPM's `output_buffering`, and how `sendContent()` interacts with each layer. Relevant for streaming responses and large file downloads.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization