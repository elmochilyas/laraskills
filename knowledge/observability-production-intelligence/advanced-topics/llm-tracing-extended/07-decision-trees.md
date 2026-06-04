# Decision Trees: LLM Tracing with OpenTelemetry

## 1. Prompt Recording Strategy

Should full prompt content be recorded for debugging?
├── Yes, needed for debugging → Record as span events (NOT attributes)
│   ├── $span->addEvent('gen_ai.prompt', ['content' => $truncatedPrompt])
│   ├── Set max_length truncation (2KB recommended)
│   └── Implement PII redaction before recording
├── Yes, but only summaries → Record token count and model only
│   └── Skip prompt content entirely; record metadata
└── No (privacy/security risk) → Do not record prompt content
    └── Record only: tokens, model, latency, status

## 2. Sampling Rate for LLM Traces

How important is cost attribution accuracy?
├── Critical (budget management, chargeback) → Sample LLM traces at 100%
│   ├── Cost data unrecoverable if dropped
│   ├── Storage cost justified by cost attribution value
│   └── Separate LLM sampling from general traffic sampling
├── Important but budget-constrained → Sample at 50% minimum
│   └── Accept: some cost data loss; extrapolate totals
└── Not a priority → Same sampling rate as general traffic (10%)
    └── Accept: inaccurate cost dashboards; use API billing for totals

## 3. Streaming vs Non-Streaming Instrumentation

Is the LLM API call streaming the response?
├── Yes (streaming) → Measure both first-token latency and total completion time
│   ├── First-token latency: time from request to first stream chunk
│   ├── Total completion: time to last stream chunk
│   └── Use span events to log incremental token arrivals
├── No (single response) → Record total response time as span duration
│   └── No need for first-token latency tracking
└── Mixed → Handle both patterns in wrapper service; conditional instrumentation

## 4. Wrapper Service Design

How many different LLM calls are in the codebase?
├── Many (multiple features, providers) → Centralized wrapper service/class
│   ├── Single entry point for all LLM calls
│   ├── Consistent instrumentation: ALL calls get spans
│   ├── Consistent PII redaction, model recording, token tracking
│   └── Easy to add new LLM features with built-in observability
├── Few (1-2 specific calls) → Manual instrumentation in each call site
│   └── Acceptable for small codebase; risk of inconsistency
└── None yet → Implement wrapper from the start; plan for scale
