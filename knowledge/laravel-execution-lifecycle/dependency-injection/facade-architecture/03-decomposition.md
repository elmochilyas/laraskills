# Decomposition: Facade Architecture

## Boundary Analysis
Facade Architecture covers the static proxy pattern from the base `Facade` class through to the autoloader and alias system. Its boundary begins when a static method call is made on a facade class (triggering `__callStatic`) and ends when the proxied method returns. It includes the alias loading mechanism (`AliasLoader`), the Real-Time Facade system, the facade faking system (`Facade::fake()`, `shouldReceive()`), and the `resolveFacadeInstance()` caching logic. It does **not** cover the underlying concrete service implementations — only the proxy layer.

## Atomicity Assessment
**Status:** 🔶 Fragments possible (3 fragments)

| # | Fragment | Boundary | Independence |
|---|----------|----------|-------------|
| 1 | **Static Proxy Core** | `Facade::__callStatic()`, `resolveFacadeInstance()`, `getFacadeRoot()`, `getFacadeAccessor()` | Can be analyzed independently; the core mechanism |
| 2 | **Alias Loading** | `AliasLoader::load()`, `class_alias()`, autoloader registration, `config/app.php aliases` | Fully decoupled from proxy logic; affects class loading only |
| 3 | **Facade Faking** | `Facade::fake()`, `swap()`, `shouldReceive()`, `spy()` | Independent testing concern; could operate on any swappable singleton |

Fragments 2 (Alias Loading) is thin — it calls `class_alias()` and has no independent depth. Fragment 3 (Faking) is a testing sub-system that mirrors the proxy target. Both are tightly tied to the proxy core and are best kept together for narrative completeness.

## Dependency Graph
```
Facade Static Call (e.g., Cache::get('key'))
 ├─ Autoloader check (is Facades\ Cache loaded?)
 │   ├─ Standard: class already loaded via composer autoload or alias
 │   └─ Real-Time: Facade autoloader intercepts Facades\ namespace
 │       └─ generates facade class via eval() or cached class
 ├─ __callStatic('get', ['key'])
 │   └─ Facade::getFacadeRoot()
 │       ├─ Facade::resolveFacadeInstance('cache')
 │       │   ├─ $resolvedInstance['cache']? → return cached
 │       │   └─ $app['cache'] → container resolve
 │       │       └─ returns actual CacheManager or Repository
 │       └─ return instance
 ├─ Multiple dispatch (shouldReceive active?) → Mockery
 └─ $instance->get('key') — actual method call
     └─ return result to caller

Alias Loading (independent path)
 └─ AliasLoader::load($alias)
     ├─ Check $aliases[$alias] → real class name
     └─ class_alias($realClass, $alias, $autoload = true)
         └─ registered as last autoloader via spl_autoload_register()
```

## Follow-up Opportunities
- Investigate the impact of Real-Time Facade `eval()` usage in production with enabled OpCache — does the generated facade class get cached by OpCache, or is it re-evaluated on every request?
- Benchmark facades vs. constructor injection for a high-throughput API endpoint (1000 req/s) to quantify the proxy overhead of the `__callStatic()` → `resolveFacadeInstance()` → method dispatch chain.
- Analyze Octane compatibility of facades in detail: which built-in facades require explicit `clearResolvedInstance()` between requests, and which are safe due to stateless underlying services?
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization