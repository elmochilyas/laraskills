# Anti-Patterns — Service vs Action Decision

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Service vs Action Decision |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Decision Paralysis | Medium | Medium | Team spends more time debating than implementing |
| Fat Service from the Start | High | Medium | Code review: service created with 10+ methods on day one |
| Anemic Action Library | Medium | High | Code review: 50+ actions that just call `Model::create()` |
| Dogmatic Adherence to One Pattern | High | Medium | Code review: action-only or service-only forces wrong pattern |
| Mixed Inconsistency | Medium | High | Code review: no consistent decision logic across codebase |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Service Named as Action | Class named `XxxService` that has one public method | Misleading name — should be an action, not a service |
| Action Named as Service | Class named `XxxAction` that has multiple public methods | Misleading name — should be a service, not an action |
| No Documented Framework | Team has no documented decision criteria for action vs service | Each developer decides differently; codebase is inconsistent |

---

## Anti-Pattern Details

### AP-SVA-01: Fat Service from the Start

**Description**: A service class is created with 10+ method stubs on day one because "we'll need them all eventually." Most of these methods are never implemented, or they remain empty pass-throughs for months. The service exists as a placeholder for functionality that may never materialize.

**Root Cause**: Predictive architecture. The developer designs the service interface based on anticipated future needs, not current requirements. YAGNI (You Ain't Gonna Need It) is violated.

**Impact**:
- Dead code: unused methods in the service
- Larger test files: tests must account for methods that don't exist yet
- Misleading API: the service promises functionality it doesn't deliver
- Wasted development time: 10 method stubs take time to create and maintain

**Detection**:
- Code review: service has methods that are not called anywhere in the codebase
- Code review: service methods have `throw new \BadMethodCallException('not implemented')` or just `return null`
- Metrics: 50%+ of service methods have zero callers

**Solution**:
- Start with actions for each discrete operation
- Only create a service when 3+ related operations share dependencies
- Add methods to the service only when the operation is actually needed
- Follow YAGNI: build what you need now, not what you anticipate

**Example**:
```php
// BEFORE: Fat service from the start
class UserService
{
    // 12 methods created on day one, 8 still not implemented after 6 months
    public function register(RegisterDto $dto): User { /* implemented */ }
    public function update(UpdateDto $dto): User { /* implemented */ }
    public function delete(int $id): void { /* implemented */ }
    public function suspend(int $id): void { throw new \BadMethodCallException(); }
    public function activate(int $id): void { throw new \BadMethodCallException(); }
    public function merge(int $sourceId, int $targetId): User { throw new \BadMethodCallException(); }
    public function exportCsv(): string { throw new \BadMethodCallException(); }
    public function importCsv(string $file): int { throw new \BadMethodCallException(); }
    // ... 4 more stubs
}

// AFTER: Actions first, service only when justified
// Actions: CreateUserAction, UpdateUserAction, DeleteUserAction
// No service yet — only 3 operations, may not share enough dependencies
```

---

### AP-SVA-02: Anemic Action Library

**Description**: The codebase has 50+ action classes, but every action is a one-line pass-through to `Model::create()` or `Model::update()` with no business logic. The actions exist because "the architecture requires actions for all operations," but none of them provide any value over direct Eloquent calls.

**Root Cause**: Dogmatic "always use actions" without considering whether each operation justifies the ceremony. Simple CRUD operations gain nothing from action indirection.

**Impact**:
- 50+ files with zero business logic — each is a ceremony-only wrapper
- Developers learn that actions are pointless — eroding trust in the architecture
- Genuinely useful actions are impossible to distinguish from anemic ones
- Tests must mock actions that do nothing

**Detection**:
- Code review: every action body is `return Model::create($dto->toArray())` or equivalent
- Code review: no action has conditionals, transformations, or decisions
- Metrics: 80%+ of actions have a single line of executable code

**Solution**:
- Skip the action layer for truly trivial operations (call `Model::create()` directly)
- Keep actions only for operations with business logic, conditionals, or side effects
- For the gray area between trivial and complex, accept the action as defensive architecture
- Evaluate whether an action "earns its existence" during code review

**Example**:
```php
// BEFORE: Anemic action library
class CreateTagAction
{
    public function execute(CreateTagDto $dto): Tag
    {
        return Tag::create($dto->toArray()); // one line, no logic
    }
}
class UpdateTagAction
{
    public function execute(UpdateTagDto $dto): Tag
    {
        $tag = Tag::findOrFail($dto->id);
        $tag->update($dto->toArray());
        return $tag;
    }
}
class DeleteTagAction
{
    public function execute(int $id): void
    {
        Tag::destroy($id);
    }
}
// Tag has no business logic — these actions add no value

// AFTER: Direct Eloquent for trivial operations
class TagController
{
    public function store(CreateTagRequest $request): JsonResponse
    {
        return response()->json(Tag::create($request->validated()), 201);
    }
}
```

---

### AP-SVA-03: Dogmatic Adherence to One Pattern

**Description**: The team mandates "always use actions" or "always use services" for every operation. When an operation has 5 related methods with shared dependencies, the action-only approach forces 5 separate action classes with duplicated dependencies. When an operation is a single discrete action, the service-only approach forces a service class with one method.

**Root Cause**: Architectural dogmatism. A senior developer or team lead mandates one pattern based on past experience, without considering that different operations have different needs.

**Impact**:
- Action-only: services with 8+ constructor dependencies (if you use actions like services)
- Service-only: "services" with one public method (should be actions)
- Either extreme forces developers to use the wrong pattern for certain operations
- Refactoring cost is higher because the team has to work around the wrong pattern

**Detection**:
- Code review: all operations use the same pattern regardless of operation characteristics
- Code review: action classes have 5+ public methods (an action used as a service)
- Code review: service classes have 1 public method (a service used as an action)

**Solution**:
- Use both patterns based on operation grouping and dependency sharing
- Default to actions for discrete operations; promote to services when shared dependencies emerge
- Document the decision framework: "1-2 ops → action, 3+ ops with shared deps → service"
- In code review, evaluate each new class based on its characteristics, not dogma

**Example**:
```php
// BEFORE: Dogmatic service-only
class TagService // should never have existed — Tag has no business logic
{
    public function create(CreateTagDto $dto): Tag { return Tag::create($dto->toArray()); }
    public function delete(int $id): void { Tag::destroy($id); }
}
class OrderService // should be split — Order has too many operations
{
    public function place(PlaceOrderDto $dto): Order { /* 20 lines */ }
    public function cancel(int $id): void { /* 15 lines */ }
    public function refund(int $id): void { /* 20 lines */ }
    public function ship(int $id): void { /* 10 lines */ }
    public function track(int $id): TrackingDto { /* 5 lines */ }
    // ... 10 more methods
}

// AFTER: Context-appropriate choice
// Tag: direct Eloquent (no action, no service — trivial CRUD)
// Order: actions for core operations, service if shared dependencies emerge
```

---

### AP-SVA-04: Mixed Inconsistency

**Description**: The codebase has no consistent decision logic for actions vs services. Some entities have actions, some have services, and some have both with unclear boundaries. New team members cannot predict where to find the logic for a given operation. The same operation might be an action in one controller and a service method in another.

**Root Cause**: The team never documented their decision framework. Each developer makes their own choice based on personal preference. The codebase evolves with multiple competing conventions.

**Impact**:
- Developers waste time searching for where logic lives
- Duplication: the same operation might exist as an action and a service method in different parts of the codebase
- Onboarding: new developers can't learn a consistent pattern to follow
- Code review lacks criteria to evaluate whether the choice is appropriate

**Detection**:
- Code review: some entities use actions, some use services, no apparent pattern
- Developer questions: "Should I use an action or service for this?" asked repeatedly
- Search: same business operation exists in both an action class and a service method

**Solution**:
- Document the team's action vs service decision framework
- Default to actions for all new operations; promote to services when justified
- Add a decision tree to the project's architecture guide
- In code review, reference the decision framework when evaluating new classes

**Example**:
```php
// Documented decision framework:
// 1. How many operations? 1-2 → action, 3+ → consider service
// 2. Share dependencies? Yes → service, No → actions
// 3. Called together? Yes → service, No → actions
// 4. Cross-cutting concerns? Yes → service, No → actions
// 5. Will it grow? Likely → start with action (easy to promote)
```
