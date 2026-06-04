# Date/Time Casts — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Date/Time Casts |
| Focus | Anti-patterns in date/time casting configuration and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Mutable datetime Cast Instead of immutable_datetime | Reliability | High |
| 2 | Missing serializeDate Override | Design | Medium |
| 3 | Date-Only Columns Using datetime Cast | Reliability | Medium |
| 4 | Unnecessary Custom $dateFormat | Maintainability | High |
| 5 | Non-UTC Timestamp Storage | Design | Critical |
| 6 | Manual Carbon Parsing for Cast Attributes | Performance | Low |

## Repository-Wide Cross-Cutting Patterns

- Mutable `Carbon` vs `CarbonImmutable` is the most common date-related bug source in Laravel applications, with accidental mutation causing state corruption that is difficult to reproduce
- Date serialization inconsistency is a pervasive API quality issue — without a centralized `serializeDate()` override, each endpoint drifts into its own format
- UTC storage violations are hidden until the application expands across timezones, at which point fixing all historical data is painful

---

## 1. Mutable datetime Cast Instead of immutable_datetime

### Category
Reliability

### Description
Using `datetime` or `date` cast instead of `immutable_datetime` or `immutable_date`, returning mutable `Carbon` instances. Calling mutating methods like `->addDay()` on the attribute directly modifies the model's internal state without marking it dirty.

### Why It Happens
The mutable `datetime` cast is the default and has been the standard for years. Developers may not know about the immutable variants. Mutable Carbon works correctly in simple reads but causes bugs when dates are accidentally mutated.

### Warning Signs
- `$casts` uses `'datetime'` or `'date'` instead of `'immutable_datetime'` or `'immutable_date'`
- Accidental mutations: `$model->created_at->addDay()` changes the model's internal `created_at` without a `save()`
- Date values appearing shifted by a day or more in subsequent reads within the same request
- Team members reporting "dates that change by themselves"
- Debugging sessions tracing date changes to unrelated code paths

### Why Harmful
- `$model->created_at->addDay()` silently modifies the model's internal `$attributes['created_at']` without calling `$model->save()` or marking the model dirty
- The mutated date persists in memory for the rest of the request, affecting all subsequent consumers
- Shared model references propagate the mutated state — passing the model to a Blade partial or job may carry the wrong date
- Extremely difficult to debug: the mutation is in code that looks like it's just reading the date

### Consequences
- Date state corruption within a single request
- Stale or shifted dates in views, API responses, and queued jobs
- Hours of debugging time tracing accidental `->addDay()` or `->modify()` calls
- Data integrity issues when mutated dates are unintentionally persisted via later `->save()` after model tracking

### Preferred Alternative
```php
protected $casts = [
    'created_at' => 'immutable_datetime',
    'updated_at' => 'immutable_datetime',
    'birthday' => 'immutable_date:Y-m-d',
];
```

### Refactoring Strategy
1. Identify all models using `'datetime'` or `'date'` casts
2. Replace with `'immutable_datetime'` and `'immutable_date'` respectively
3. Audit code for `->addDay()`, `->modify()`, `->subMonth()` calls on date attributes — these must be updated to assign the return value
4. Run tests to verify date values serialize correctly after the change

### Detection Checklist
- [ ] Search for `'datetime'` and `'date'` in `$casts` arrays across all models
- [ ] Count models that use mutable date casts vs immutable
- [ ] Search for mutating Carbon method calls on model attributes (`->add`, `->sub`, `->modify`, `->setDate`)
- [ ] Verify the return type of mutable casts vs immutable in tests

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Prefer immutable_datetime Over datetime |
| Decision Tree | `07-decision-trees.md` — Mutable vs Immutable DateTime Casts |
| Skill | `06-skills.md` — Step 1: Use immutable variants |

---

## 2. Missing serializeDate Override

### Category
Design

