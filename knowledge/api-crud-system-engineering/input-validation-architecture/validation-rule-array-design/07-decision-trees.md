# Decision Trees: Validation Rule Array Design

## Tree 1: Array vs Flat Validation

```
Is the input an array of items?
├── YES, array of scalars (tags, IDs) → Array rules: parent has `array`, `min`, `max`. Children use `*` wildcard.
├── YES, array of objects (order items, addresses) → Array rules: parent has `array`, `min`, `max`. Children use `*.field` wildcards.
├── YES, nested arrays within objects (order.items.variants) → Multi-level wildcards: `items.*.variants.*.sku`. Max 3 levels.
├── YES, but each item has different validation logic → Manual loop with per-item Validator::make(). Wildcards can't handle per-item differences.
└── NO, flat input only → Standard flat rules. No wildcards needed.
```

## Tree 2: Wildcard Depth Decision

```
How many levels deep is the array structure?
├── 1 level (items.*.field) → Simple wildcard. Easy to read and maintain.
├── 2 levels (items.*.variants.*.field) → Manageable. Use distinct wildcards per level.
├── 3 levels (org.*.dept.*.team.*.field) → Maximum recommended. Readable with clear structure.
├── 4+ levels → TOO DEEP. Restructure payload or validate in service layer with manual loops.
└── Mixed (some 2-level, some 3-level within same payload) → Acceptable. Ensure consistent naming.
```

## Tree 3: Uniqueness Strategy

```
Do array elements need to be unique?
├── YES, scalar values only → Use `distinct` rule on the wildcard field.
├── YES, object property (e.g., all titles must be unique) → Use after() hook. Compare plucked values.
├── YES, composite uniqueness (product_id + warehouse_id unique) → Use after() hook. Track seen combinations.
├── YES, unique across multiple arrays in same payload → Use after() hook. Compare across arrays.
└── NO, duplicates allowed → No uniqueness validation needed. Simplify.
```

## Tree 4: Conditional Rules Within Arrays

```
Do array element rules depend on values of other fields?
├── YES, standard `required_if` on sibling field → Use full wildcard path: `required_if:items.*.type,product`.
├── YES, complex cross-field condition → Use after() hook with per-element condition evaluation.
├── YES, condition depends on parent/ancestor value → Specify full path from root. Include all wildcards.
├── YES, condition depends on multiple fields → Use after() hook. Evaluate all conditions together.
└── NO, all elements have the same rules → Standard wildcard rules. No conditionals needed.
```

## Tree 5: Error Message Customization

```
Are the default wildcard error messages clear to consumers?
├── YES, "The tags.*.distinct field has a duplicate." → MUST override. Wildcard paths are cryptic.
├── YES, but field names are internal → Override with field-specific messages using messages() method.
├── NO, default messages are acceptable → Accept defaults, but still consider overriding for clarity.
├── NO, custom format required (JSON:API pointers) → Convert wildcard paths to JSON pointer format in custom formatter.
└── PARTIALLY, some fields need custom messages → Override only the confusing wildcard messages. Leave clear ones.
```
