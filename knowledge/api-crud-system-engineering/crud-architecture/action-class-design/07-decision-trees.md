# Decision Trees — Action Class Design

## Tree 1: Action vs Inline Logic

**Decision Context**: Whether to create an action class for a business operation or keep the logic inline in the controller or service.

**Decision Criteria**:
- Operation complexity (has business logic beyond a single Model::create call)
- Reuse potential (called from multiple entry points)
- Test independence requirement
- Transaction boundary need

**Decision Tree**:
```
Does the operation have business logic beyond a single Model::create()/update()?
├── YES → Create an action class — wrap in DB::transaction(), accept a DTO
└── NO → Is the operation reused from multiple entry points (HTTP, CLI, queue)?
    ├── YES → Create an action class for reuse
    └── NO → Is the operation a write that needs transactional safety?
        ├── YES → Create an action class with DB::transaction()
        └── NO → Keep inline (simple boolean toggle, simple lookup — no action needed)
```

**Rationale**: Actions earn their existence through business logic, reuse, or transactional boundaries. Trivial inline logic needs no separate class.

**Recommended Default**: Create an action for any write operation that has business logic.

**Risks**: Too many actions for trivial operations add ceremony. Too few actions lead to fat controllers and untestable business logic.

---

## Tree 2: Action Naming Convention

**Decision Context**: Choosing the naming convention for action classes — Verb+EntityAction format.

**Decision Criteria**:
- Operation type (create, update, delete, read)
- Entity name
- Team convention

**Decision Tree**:
```
Is the operation a standard CRUD operation?
├── YES → [Verb][Entity]Action: CreateUserAction, UpdateProductAction, DeleteOrderAction
│   Options: Create = create/store, Update = update, Delete = delete/remove, Read = find/get
└── NO → Is the operation a business process (not CRUD)?
    ├── YES → [Verb]EntityAction: RegisterUserAction, CancelOrderAction, ProcessRefundAction
    └── NO → Domain-specific verb: [BusinessVerb][Entity]Action (ArchiveUserAction, SuspendAccountAction)
```

**Rationale**: Consistent naming makes actions predictable — developers know where to find any operation.

**Recommended Default**: `[Verb][Entity]Action` — `CreateUserAction`, `UpdateProfileAction`, `DeleteOrderAction`

**Risks**: Inconsistent naming (mix of `CreateUser`, `UserCreator`, `StoreUser`) makes the codebase unpredictable.
