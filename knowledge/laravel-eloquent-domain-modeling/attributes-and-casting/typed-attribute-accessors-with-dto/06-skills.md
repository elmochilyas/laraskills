# Typed Attribute Accessors with DTOs — Skills

---

## Skill 1: Create a Typed Accessor Returning a DTO

### Purpose
Define an accessor that returns a rich Data Transfer Object (DTO) or typed value instead of a raw string or array, enabling type-safe property access and structured data.

### When To Use
- An attribute represents structured data (address, contact info, coordinates)
- The raw stored value is a JSON string or serialized payload
- You want typed property access instead of magic array keys

### When NOT To Use
- The attribute is a simple scalar (string, int, bool) — simple casting suffices
- The DTO adds overhead without value (performance-critical hot path)
- The attribute is never accessed with its properties individually

### Prerequisites
- DTO or typed value class defined
- Attribute stored in a JSON or serialized column

### Inputs
- Attribute name
- DTO class with typed properties
- Column storing the data

### Workflow

1. **Define the DTO** with typed, `readonly` properties:
   ```php
   class Address
   {
       public function __construct(
           public readonly string $line1,
           public readonly string $city,
           public readonly string $postalCode,
           public readonly ?string $line2 = null,
       ) {}
   }
   ```

2. **Create an accessor** that deserializes the stored value into the DTO:
   ```php
   protected function address(): Attribute
   {
       return Attribute::make(
           get: fn ($value, $attributes) => new Address(
               line1: $attributes['address_line1'],
               city: $attributes['address_city'],
               postalCode: $attributes['address_postal_code'],
               line2: $attributes['address_line2'] ?? null,
           ),
           shouldCache: true,
       );
   }
   ```

3. **Set up a mutator** to serialize the DTO back to database columns:
   ```php
   set: fn (Address $value) => [
       'address_line1' => $value->line1,
       'address_city' => $value->city,
       'address_postal_code' => $value->postalCode,
       'address_line2' => $value->line2,
   ],
   ```

4. **Add `shouldCache: true`** since DTO construction is typically expensive

5. **Type-hint the set closure** with the DTO class for IDE support

### Validation Checklist

- [ ] DTO has `readonly` properties or is otherwise immutable
- [ ] Accessor returns the DTO, not an array or null
- [ ] Mutator accepts the DTO and maps to database columns
- [ ] `shouldCache` is enabled for DTO construction
- [ ] Null stored values are handled (return null DTO or throw)
- [ ] DTO validation happens in the constructor

### Related Rules

| Rule | Reference |
|---|---|
| Use typed accessors for structured data | `05-rules.md` Rule 1 |
| Make DTOs immutable with readonly properties | `05-rules.md` Rule 2 |
| Cache DTO accessor results with shouldCache | `05-rules.md` Rule 3 |
| Mutator maps DTO back to flat columns | `05-rules.md` Rule 4 |
| Handle null stored values gracefully | `05-rules.md` Rule 5 |

### Success Criteria
- Model attribute returns a typed DTO with named properties
- DTO properties are accessible with IDE autocompletion
- Mutator serializes DTO back to database columns correctly
- Null stored values are handled without errors
