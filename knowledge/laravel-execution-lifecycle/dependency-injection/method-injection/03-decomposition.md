# Decomposition: Method Injection

## Boundary Analysis
Method Injection covers the resolution and injection of dependencies into method parameters at call time, not construction time. Its boundary begins when `Container::call()` is invoked with a callable and ends when that callable is invoked with a complete argument list. It overlaps with Constructor Injection at the resolution step (both use `Container::make()` for class-typed parameters) but diverges in callable support, parameter override handling, and the lack of instantiation. It does **not** cover class construction, property injection, or setter injection.

## Atomicity Assessment
**Status:** 🔶 Fragments possible (3 fragments)

Method Injection can be decomposed into three largely independent concerns:

| # | Fragment | Boundary | Independence |
|---|----------|----------|-------------|
| 1 | **Callable Resolution** | Parsing `Class@method`, closures, invokables, arrays into a uniform reflection target | Can exist independently; validation of callable format |
| 2 | **Parameter Resolution** | Reflection-based parameter inspection, container resolution, explicit override merging | Sharable with Constructor Injection's resolution step |
| 3 | **Invocation** | Merging resolved args with callable, `call_user_func_array` | Trivially generic; no business logic |

Fragments 1 and 3 are thin wrappers over PHP primitives and do not warrant separate Knowledge Units. Fragment 2 is the core but is already covered in depth by **Auto-Resolution Strategy**. Therefore, Method Injection is best kept as a single KU despite theoretical decomposability.

## Dependency Graph
```
Container::call($callable, $parameters)
 └─ BoundMethod::call($container, $callable, $parameters)
     ├─ Callable Resolution
     │   ├─ is string 'Class@method' → parseCallable()
     │   ├─ is array [object, method] → use as-is
     │   └─ is closure → use as-is
     ├─ Parameter Resolution (loop)
     │   ├─ ReflectionFunctionAbstract::getParameters()
     │   ├─ Parameter name matches $parameters key? → use value
     │   ├─ Parameter has class type-hint? → Container::make()
     │   │   └─ recurses into Auto-Resolution Strategy
     │   ├─ Parameter is variadic with type? → resolve all tagged
     │   ├─ Parameter has default? → use default
     │   └─ Otherwise → BindingResolutionException
     ├─ Dependency Sorting (reorder resolved params to match signature)
     └─ call_user_func_array($callable, $resolved)
```

## Follow-up Opportunities
- Investigate whether controller method parameter resolution is cached in Laravel 11.x or higher, and quantify the per-request Reflection cost of method injection in a typical application with 50+ controller actions.
- Explore the feasibility of a compiled container that generates optimized dispatcher code for known callables, eliminating runtime Reflection for method injection.
- Document the exact behavior of variadic parameter resolution in method injection — does the container resolve all implementations bound to the variadic type, or does it require a tagged binding?
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization