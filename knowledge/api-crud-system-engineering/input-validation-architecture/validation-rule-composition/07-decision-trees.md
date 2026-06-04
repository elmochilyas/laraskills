# Decision Trees: Validation Rule Composition

## Tree 1: Rule Definition Approach

```
How complex is this validation rule?
├── Simple (required, max, min, string) → Array syntax: ['required', 'string', 'max:255']
├── Database-dependent (unique, exists) → Rule object: Rule::unique('users')
├── Reusable across endpoints → Custom rule class: new ValidatedEmail()
├── Conditional on state → Rule::when($condition, $rules, $default)
└── Complex, non-reusable → Closure rule (but prefer class for testability)
```

## Tree 2: Reuse Strategy

```
Is this validation logic used...
├── In one Form Request, one field → Inline array syntax. No extraction needed.
├── In one Form Request, multiple fields → Extract to private method in Form Request.
├── In multiple Form Requests → Extract to custom rule class.
├── Across different projects → Package as Composer package.
└── In multiple contexts (API + CLI + internal) → Custom rule class + separate Form Request logic.
```

## Tree 3: Custom Rule vs Built-In

```
Does a built-in Laravel rule do what you need?
├── YES → Use built-in. Don't create custom rule for something built-in handles.
├── NO, but can compose built-in rules → Compose with array syntax. No custom rule needed.
├── NO, logic is unique → Custom rule class.
└── PARTIALLY → Use built-in + custom rule together in array.
```
