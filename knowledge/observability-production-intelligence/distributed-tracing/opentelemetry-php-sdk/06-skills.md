# Skill: Configure and Use OpenTelemetry PHP SDK in Laravel

## Purpose
Configure the OpenTelemetry PHP SDK for Laravel applications to generate traces, metrics, and logs using a vendor-neutral API.

## When To Use
- Production Laravel applications requiring distributed tracing
- Multi-service architectures needing cross-service trace correlation
- Teams adopting vendor-neutral observability strategy

## Prerequisites
- PHP 8.1+ with gRPC or protobuf extension for OTLP exporter
- OpenTelemetry Collector or compatible backend

## Workflow
1. Install packages: `composer require open-telemetry/opentelemetry-php open-telemetry/exporter-otlp`
2. Configure environment: `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_SAMPLER`
3. Initialize TracerProvider in service provider with `BatchSpanProcessor` and `OtlpExporter`
4. Create custom spans for business-critical operations with meaningful attributes
5. Register shutdown handler to flush pending spans
6. Verify traces appear in backend

## Validation Checklist
- [ ] BatchSpanProcessor configured (not Simple)
- [ ] Shutdown handler registered
- [ ] Sampling configured via TraceIdRatioSampler
- [ ] Low-cardinality span attributes only
- [ ] Traces visible in backend
- [ ] SDK initialization once, not per-request
