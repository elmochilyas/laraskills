# Decision Trees: Action Class Logic

## Tree 1: Action vs Service vs Direct Controller Logic

```
How complex is the operation?
├── 1-3 lines, simple Eloquent create/update → Keep in controller. No abstraction needed.
├── 3-10 lines, business logic involved → Create action class.
│   ├── Called from single entry point (HTTP only) → Action class in App\Actions
│   └── Called from multiple entry points (HTTP + CLI + Queue) → Action class with interface
├── 10+ lines, multiple related operations → Consider service class instead of multiple actions.
│   ├── Operations are distinct → Multiple action classes
│   └── Operations share state/methods → Service class
└── Conditional logic branching → Action class with strategy pattern or pipeline
```

## Tree 2: Parameter Design

```
How many input parameters does the action need?
├── 1-3 parameters → Individual typed parameters. Simple and explicit.
├── 4-7 parameters → Create a DTO. Group related parameters.
├── 8+ parameters → Reconsider action design. May be doing too much.
│   ├── Parameters are naturally grouped → Nested DTOs
│   └── Parameters are unrelated → Split into multiple actions
└── Optional parameters with defaults → DTO with nullable/default properties
```

## Tree 3: Transaction Scope

```
Does the action modify multiple database records?
├── YES, multiple models → Wrap entire operation in DB::transaction()
├── YES, but reads only → No transaction needed
├── NO, single model → No transaction needed for simple create/update
└── NO, but external API calls involved → Transaction + compensating action on failure
```
