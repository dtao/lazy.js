Lazy.js
=======

Like underscore.js, but <strike>better</strike> different
---------------------------------------------------------

First and foremost, **lazy.js** is like [underscore.js](http://underscorejs.org/)&mdash;essentially
a library with a lot of useful functions for dealing with collections, arrays, and objects&mdash;but
with some important differences.

Let's look at some code.

```javascript
// We'll be using this array in the examples that follow.
var array = [];
for (var i = 1; i <= 1000; ++i) {
  array.push(i);
}
```

### Lazy evaluation

```javascript
function square(x) { return x * x; }
function inc(x) { return x + 1; }
function isEven(x) { return x % 2 === 0; }

/* With underscore.js, this query creates lots of extra arrays:
 * - map(square): an extra 1000-element array
 * - map(inc): another 1000-element array
 * - filter(isEven): another 500-element array
 */
_.chain(array).map(square).map(inc).filter(isEven).take(5).value();

/* With lazy.js, only ONE array is actually created. In fact, only ten elements in the source array
 * are ever iterated, because that's all it takes to get five results.
 */
Lazy(array).map(square).map(inc).filter(isEven).take(5).toArray();
```

### Arbitrary sequence generation

```javascript
/* Unlike underscore.js, lazy.js also provides the ability to generate arbitrary sequences which can
 * be treated just like arrays for the purpose of mapping, filtering, etc.
 */
var powersOfTwo = Lazy.generate(function(i) { return Math.pow(2, i); });

/* Output:
 * 2
 * 3
 * 5
 * 9
 * 17
 * 33
 * 65
 * 129
 * 257
 * 513
 */
powersOfTwo
  .map(inc)
  .take(10)
  .each(function(n) {
    console.log(n);
  });
```

### Available Functions

It shouldn't take long for lazy.js to reach functional parity with underscore.js. Currently the
following functions are available:

- `map`
- `reduce` (aka `inject` or `foldl`)
- `reduceRight` (aka `foldr`)
- `filter`
- `reject`
- `find`
- `first` (aka `head` or `take`)
- `rest` (aka `tail` or `drop`)
- `last`
- `sortBy`
- `uniq`
- `every` (aka `all`)
- `some` (aka `any`)
- `indexOf`
- `contains`
- `min`
- `max`

This library is experimental and still a work in progress.
