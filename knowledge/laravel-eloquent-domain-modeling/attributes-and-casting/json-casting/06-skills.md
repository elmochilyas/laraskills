# JSON Casting — Skills

---

## Skill 1: Cast a JSON Column to an Array or Collection

### Purpose
Configure an Eloquent model attribute stored as a JSON database column to cast to a PHP array or Collection on read, and serialize back to JSON on save.

### When To Use
- The column type is `json`, `jsonb`, or equivalent in your database
- The attribute holds structured data (settings, metadata, config)
- The attribute is read/written as a PHP array or Collection

### When NOT To Use
- The JSON structure is complex or validated (use a value object cast instead)
- The attribute is read-only (use accessor with `$casts['key' => 'json']` for write too)
- You need per-property validation or type safety (use a custom cast)

### Prerequisites
- Database column declared as `json` or `jsonb` in migration
- Understanding of the `array` and `collection` cast types

### Inputs
- Attribute name
- Desired PHP type (array or Collection)

### Workflow

1. **Add to `$casts`** with `'array'`, `'collection'`, or `'json'`:
   ```php
   protected $casts = [
       'metadata' => 'array',
       'tags' => 'collection',
       'raw_json' => 'json',
   ];
   ```

2. **Choose the right type**:
   - `'array'` — associative array (modify key-by-key, save whole array)
   - `'collection'` — `Illuminate\Support\Collection` instance
   - `'json'` — stays as raw JSON string (no auto-encoding on write?)

3. **In the `set()` method**, accept both arrays and Collections:
   ```php
   public function setAttribute($key, $value)
   {
       if ($key === 'metadata' && $value instanceof Collection) {
           $value = $value->toArray();
       }
       return parent::setAttribute($key, $value);
   }
   ```

4. **Handle null** — the cast returns an empty array/collection for null JSON values

5. **Avoid modifying the returned array in-place** — treat as immutable or reassign:
   ```php
   $settings = $model->metadata;
   $settings['theme'] = 'dark';
   $model->metadata = $settings; // reassign to persist
   ```

### Validation Checklist

- [ ] Database column is `json` or `jsonb` type
- [ ] Cast type matches the intended PHP representation (array vs collection)
- [ ] Null column values are handled (empty array/collection on read)
- [ ] Consumers reassign modified values (not just mutate in-place)
- [ ] JSON key presence is checked before access (avoid undefined key errors)

### Related Rules

| Rule | Reference |
|---|---|
| Cast JSON as array by default | `05-rules.md` Rule 1 |
| Prefer collection for array operations | `05-rules.md` Rule 2 |
| Reassign modified JSON attributes, don't mutate in-place | `05-rules.md` Rule 3 |
| Handle null JSON columns gracefully | `05-rules.md` Rule 4 |
| Validate JSON shape at domain boundaries | `05-rules.md` Rule 5 |

### Success Criteria
- JSON column reads as array or Collection from the model
- Modifications are persisted by reassigning and saving
- Null JSON columns return empty array/Collection instead of null
- Model serializes correctly to JSON (including the array/collection attribute)
