# 2-16 Accessors/Mutators - Decision Trees

## Accessor/Mutator vs Cast for Transformation

---

## Decision Context

Choosing between an accessor/mutator (method-based) and an attribute cast (declarative) for data transformation.

---

## Decision Criteria

* performance: casts are faster (no method call overhead per access)
* architectural: casts handle type conversion; accessors handle complex transforms
* maintainability: casts are simpler; accessors are more flexible

---

## Decision Tree

Need to transform a model attribute?

↓

Is it a simple type conversion (boolean, integer, datetime, JSON)?

YES → Use casts

    ↓
    `protected $casts = ['is_admin' => 'boolean', 'meta' => 'array']`
    
    ↓
    Simpler, more performant, less code

NO → Complex transformation (full name, computed values, formatting)?

    YES → Use accessor
        
        ↓
        `public function getNameAttribute($value): string { return ucfirst($value); }`
        
        ↓
        For writing: mutator
        `public function setNameAttribute($value): void { $this->attributes['name'] = trim($value); }`

---

## Recommended Default

**Default:** Casts for type conversion; accessors for computed/transformed values
**Reason:** Casts are simpler and faster. Accessors are for when casts can't express the logic.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Accessors and Mutators for Attribute Transformation