### Description
Not overriding `serializeDate()` on the base model class, causing dates to be serialized in the default `Carbon` format (`2026-06-03T00:00:00.000000Z`) across API responses. Each API endpoint that needs a different format must manually format dates, leading to inconsistency.

### Why It Happens
The default ISO 8601 format is reasonable and works out of the box. Teams don't realize they need a centralized override until inconsistent formats accumulate across endpoints. Since each endpoint works individually, the inconsistency is only visible at the API level.

### Warning Signs
- API responses with multiple date formats (`Y-m-d`, `Y-m-d H:i:s`, `ISO 8601`, timestamps) from different endpoints
- Controllers and API resources repeatedly calling `->format()` on date attributes
- API documentation with multiple date format specifications
- Frontend teams reporting date parsing errors from inconsistent formats
- No `serializeDate()` method exists on any model or base class

### Why Harmful
- API consumers must handle multiple date formats, increasing integration complexity
- Breaking changes when a developer changes the format in one endpoint but not others
- Duplicated formatting code across controllers, API resources, and Blade templates
- Inconsistent frontend display dates based on which endpoint serves the data

### Consequences
- Hard-to-consume API with inconsistent date representations
- Higher maintenance burden from scattered date formatting code
- Breaking API changes when individual endpoints change their format
- Frontend date parsing bugs from unexpected format variations

### Preferred Alternative
```php
abstract class Model extends Authenticatable
{
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:sP');
    }
}
```

### Refactoring Strategy
1. Add `serializeDate()` override to the base model class
2. Choose a single date format for the entire API
3. Update all API resources and controllers to remove manual date formatting
4. Communicate the format change to API consumers

### Detection Checklist
- [ ] Search for `serializeDate` across the codebase — does it exist?
- [ ] Search for `->format(` calls on date attributes in controllers and API resources
- [ ] Compare date formats across different API endpoint responses
- [ ] Check if a base model class exists and if it overrides `serializeDate()`

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Override serializeDate for Consistent API Output |
| Decision Tree | `07-decision-trees.md` — Date Serialization Strategy |
| Skill | `06-skills.md` — Step 2: Override serializeDate() |

---

## 3. Date-Only Columns Using datetime Cast

### Category
Reliability

### Description
Using `immutable_datetime` or `datetime` cast for database columns that store date-only values (birthday, anniversary, start_date) without a time component. Timezone conversions on date-only values can shift the date unexpectedly.

### Why It Happens
Developers use `datetime` casts by default for all date-related columns without distinguishing between date and datetime types. The difference seems minor until timezone conversions cause date shifts.

### Warning Signs
- `$casts` uses `'immutable_datetime'` on attributes named `birthday`, `anniversary`, `start_date`, `end_date`
- Date values displaying a day earlier or later after timezone conversion
- Comparisons with date-only values including unexpected time components
- API responses showing date-only values with `T00:00:00.000000Z` time component

### Why Harmful
- Timezone conversions (UTC to user local) shift date-only values: a birthday stored as `2000-01-01` may display as `1999-12-31` in a negative UTC offset timezone
- Date arithmetic (diff, comparison) includes the time component, causing off-by-one errors
- API responses expose an unnecessary time component for date-only values, cluttering the response
- Comparisons with other date-only values are complicated by the hidden time component

### Consequences
- Incorrect date display: users see dates shifted by a day depending on their timezone
- Comparison bugs: `$model->birthday->isSameDay(Carbon::parse('2000-01-01'))` may fail depending on timezone
- API responses with unnecessary time information for date-only attributes
- Debugging time wasted on timezone-related date shifts

### Preferred Alternative
```php
protected $casts = [
    'birthday' => 'immutable_date:Y-m-d',
    'anniversary' => 'immutable_date:Y-m-d',
];
```

### Refactoring Strategy
1. Identify date-only columns cast as `datetime` or `immutable_datetime`
2. Switch to `immutable_date` (or `date` if mutability is somehow needed)
3. Add the date format parameter if the database uses a specific format
4. Update any code that relies on the time component being present

