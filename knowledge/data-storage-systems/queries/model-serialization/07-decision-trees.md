# 2-18 Model Serialization - Decision Trees

## $hidden/$visible vs API Resources

---

## Decision Context

Choosing between model-level serialization control ($hidden/$visible/$appends) and dedicated API Resource classes for serialization.

---

## Decision Criteria

* performance: API Resources add overhead for simple cases
* architectural: API Resources are endpoint-specific; $hidden is model-global
* maintainability: API Resources provide per-endpoint control
* security: $hidden prevents accidental exposure; API Resources give explicit control

---

## Decision Tree

Controlling model serialization?

↓

Do different endpoints need different attribute sets?

YES → Use API Resources

    ↓
    ```php
    class UserResource extends JsonResource
    {
        public function toArray($request): array
        {
            return [
                'id' => $this->id,
                'name' => $this->name,
                // Admin endpoint includes email:
                'email' => $this->when($request->user()?->isAdmin(), $this->email),
            ];
        }
    }
    ```
    
    ↓
    Per-endpoint control
    Conditionally include attributes
    Transform nested resources

NO → Same attributes everywhere?

    YES → Use $hidden/$visible/$appends
        
        ↓
        `protected $hidden = ['password', 'api_token', 'ssn'];`
        
        ↓
        Global, applies to all serialization
        Simpler for consistent attribute sets
        Good for hiding sensitive data

---

## Recommended Default

**Default:** $hidden for security-sensitive global exclusions; API Resources for endpoint-specific serialization
**Reason:** Use both in combination. $hidden as safety net, Resources for fine-grained control.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Model Serialization and API Resources
