# Skill: Adopt Community OTel Packages for Laravel

## Purpose
Use community packages (keepsuit/laravel-opentelemetry, overtrue/laravel-open-telemetry) to quickly set up OpenTelemetry observability with Laravel-native configuration patterns.

## When To Use
- Teams new to OpenTelemetry wanting a simplified setup
- Rapid prototyping where quick OTel adoption is needed
- Projects where community package features cover 80% of needs

## When NOT To Use
- Advanced SDK customizations required
- Production-critical systems where upstream release lag is unacceptable
- Teams already comfortable with raw OTel SDK

## Prerequisites
- PHP OpenTelemetry extension installed
- OTel backend or collector available

## Inputs
- OTel endpoint (collector URL or vendor API)
- Service name and environment
- Sampling rate for traces

## Workflow
1. Install the community package via Composer
2. Publish the config file and set service name, endpoint, sampler type
3. Register the service provider in bootstrap/app.php
4. Configure .env with OTEL_SERVICE_NAME and OTEL_EXPORTER_OTLP_ENDPOINT
5. Verify spans appear in the OTel backend
6. Extend the service provider if custom span processors are needed

## Validation Checklist
- [ ] Spans appear in OTel backend within 60 seconds
- [ ] Service name matches configured value
- [ ] Sampling rate applied correctly

## Common Failures
- Package version incompatible with OTel SDK version — check composer.json constraints
- Config not published — running with defaults that don't match environment
- Missing env vars — exporter silently falls back to console

## Decision Points
- Community package vs raw SDK vs official auto-instrumentation?
- Start with package and migrate to raw SDK as needs grow?

## Performance Considerations
- Community packages add minimal overhead over raw SDK
- Sampling rate is the primary cost control

## Security Considerations
- OTel endpoint should use HTTPS in production
- API keys for vendor backends stored in .env, not config files

## Related Skills
- Configure OpenTelemetry Auto-Instrumentation
- Harden OTel Collector for Production

## Success Criteria
- OTel traces flowing from Laravel to backend
- Configuration follows Laravel conventions
- Easy path to migrate to raw SDK if needed
