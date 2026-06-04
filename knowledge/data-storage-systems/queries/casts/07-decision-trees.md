# 2-17 Casts - Decision Trees

## Native Cast vs Custom Cast vs Accessor

---

## Decision Context

Choosing between native casts, custom cast classes (CastsAttributes), and accessors for attribute transformation.

---

## Decision Criteria

* performance: native casts are fastest; custom casts add class loading
* architectural: custom casts reuse logic; accessors are model-specific
* maintainability: custom casts are testable in isolation

---

## Decision Tree

Need a non-standard attribute transformation?

↓

Does a native cast type exist for this transformation?

YES → Use native cast

    ↓
    boolean, integer, float, string, array, object, datetime, timestamp, encrypted
    
    `protected $casts = ['is_admin' => 'boolean']`

NO → Is the transformation reusable across models?

    YES → Custom cast (CastsAttributes interface)
    
        ↓
        ```php
        protected $casts = ['ssn' => App\Casts\EncryptedCast::class];
        ```
        
        ↓
        Reusable, testable
        For: encryption, custom JSON serialization, value objects
    
    NO → Model-specific transformation?
    
        YES → Accessor (simpler, model-specific)
            `public function getNameAttribute($value) { return strtoupper($value); }`

---

## Recommended Default

**Default:** Native cast → Accessor (single model) → Custom cast (reusable)
**Reason:** Choose the simplest option. Native casts are fastest. Custom casts add complexity.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Attribute Casting for Type Safety
