# Skill: Optimize Object Memory Usage in PHP

## Purpose

Reduce memory overhead from PHP objects by understanding zend_object structure, property storage, and efficient object design patterns.

## When To Use

- Profiling shows high memory usage from object instances
- Creating thousands of objects (DTOs, models, value objects) per request
- Optimizing Octane workers where object memory accumulates
- Working with large object graphs (ORM entities, nested structures)

## When NOT To Use

- For small numbers of objects (<100) where overhead is negligible
- When object operations are not a significant memory consumer
- For code paths executed once per request in PHP-FPM
- Without profiling to confirm objects are a significant memory consumer

## Prerequisites

- Understanding of zend_object structure and property storage
- Profiling showing object-related memory usage
- PHP 7.4+ runtime (typed properties reduce opcode count)

## Inputs

- Profiling data showing largest object allocations
- Object count per request/worker
- Property types and sizes
- Object graph depth and relationships

## Workflow (numbered steps)

1. Profile object memory usage: identify classes with the most instances or largest per-instance memory
2. For DTOs/value objects: use PHP 8.0+ constructor property promotion — reduces boilerplate and improves memory layout
3. Add typed properties to all objects — allows Zend Engine to optimize property storage
4. For objects with many optional properties: consider using a single array property instead of many nullable typed properties
5. For deeply nested object graphs: evaluate if all nesting is necessary — flattening reduces object count
6. For ORM entities: use lazy loading for related entities that are not always accessed
7. For long-running workers: explicitly unset() objects when no longer needed to allow GC
8. Benchmark memory before and after object optimizations
9. Document the memory-efficient object patterns

## Validation Checklist

- [ ] Largest object allocations identified
- [ ] Constructor property promotion applied (PHP 8.0+)
- [ ] Typed properties added to all property declarations
- [ ] Object graphs evaluated for unnecessary nesting
- [ ] ORM lazy loading configured
- [ ] unset() used for temporary objects in long-running workers
- [ ] Memory reduction measured
- [ ] Patterns documented

## Common Failures

- **Creating millions of short-lived objects**: Each object requires heap allocation + refcount setup + teardown — reuse objects or use value objects sparingly
- **Deep object graphs**: Deep navigation chains cause CPU and memory overhead from repeated dereferencing
- **Not using typed properties**: Untyped properties prevent Zend Engine from optimizing property access and storage
- **Ignoring SplObjectStorage**: Using arrays of objects instead of SplObjectStorage wastes memory on duplicated hash keys

## Decision Points

- DTO with <10 properties: use constructor promotion with typed properties
- DTO with >10 properties: still use constructor promotion — may indicate the class should be split
- Entity with optional relations: use lazy loading (proxy pattern)
- Object count per request <100: no optimization needed
- Object count per request >1000: investigate opportunities for object reuse or value objects
- Object count per request >10000: critical — redesign to reduce object instantiation

## Performance Considerations

- Object instantiation: ~100-500ns per simple object
- Typed property read: same as untyped (both require property lookup)
- zend_object overhead: 96-128 bytes plus property storage
- Constructor property promotion reduces constructor code by ~30%
- Lazy loading proxy: adds ~200ns per access but saves memory for unused properties

## Security Considerations

- Object memory optimization does not affect security directly
- Serialized objects in sessions increase memory — keep session data minimal
- Objects with sensitive data should be explicitly cleared after use

## Related Rules (from 05-rules.md)

- Prefer Scalar Types for Frequently-Accessed Data
- Use Typed Properties for Hot-Path DTOs
- Use SplObjectStorage for Object Collections

## Related Skills

- PHP Memory Model
- Efficient Data Structures
- Zval Structure and Reference Counting
- Array Memory Usage

## Success Criteria

- Object memory usage reduced by 15-30% on targeted classes
- Typed properties and constructor promotion applied consistently
- Object graphs flattened where appropriate
- Memory reduction measured and documented
