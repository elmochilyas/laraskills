# Anti-Patterns: W3C Trace Context Propagation

## AP-WTC-01: Manual traceparent Construction
Building `traceparent` via string interpolation. Breaks on spec updates, incorrect hex encoding, missing tracestate. Always use OTel propagator API.

## AP-WTC-02: No Queue Propagation
Queue job traces appear as separate traces unrelated to parent request. Serialize context into job payload explicitly.

## AP-WTC-03: Tracestate Modification
Stripping or modifying tracestate vendor entries. Breaks downstream vendor integrations. Forward tracestate unchanged.

## AP-WTC-04: No Inbound Header Validation
Using unvalidated traceparent values. Malformed headers propagate through entire system. Validate format, hex, and length before use.
