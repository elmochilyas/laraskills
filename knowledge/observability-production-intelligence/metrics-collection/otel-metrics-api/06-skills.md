```yaml
name: otel-metrics-instrumentation
description: >
  Guide an AI agent through instrumenting a Laravel application with
  OpenTelemetry Metrics API — selecting correct instrument types, adding
  attributes, naming metrics, and configuring export.
workflow:
  steps:
    - name: identify-metrics
      description: >
        Determine which application values need instrumentation. Look for:
        counters (incrementing values), gauges (current state), distributions
        (latency, size). List 5-10 candidate metrics with their type.

    - name: create-meter
      description: >
        Create a Meter instance from MeterProvider. Group by business domain.
        Example: `$ordersMeter = $meterProvider->getMeter('commerce.orders')`.

    - name: create-instruments
      description: >
        Instantiate the correct instrument types:
        - Counter: `$meter->createCounter('orders.created')`
        - UpDownCounter: `$meter->createUpDownCounter('queue.depth')`
        - Histogram: `$meter->createHistogram('order.processing.time')`
        Provides description and unit (seconds, bytes, count).

    - name: add-attributes
      description: >
        Add 2-4 categorical attributes per instrument. Examples: region,
        status, method, endpoint. Ensure each attribute has <100 unique values.
        Never use user IDs or dynamic values.

    - name: record-values
      description: >
        Call the appropriate method on each instrument:
        - Counter/UpDownCounter: `add($value, $attributes)`
        - Histogram: `record($value, $attributes)`
        - Observable: Register callback with `createObservableGauge`.

    - name: configure-export
      description: >
        Set up MetricReader with Delta temporality for Prometheus compatibility.
        Configure export interval (30-60s default). Attach to MeterProvider.
        Register MeterProvider globally.

    - name: verify-metrics
      description: >
        Check that metrics appear in the backend with correct names and values.
        Validate cardinality is within limits. Confirm alert queries return
        expected results.

  triggers:
    - User asks "how to add metrics to my Laravel app"
    - User asks "which OTel instrument should I use"
    - User provides a list of values they want to track numerically
```
