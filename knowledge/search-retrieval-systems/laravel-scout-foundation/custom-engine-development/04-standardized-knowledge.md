| Metadata | |
|---|---|
| KU ID | K014 |
| Subdomain | dedicated-search-appliances |
| Topic | Custom Engine Development |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout allows developers to create custom search engines by extending the `Laravel\Scout\Engines\Engine` abstract class. This enables integration with any search backend not natively supported — Elasticsearch, OpenSearch, ClickHouse, Amazon Kendra, or internal proprietary search systems. A custom engine must implement eight required methods covering indexing, deletion, searching, and model mapping.

## Core Concepts

- **Engine Abstract Class**: `Laravel\Scout\Engines\Engine` defines the contract with eight abstract methods.
- **Eight Required Methods**: `update`, `delete`, `search`, `paginate`, `map`, `mapIds`, `getTotalCount`, `flush`.
- **Registration**: Use `Scout::extend()` in a service provider's `boot()` method.
- **Full Scout Compatibility**: Once registered, all Scout features (queuing, pagination, where clauses) work automatically.

## When To Use

- Integration with a search backend not supported by Scout's built-in engines
- Internal proprietary search systems
- Multi-engine federation (router engine delegates by query type)
- Elasticsearch, OpenSearch, or Amazon Kendra integration

## When NOT To Use

- A community package already exists for your backend
- You only need simple customization via the callback/closure API
- The backend can be integrated through existing Scout engine configuration
- Team lacks resources to maintain a custom implementation long-term

## Best Practices

1. **Thoroughly test all engine methods**: `map()` and `mapIds()` are especially error-prone.
2. **Implement graceful degradation**: Return empty results on engine failure rather than throwing exceptions.
3. **Monitor custom engine metrics**: Track latency, error rates, and throughput.
4. **Use queue integration**: Custom engines benefit from Scout's async indexing.
5. **Document engine behavior**: Ensure team members understand the custom implementation.

## Architecture Guidelines

- Extend `Laravel\Scout\Engines\Engine` and implement all abstract methods.
- Register via `Scout::extend()` in `AppServiceProvider` or a dedicated service provider.
- Use Laravel's HTTP client for REST-based backends.
- Leverage Scout's existing pagination, filtering, and queue infrastructure.

## Performance Considerations

- Custom engines have direct control over performance — potentially faster than generic adapters.
- Network latency to the custom backend is the primary bottleneck.
- Batch index operations via `update` should be chunked to avoid memory issues.
- Connection pooling reduces per-request overhead for remote backends.

## Security Considerations

- API keys and credentials for the custom backend must be stored in `.env`, not hardcoded.
- Validate and sanitize user input before sending to the custom backend.
- Implement rate limiting if the backend has usage constraints.
- Ensure TLS for all network communication with the custom backend.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Incorrect map() implementation | Misunderstanding output format | Model hydration errors | Test with known data |
| Missing engine-specific pagination | Assuming all backends support deep pagination | Runtime errors | Check backend limits |
| Building from scratch unnecessarily | Unaware of community packages | Wasted effort | Check Packagist first |
| Not handling network errors | Assumption backend always available | 500 errors | Implement fallback logic |

## Anti-Patterns

- **Rewriting existing community packages**: Check Packagist before building a custom engine.
- **Tight coupling to backend specifics**: Use the Engine contract as abstraction boundary.
- **Ignoring Scout conventions**: Follow Scout's expected return types and data structures.

## Examples

```php
class ElasticsearchEngine extends Engine
{
    public function update($models)
    {
        // Send models to Elasticsearch bulk API
    }

    public function search(Builder $builder, $options = [])
    {
        // Query Elasticsearch and return raw results
    }

    public function map($results, $models)
    {
        // Map raw results back to Eloquent models
    }

    public function paginate(Builder $builder, $perPage, $page)
    {
        // Handle pagination through the custom backend
    }

    // Implement remaining 5 methods: delete, mapIds, getTotalCount, flush
}
```

```php
// Registration
// In AppServiceProvider::boot()
Scout::extend('elasticsearch', function ($app) {
    return new ElasticsearchEngine(
        $app->make(Client::class)
    );
});
```

## Related Topics

- K001 (Searchable trait)
- K013 (Customizing engine searches)
- K023 (Meilisearch driver setup)
- K018 (Algolia driver setup)

## AI Agent Notes

- The Engine class contract has remained stable across major Scout versions.
- `Scout::extend()` was introduced in Scout v7.
- Community packages exist for Elasticsearch and OpenSearch.
- For agents: prefer community packages over building from scratch. Only build custom engines for truly unsupported backends.

## Verification

- [ ] All 8 Engine methods implemented correctly
- [ ] map() returns correct Eloquent collection
- [ ] Graceful degradation on backend failure
- [ ] Pagination works end-to-end
- [ ] Queue integration functional
- [ ] Network error handling tested
- [ ] Documentation written for team
