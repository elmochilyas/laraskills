# Anti-Patterns: Dynamic Scopes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Dynamic Scopes

## Anti-Patterns

### Unvalidated Dynamic Dispatch
Using user input directly as a scope method name without whitelisting — e.g., `User::{$userInput}()`. This allows calling ANY public method on the Builder or Model class, including potentially dangerous ones.

**Problem:** Critical remote code execution vulnerability via arbitrary method invocation; data exfiltration through unexpected method calls; complete application compromise.

**Solution:** Always validate dynamic scope names against an explicit whitelist array before dispatching the call. Reject unknown scope names with a clear error.

### Scope as Catch-All
A single `scopeFilter()` with 8 parameters handling all filtering needs. This violates single responsibility and creates an untestable combinatorial nightmare.

**Problem:** Exponential testing requirements; difficulty understanding what each parameter does; high defect rates from parameter interaction.

**Solution:** Keep parameterized scopes to 3 parameters maximum. Extract scopes with more parameters into dedicated query objects or filter strategy classes.

### Hidden Dynamic Scopes
Applying dynamic scopes in a base model class or trait without documentation. Developers are unaware that scopes are being dynamically applied based on request state.

**Problem:** Invisible query behavior; confusion about why certain filters are applied; difficulty debugging unexpected results.

**Solution:** Document all dynamic scope application paths. Log which dynamic scopes are applied for auditing and debugging.

### N+1 Dynamic Calls
Calling `method_exists()` for each potential scope in a loop with 20+ scopes. This adds unnecessary overhead to every request.

**Problem:** Unnecessary method resolution overhead; slower filter application than necessary.

**Solution:** Use a pre-computed whitelist lookup instead of `method_exists()`. Cache the scope registry to skip reflection on every request.

### Magic Everywhere
Using dynamic dispatch for every query instead of explicit chaining. Dynamic method calls are invisible to static analysis, IDE navigation, and automated refactors.

**Problem:** Inability to safely rename scopes; missed usages during refactoring; reduced readability; increased maintenance cost.

**Solution:** Use explicit scope chaining for all business-logic queries. Restrict dynamic dispatch to generic infrastructure code (filter systems, admin panels, API query builders).

### Parameterized Scope Overload
Creating parameterized scopes with boolean flag parameters that toggle different behavior. Boolean parameters indicate the scope should be split into separate methods.

**Problem:** Confusing call sites like `User::scopeWithOptions($q, true, false, true)`; unclear what each boolean does.

**Solution:** Split into focused scopes. Compose at the call site: `User::active()->verified()->recent()`.