### Detection Checklist
- [ ] Cross-reference attribute names with column data types in migrations
- [ ] Search for `datetime` or `immutable_datetime` on attributes that are date-only columns
- [ ] Check for `T00:00:00` in serialized API responses for date-only attributes
- [ ] Test date-only values across different timezones

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use immutable_date for Date-Only Columns |
| Skill | `06-skills.md` — Step 3: Use immutable_date for date-only columns |
| Knowledge | `04-standardized-knowledge.md` — date vs datetime distinction |

---

## 4. Unnecessary Custom $dateFormat

### Category
Maintainability

### Description
Overriding `$dateFormat` on a model to use a non-standard datetime format without a legacy database requirement. The custom format breaks `toArray()`/`toJson()` serialization and Carbon parsing expectations.

### Why It Happens
Developers want to control the format at the model level and don't realize that `$dateFormat` affects storage format, not display format. The `serializeDate()` method is the correct place to control serialization format.

### Warning Signs
- `$dateFormat` overridden to a format like `'d/m/Y'` or `'m-d-Y'` on models without legacy databases
- `toArray()` or `toJson()` returning dates in unexpected formats or throwing errors
- Models with `$dateFormat` overriding the default with a display-oriented format
- Carbon parsing errors when the custom format doesn't match the database value
- Frontend teams reporting date parsing failures after a model's `$dateFormat` is changed

### Why Harmful
- `$dateFormat` changes how dates are stored and read from the database — it's a storage format, not a display format
- Overriding it with a non-standard format breaks Eloquent's default serialization, query building, and Carbon integration
- Different models with different `$dateFormat` values create inconsistent serialization across the application
- Changing `$dateFormat` after data exists requires a data migration

### Consequences
- Broken `toArray()`/`toJson()` serialization — dates may serialize as strings that Carbon cannot reparse
- Inconsistent date formats between models
- Painful migrations when a custom format must be changed
- Carbon parsing errors on attribute access
- Hidden coupling: query builder date comparisons may fail with non-standard formats

### Preferred Alternative
```php
// Use serializeDate() for display format, not $dateFormat
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d');
}
```

### Refactoring Strategy
1. Identify models with non-standard `$dateFormat` values
2. Revert `$dateFormat` to default
3. Add `serializeDate()` override for the desired display format
4. If legacy database requires a non-standard storage format, keep `$dateFormat` and document it clearly

### Detection Checklist
- [ ] Search for `$dateFormat` across all models
- [ ] Review each custom format — is it a storage format or a display format?
- [ ] Check `toArray()`/`toJson()` outputs for date format issues
- [ ] Verify Carbon parsing works correctly with the current format
- [ ] Assess if legacy database constraints justify the custom format

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Set $dateFormat Only When Required |
| Knowledge | `04-standardized-knowledge.md` — $dateFormat specifies storage format |

---

## 5. Non-UTC Timestamp Storage

### Category
Design

### Description
Storing timestamps in a non-UTC timezone in the database, causing DST-related bugs, cross-timezone comparison errors, and painful migrations when multi-timezone support is needed.

### Why It Happens
Applications serving a single timezone may default to local time. Developers use `now('America/New_York')` directly without understanding the implications. The application works within that timezone but breaks when expanded or when users travel.

### Warning Signs
- `now()` called with a non-UTC timezone parameter and stored directly
- Application configured to a non-UTC timezone in `config/app.php` timezone setting
- Timestamps in the database showing non-UTC values
- DST transition periods causing one-hour shifts in stored data
- Users in different timezones seeing different event dates for the same record

### Why Harmful
- DST transitions cause ambiguous or missing hours twice a year
- Cross-timezone comparisons are impossible: you can't reliably compare an EST timestamp with a PST timestamp
- Event ordering may be incorrect when sorting by timestamp across DST boundaries
- Expanding to multi-timezone support requires migrating all historical data to UTC
- Data exports and integrations with external systems assume UTC, requiring conversion

