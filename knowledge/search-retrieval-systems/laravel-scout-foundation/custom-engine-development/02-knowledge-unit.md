# Knowledge Unit: Custom Engine Development

## Metadata

- **ID:** K014
- **Subdomain:** Dedicated Search Appliances
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Extend Scout to any backend

## Executive Summary

Scout allows developers to create custom search engines by extending the `Laravel\Scout\Engines\Engine` abstract class. This enables integration with any search backend not natively supported — Elasticsearch, OpenSearch, ClickHouse, Amazon Kendra, or internal proprietary search systems. A custom engine must implement eight required methods covering indexing, deletion, searching, and model mapping.

## Core Concepts

- **Engine Abstract Class**: `Laravel\Scout\Engines\Engine` defines the contract.
- **Eight Required Methods**: `update`, `delete`, `search`, `paginate`, `map`, `mapIds`, `getTotalCount`, `flush`.
- **Laravel Service Container**: Register the engine via a service provider's `boot()` method using `Scout::extend()`.
- **Full Access to Scout Features**: Once registered, all Scout features (queuing, pagination, where clauses) work automatically.

## Internal Mechanics

The custom engine receives raw searchable arrays from Scout, sends them to the backend, and returns results in Scout's expected format. The `search()` method receives the query string and callback closure. The `map()` method receives raw search results and returns an Eloquent collection. Scout handles model hydration, pagination, and filtering automatically.

## Patterns

- **Elasticsearch adapter**: Query Elasticsearch via the official PHP client, implement the engine contract.
- **Internal API wrapper**: Proxy searches to an internal microservice.
- **Multi-engine federation**: Implement a router engine that delegates to different backends based on query type.
- **Read-model search**: Use a dedicated database read replica with full-text search capabilities.

## Architectural Decisions

Scout's `Engine` abstract class provides enough abstraction to support any backend while leaving engine-specific optimizations to implementors. The `Scout::extend()` registration pattern follows Laravel's service container conventions.

## Tradeoffs

- Full control over search behavior, but responsible for all edge cases and error handling.
- All Scout features work automatically, but engine-specific features require custom code via the callback API.
- Easy to start, hard to perfect — implementing all engine features comprehensively is significant work.

## Performance Considerations

- Custom engines have direct control over search performance — can be faster than generic adapters.
- Network latency to the custom backend is the primary bottleneck.
- Batch index operations (via `update`) should be chunked to avoid memory issues.

## Production Considerations

- **Thoroughly test edge cases**: Empty results, engine errors, network timeouts, malformed responses.
- **Implement proper error handling**: Return empty results on engine failure rather than throwing exceptions.
- **Monitor custom engine metrics**: Track latency, error rates, and throughput.
- **Consider queuing**: Custom engines benefit from Scout's queue integration for async indexing.
- **Document engine behavior**: Team members need to understand the custom implementation.

## Common Mistakes

- Not implementing all engine methods correctly — `map()` and `mapIds()` especially.
- Forgetting to handle engine-specific pagination limits (some backends cap page depth).
- Not returning results in Scout's expected format — causes model hydration errors.
- Building a custom engine when a community package already exists.

## Failure Modes

- **Engine connection failure**: If the backend is unreachable, search returns error 500. Implement graceful degradation.
- **Inconsistent behavior**: The custom engine's relevance algorithm may differ from Scout users' expectations.
- **Maintenance burden**: Upgrading Scout may require updating the custom engine if the abstract class changes.

## Ecosystem Usage

Used by teams that need search backends not supported by Scout's built-in engines. Community packages exist for Elasticsearch, OpenSearch, and Amazon Kendra.

## Related Knowledge Units

- K001 (Searchable trait)
- K013 (Customizing engine searches)

## Research Notes

Source: Laravel Scout docs. The Engine class contract has remained stable across major Scout versions. The `Scout::extend()` method was introduced in Scout v7. Most teams prefer community packages over building custom engines from scratch.


## Mental Models

- **Adapter Pattern**: Custom engine development follows the adapter pattern. Scout defines the interface; your engine implements it. The application never knows which engine is behind the facade.
- **Translator Role**: Your custom engine is a translator between Scout's standardized search API and your backend's native protocol. All complexity lives in the translation layer.

