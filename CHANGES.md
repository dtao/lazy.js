Lazy.js Changelog
=================

This file includes at least a partial list of the major changes in each version.

v0.4.3
------

- added `push` and `unshift` to `ArrayLikeSequence` (#173)
- changed behavior of `min` and `max` to return `undefined` for empty sequences (#194)
- made `zip` and `intersection` communicative (#196 and #197)
- fixed bug w/ shuffling empty array returning `[undefined]` (#198)
- added support for non-string delimiters in `join` (#193)
- fixed bug w/ missing return value in full iteration of `groupBy` (#179)
- fixed bug w/ ignoring delimiter in `values().join` (#184)
- fixed behavior of `ObjectLikeSequence.keys` (#164)
- fixed broken `DomEventSequence.each` (#163)
- fixed handling of falsey values in `get` (#170)
- changed behavior of `ObjectLikeSequence.each` (see #165)

v0.4.2
------

- dropped support for node 0.8
- Lazy is now exposed as a UMD module
- added value transform function to `groupBy`/`indexBy` ([#97](https://github.com/dtao/lazy.js/pull/97))
- fixed biased implementation of `shuffle` (see [#142](https://github.com/dtao/lazy.js/pull/142))
- fixed bug where `split` couldn't be called on `StringSegments` (see [#123](https://github.com/dtao/lazy.js/pull/123))
- fixed `merge` to better handle arrays, dates, and other object types (see [#154](https://github.com/dtao/lazy.js/pull/154))

v0.4.0
------

- now `Lazy.AsyncHandle` implements the Promises/A+ specification! (see [#71](https://github.com/dtao/lazy.js/issues/71))
- made `Sequence#get` available to all sequences, not just `ArrayLikeSequence`s (see [#106](https://github.com/dtao/lazy.js/issues/106))
- made `ObjectLikeSequence#filter` return an `ObjectLikeSequence` (see [#75](https://github.com/dtao/lazy.js/issues/75))
- fixed issue with `Sequence#shuffle` always putting first element last ([#113](https://github.com/dtao/lazy.js/issues/106))
- fixed issue with `Sequence#join` skipping empty strings ([#115](https://github.com/dtao/lazy.js/issues/115))
- fixed issue with `Lazy.range` sometimes providing one value too few ([#119](https://github.com/dtao/lazy.js/issues/119))

v0.3.3 (abandoned)
------------------

- fixed `Sequence#groupBy` to work for async sequences (see [#72](https://github.com/dtao/lazy.js/pull/72))
- fixed `StreamLikeSequence#split` to split properly across chunks (see [#70](https://github.com/dtao/lazy.js/pull/70))
- changed `Sequence#filter` so it passes a simple incrementing index with each element (like Underscore/Lo-Dash)
- added `Lazy.clone` to create a shallow copy of an object or array
- added `Sequence#sort`, which can accept a 2-arity function for more customized sorting (see [#65](https://github.com/dtao/lazy.js/issues/65))
- both `Sequence#sort` and `Sequence#sortBy` now accept a `descending` argument
- added `Sequence#indexBy`

v0.3.2
------

- added `Sequence.createWrapper` (see http://stackoverflow.com/questions/20959394)
- added `Sequence#memoize` and `Sequence#none`
- fixed `Sequence#reject` to accept a string or object (like other methods involving predicates)
- fixed bug in `Sequence#all`
- `AsyncSequence#getIterator` now throws an error (see [#63](https://github.com/dtao/lazy.js/issues/63))

v0.3.1
------

- added `Sequence#apply` (see [#61](https://github.com/dtao/lazy.js/issues/61)) and `Sequence#size` (see [#56](https://github.com/dtao/lazy.js/issues/56))
- added `ObjectLikeSequence#merge` (see [#55](https://github.com/dtao/lazy.js/issues/55))
- added `Sequence#toStream` to create an actual `stream.Readable` in Node, to interact w/ stream-based libraries (see [#53](https://github.com/dtao/lazy.js/issues/53))

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
- added `Lazy(object).watch` to monitor changes to a property as a sequence (see [#49](https://github.com/dtao/lazy.js/issues/49))
- added `Sequence#chunk`, `Sequence#tap`, and `Sequence#ofType`
- deprecated `Lazy.events` in favor of `NodeSequence#on` (note: I should probably rename `NodeSequence` to `DOMSequence`)

v0.2.1
------

- reverted change to `Lazy()` helper function, added `Lazy.strict()` to provide the stricter form (see [#44](https://github.com/dtao/lazy.js/issues/44))
- added `Lazy.parseJSON` method along with demo (see **experimental/** folder)
- added `onComplete` to handle returned by `AsyncSequence#each`

v0.2.0
------

- updated `Lazy()` helper function to throw an error on `null` or `undefined`
- changed behavior of `Sequence.define` -- `init` no longer must accept `parent` as a first parameter (see [#45](https://github.com/dtao/lazy.js/issues/45))
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