### Consequences
- Hard-to-debug comparison bugs during DST transitions
- Inability to accurately sort events across users in different timezones
- Painful data migration when UTC conversion is required
- Integration bugs with external systems that expect UTC
- Compliance issues for applications requiring auditable, unambiguous timestamps

### Preferred Alternative
```php
// Laravel defaults to UTC — use now() without timezone parameter
$user->last_login_at = now();
$user->save();

// Convert to user timezone only at display layer
$user->last_login_at->setTimezone($request->user()->timezone);
```

### Refactoring Strategy
1. Configure `config/app.php` timezone to `'UTC'`
2. Identify all places that store timestamps with non-UTC timezone
3. Convert stored non-UTC timestamps to UTC via migration
4. Update all presentation-layer code to convert to display timezone
5. Add timezone attribute to user model for personalization

### Detection Checklist
- [ ] Check `config/app.php` timezone setting
- [ ] Search for `now(`, `Carbon::now(` with non-UTC timezones in model code
- [ ] Examine database timestamps for non-UTC values
- [ ] Profile DST transitions for potential date gaps
- [ ] Review external integrations for timestamp format assumptions

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Store All Timestamps in UTC |
| Skill | `06-skills.md` — Step 4: Store in UTC |
| Knowledge | `04-standardized-knowledge.md` — Store in UTC, display in user's timezone |

---

## 6. Manual Carbon Parsing for Cast Attributes

### Category
Performance

### Description
Manually calling `Carbon::parse()` on an attribute that is already cast to a Carbon instance via date/time casts. This creates unnecessary Carbon instances, wasting CPU cycles and potentially introducing timezone inconsistencies.

### Why It Happens
Developers may not trust or know about the automatic casting. Legacy code predates the cast definition. Copy-pasted code patterns from non-cast attributes.

### Warning Signs
- `Carbon::parse($model->date_attribute)` where `$model->date_attribute` is already a Carbon instance
- `new Carbon($model->created_at)` in controllers or views
- `$model->date_attribute->format(...)` mixed with `Carbon::parse($model->date_attribute)`
- Debug toolbar showing double Carbon instantiation for the same attribute

### Why Harmful
- Creates a second Carbon instance from an already-parsed Carbon instance
- If timezone information is lost or changed in the round-trip (Carbon → string → Carbon), dates may shift
- Wasted CPU cycles — Carbon parsing is fast but unnecessary
- Code confusion: the cast already provides a Carbon instance, the manual parse suggests otherwise

### Consequences
- Unnecessary Carbon instantiation (minor performance waste)
- Potential timezone inconsistency if the parsed string doesn't carry the correct timezone
- Code that is harder to read — suggests the attribute is not cast when it is
- Double work: the cast already returns Carbon, the manual parse parses it again

### Preferred Alternative
```php
// The cast already returns Carbon — use it directly
$formatted = $model->created_at->format('Y-m-d');
```

### Refactoring Strategy
1. Search for `Carbon::parse(` where the argument is a model attribute
2. Remove the `Carbon::parse()` wrapper — the cast already returns Carbon
3. If a fresh Carbon instance is needed for safety, document why

### Detection Checklist
- [ ] Search for `Carbon::parse($model->` or `Carbon::parse($this->` across controllers, views, and services
- [ ] Cross-reference with model `$casts` to confirm the attribute is already cast
- [ ] Check for timezone round-trip issues when parsing cast attributes
- [ ] Verify the attribute returns Carbon-compatible type from the cast

### Related
| Reference | Link |
|---|---|
| Knowledge | `04-standardized-knowledge.md` — Casts return Carbon instances automatically |
| Skill | `06-skills.md` — Validation checklist: No manual Carbon::parse() for cast attributes |
