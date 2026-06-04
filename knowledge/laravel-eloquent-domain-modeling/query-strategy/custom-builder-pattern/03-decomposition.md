# Decomposition: Custom Builder Pattern

## Knowledge Unit Breakdown

### 1. Builder Registration
- 1.1 `HasBuilder` trait (Laravel 10+)
- 1.2 `$builder` static property definition
- 1.3 `newEloquentBuilder()` override pattern (pre-Laravel 10)
- 1.4 Fallback to base Builder if not registered

### 2. Custom Builder Class Structure
- 2.1 Extending `Illuminate\Database\Eloquent\Builder`
- 2.2 Constructor signature and parent call
- 2.3 Custom method definitions
- 2.4 Return type `: static` for chaining
- 2.5 Accessing the model via `$this->model`

### 3. Method Design Patterns
- 3.1 Single-constraint methods (one WHERE clause)
- 3.2 Composite methods (multiple constraints)
- 3.3 Parameterized query methods
- 3.4 Methods with relationships (whereHas, with)
- 3.5 Methods that add joins or subqueries
- 3.6 Fluent setter methods for builder configuration

### 4. IDE Integration
- 4.1 `@mixin` annotation on model class
- 4.2 `@method` annotations for individual methods
- 4.3 Laravel Idea plugin support
- 4.4 Static analysis compatibility

### 5. Scope Migration Strategy
- 5.1 Identifying scope candidates for migration
- 5.2 Moving scope methods to builder
- 5.3 Maintaining backward compatibility
- 5.4 Deprecating model scope methods

### 6. Builder Composition
- 6.1 Custom methods calling other custom methods
- 6.2 Custom methods with standard builder methods
- 6.3 Base builder for shared logic across models
- 6.4 Trait-based builder method sharing

### 7. Testing Custom Builders
- 7.1 Unit testing builder methods
- 7.2 SQL assertion testing
- 7.3 Integration testing with database
- 7.4 Testing method composition

### 8. Advanced Patterns
- 8.1 Builder with constructor injection (services)
- 8.2 Builder with configuration state
- 8.3 Builder macro system integration
- 8.4 Builder with result transformation
- 8.5 Builder with caching layer

### 9. Comparison with Alternatives
- 9.1 Local scopes on model
- 9.2 Query Object pattern (standalone classes)
- 9.3 Repository pattern
- 9.4 `Builder::macro()` approach
- 9.5 When to choose each

### 10. Migration from Scopes to Custom Builder
- 10.1 Assessment criteria (scope count, complexity)
- 10.2 Step-by-step migration plan
- 10.3 Testing during migration
- 10.4 Rolling back if needed
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization