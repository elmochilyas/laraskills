# Anti-Patterns: Resource Collection

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Resource Collection

## Anti-Patterns

### Anonymous Collection with Custom Needs
Using `Resource::collection()` when you need custom collection-level metadata, forcing workarounds like appending metadata outside the resource. Metadata becomes scattered across controllers.

**Problem:** Scattered metadata logic; inconsistent application across endpoints.

**Solution:** Create a named `ResourceCollection` subclass for collections that need custom metadata.

### Missing $collects
Relying on convention-based naming in custom collection classes without setting `$collects` explicitly. The convention may resolve to the wrong resource class.

**Problem:** Silent resolution to wrong resource class; incorrect item serialization.

**Solution:** Always set `public string $collects = ItemResource::class;` explicitly in custom collection classes.

### Unpaginated Collections
Exposing unbounded data arrays via `Resource::collection(Model::all())`. The response grows indefinitely with the database.

**Problem:** Memory exhaustion; slow responses; unbounded response sizes.

**Solution:** Always paginate collection endpoints: `Resource::collection(Model::paginate())`.

### Per-Item Logic in Collection toArray()
Running item-level transformations at the collection level instead of in the item resource. Collection `toArray()` should only handle wrapping and metadata.

**Problem:** Duplication of item-level logic; collection class becomes bloated.

**Solution:** Put item-level transformations in the item resource class. Collection `toArray()` should focus on structure.

### Modifying $this->collection Inside toArray()
Modifying the `$this->collection` property inside `toArray()`. It represents the wrapped items — mutating it has side effects.

**Problem:** Side effects from mutation; unexpected behavior in subsequent operations.

**Solution:** Create a new collection or array for transformations instead of mutating `$this->collection`.

### Passing Plain Array Instead of Paginator
Passing a plain array to `Resource::collection()`. Resources expect `Collection` or `Paginator` instances — plain arrays cause method-not-found errors.

**Problem:** Runtime errors; broken collection serialization.

**Solution:** Wrap arrays in `collect()` before passing to `Resource::collection()`.
