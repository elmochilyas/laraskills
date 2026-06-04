# Decision Trees: Form Request Validation Logic

## Tree 1: Form Request Per Endpoint

```
Does the endpoint create or update a resource?
├── Create → Store{Resource}Request. Different rules than update.
├── Update → Update{Resource}Request. May allow partial updates.
├── List → List{Resource}Request. Validate filter, sort, pagination params.
└── Delete → Delete{Resource}Request. Verify resource exists, user owns it.
```

## Tree 2: Conditional Rule Strategy

```
Does validation depend on...
├── Another field's value?
│   ├── Simple dependency → required_if, required_with, prohibited_if
│   └── Complex dependency → withValidator() with custom AfterValidationRule
├── The HTTP method?
│   ├── Required on create, optional on update → sometimes
│   └── Different rules per method → Separate Form Requests
├── Application state?
│   ├── Feature flag → Check in rules() with conditional return
│   └── User role/permission → Check in rules() or use Rule::when()
└── Resource existence or relationships?
    ├── Exists validation → Rule::exists('table', 'column')
    └── Unique on update → Rule::unique('table')->ignore($this->route('id'))
```

## Tree 3: Error Message Strategy

```
Should validation error messages be...
├── Static, same for all locales → Hardcoded in messages() method
├── Localized per language → Translation strings in resources/lang/
├── Custom per Form Request → messages() method with specific messages
└── Shared across all Form Requests → Custom validation.php language file
```
