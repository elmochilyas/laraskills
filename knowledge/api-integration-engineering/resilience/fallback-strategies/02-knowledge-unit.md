# Metadata
Domain: API Integration Engineering
Subdomain: Resilience & Reliability Patterns
Knowledge Unit: Fallback Strategies for API Failures
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Fallback strategies define alternative behavior when an API call fails after exhausting retries or is blocked by circuit breaker. Fallbacks include serving stale cache, switching to a backup provider, returning partial data, or queuing the operation for later retry.

## Core Concepts
This knowledge unit covers the essential patterns, practices, and implementation details for this topic within the API Integration Engineering domain.

## Mental Models
- **Abstraction Layer**: Think of this as a protective boundary between your application and external systems
- **Defense in Depth**: Combine multiple patterns for robust integration reliability

## Internal Mechanics
Implementation details depend on the specific Laravel packages, Guzzle configuration, and PHP runtime characteristics applicable to this topic.

## Patterns
- Standard implementation patterns as documented in Laravel ecosystem best practices
- Provider-specific adaptations where applicable

## Architectural Decisions
- Choose the right level of abstraction for your use case
- Balance simplicity with robustness based on integration criticality

## Tradeoffs
- Simplicity vs robustness
- Performance vs reliability guarantees

## Performance Considerations
Consider the latency, throughput, and resource implications of your chosen approach.

## Production Considerations
Monitor, alert, and maintain your integration with appropriate operational practices.

## Common Mistakes
Review common pitfalls documented in community sources and provider documentation.

## Failure Modes
Understand how this integration pattern can fail and design appropriate mitigations.

## Ecosystem Usage
This pattern is used across the Laravel ecosystem in combination with related knowledge units.

## Related Knowledge Units
- K001, K004, K005, K007

## Research Notes
Based on domain analysis of API Integration Engineering best practices in the Laravel ecosystem.