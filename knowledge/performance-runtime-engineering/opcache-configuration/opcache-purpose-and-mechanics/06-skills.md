# Skill: Explain OpCache Purpose, Architecture, and Throughput Impact

## Purpose

Develop a foundational understanding of OpCache's architecture (shared memory, hash table, op_array structures) and its 2-4x throughput impact, to guide configuration decisions.

## When To Use

- Onboarding team members to PHP performance optimization
- Building a business case for OpCache configuration investment
- Understanding how OpCache works before tuning it
- Documenting the architecture for operational reference

## When NOT To Use

- For deep configuration tuning (use the specific OpCache tuning skills instead)
- When the team already has strong understanding of OpCache internals
- For developers who just need OpCache enabled (refer to the configuration skills)

## Prerequisites

- Basic understanding of PHP request lifecycle
- Familiarity with PHP-FPM process model
- Access to a PHP application to demonstrate OpCache effect

## Inputs

- OpCache configuration documentation
- Throughput benchmark data (OpCache enabled vs disabled)
- PHP request lifecycle diagram

## Workflow (numbered steps)

1. Explain the PHP request lifecycle without OpCache: read file → lex → parse → AST → compile → execute (60-80% of CPU on compilation)
2. Explain with OpCache: first request compiles → stores in shared memory → subsequent requests fetch from memory → execute (0% compilation on hits)
3. Demonstrate the architecture: shared memory segment contains hash table (file → opcode mapping), op_array structures (compiled opcodes), interned strings table (deduplicated strings)
4. Show throughput impact: benchmark the application with OpCache disabled vs enabled — expect 2-4x improvement
5. Explain the 2-4x range: default settings provide 1.5-2x; tuned settings (proper memory sizing, validate_timestamps=0) provide 2-4x
6. Describe OpCache as the foundation for further optimizations: JIT reads from OpCache, preloading relies on OpCache
7. Document the OpCache architecture and expected impact for the team's reference

## Validation Checklist

- [ ] Lifecycle with and without OpCache understood
- [ ] Shared memory architecture (hash table, op_array, interned strings) explained
- [ ] Throughput impact demonstrated with before/after benchmark
- [ ] Foundation role for JIT and preloading explained
- [ ] Documentation created for team reference

## Common Failures

- **Over-emphasizing OpCache as a "cache"**: It eliminates compilation, not data access — the name "cache" understates its impact
- **Not demonstrating with benchmarks**: Developers may not believe 2-4x improvement without seeing the data
- **Confusing OpCache with data caching (Redis, Memcached)**: OpCache caches opcodes, not application data
- **Underestimating the impact of defaults**: Default settings still provide 1.5-2x — "default" is not a bad configuration

## Decision Points

- If audience is operations-focused: emphasize deployment invalidation, memory sizing, validate_timestamps
- If audience is development-focused: emphasize hit rate, JIT dependency, preloading
- If audience is management: emphasize zero-code-change 2-4x throughput improvement

## Performance Considerations

- OpCache without tuning: 1.5-2x throughput
- OpCache with tuning: 2-4x throughput
- validate_timestamps=0: 1-3% additional CPU savings
- Preloading adds: 1-3ms per request reduction
- JIT on top of OpCache adds: 0-95% for CPU-bound code

## Security Considerations

- OpCache is an internal PHP engine optimization — no security exposure
- Shared memory is isolated per PHP installation
- File cache (if enabled) must be secured

## Related Rules (from 05-rules.md)

- Enable OpCache First, Tune Later
- Never Disable OpCache for Debugging
- Configure OpCache Before JIT

## Related Skills

- OpCache Configuration Overview
- OpCache Memory Sizing
- Preloading Script Design Patterns
- JIT Concepts and Terminology

## Success Criteria

- OpCache architecture understood by the team
- Throughput impact demonstrated with benchmark data
- Foundation role for further optimizations (JIT, preloading) understood
- Documentation created for ongoing reference
