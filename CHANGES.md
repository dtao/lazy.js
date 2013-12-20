Lazy.js Changelog
=================

This file includes at least a partial list of the major changes in each version.

v0.3.0
------

- now these methods on `AsyncSequence` return a promise-like `AsyncHandle`, allowing you to do something w/ the result once iteration is complete (using `onComplete`, which is aliased as `then`):
  - `reduce`
  - `min`
  - `max`
  - `sum`
  - `find`
  - `indexOf`
  - `contains`
  - `toArray`
  - `toObject`
  - `join`/`toString`
- added `Lazy(object).watch` to monitor changes to a property as a sequence (see #49)
- added `Sequence#chunk`, `Sequence#tap`, and `Sequence#ofType`
- deprecated `Lazy.events` in favor of `NodeSequence#on` (note: I should probably rename `NodeSequence` to `DOMSequence`)

v0.2.1
------

- reverted change to `Lazy()` helper function, added `Lazy.strict()` to provide the stricter form (see #44)
- added `Lazy.parseJSON` method along with demo (see **experimental/** folder)
- added `onComplete` to handle returned by `AsyncSequence#each`

v0.2.0
------

- updated `Lazy()` helper function to throw an error on `null` or `undefined`
- changed behavior of `Sequence.define` -- `init` no longer must accept `parent` as a first parameter (see #45)
- added `ArrayLikeSequence.define`, `ObjectLikeSequence.define`, and `StringLikeSequence.define`
- added `takeWhile`, `dropWhile`, and `consecutive`
- implemented many string-specific methods for `StringLikeSequence`:
  - `indexOf`, `lastIndexOf`, and `contains` (all accept a substring)
  - `startsWith` and `endsWith`
  - `reverse` (returns a `StringLikeSequence`)
  - `toUpperCase` and `toLowerCase`
  - `charCodeAt`
  - `substring`
- implemented array-specific methods for `ArrayLikeSequence`:
  - `pop`
  - `shift`
  - `slice`
- added support for supplying `pluck`-style callbacks (strings) to `map`, `filter`, `sortBy`, `groupBy`, `countBy`, `any`, and `all`
- now `groupBy` and `countBy` both return an `ObjectLikeSequence`
- added value selector callbacks to `min`, `max`, and `sum`
- fixed some cases where `each` did not pass along an index with each element
- fixed `map().async()`
- fixed handling of `NaN` in some cases
- added `Lazy.noop` and `Lazy.identity` convenience methods

v0.1.1
------

- `flatten` can now flatten inner sequences (not just arrays)
- added `Sequence#toString`
- significant perf improvements for `uniq`, `union`, `intersection`, `concat`, `zip`
- removed `Lazy.async` in favor of `Sequence#async`
- added Bower and Component support
- added `Lazy.readFile` and `Lazy.makeHttpRequest` (for Node)

v0.1.0
------

Initial release.
