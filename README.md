Like underscore.js, but lazier
==============================

If [underscore.js](http://underscorejs.org/) is "the tie to go along with [jQuery](http://jquery.com/)'s tux," then **lazy.js** is your friend with the brilliant advice: "Don't put the tie on now; just stuff it in your pocket and put it on when we get there."

The primary differentiator that distinguishes lazy.js from underscore.js is **lazy evaluation**, which directly translates to superior performance in many cases. Here's a teaser based on some common operations using arrays with 100 elements each on Chrome:

![lazy.js versus underscore](http://dtao.github.io/lazy.js/lib/LazyVsUnderscore.png)

Now let's look at a little bit of code. (For the following snippets, let's say `array` contains the integers from 1 to 1000.)

Lazy evaluation
---------------

```javascript
function square(x) { return x * x; }
function inc(x) { return x + 1; }
function isEven(x) { return x % 2 === 0; }

/* With underscore.js, this query creates lots of extra arrays:
 * - map(square): an extra 1000-element array
 * - map(inc): another 1000-element array
 * - filter(isEven): another 500-element array
 * - take(5): all that just for 5 elements!
 */
_.chain(array).map(square).map(inc).filter(isEven).take(5).value();

/* With lazy.js, only ONE array is actually created. In fact, only ten elements in the source array
 * are ever iterated, because that's all it takes to get the first five results.
 */
Lazy(array).map(square).map(inc).filter(isEven).take(5).toArray();
```

Arbitrary sequence generation
-----------------------------

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

Available functions
-------------------

Currently the following functions are available:

- `map`
- `pluck`
- `reduce` (aka `inject` or `foldl`)
- `reduceRight` (aka `foldr`)
- `filter`
- `reject`
- `where`
- `invoke`
- `find`
- `findWhere`
- `first` (aka `head` or `take`)
- `rest` (aka `tail` or `drop`)
- `initial`
- `last`
- `sortBy`
- `groupBy`
- `countBy`
- `uniq`
- `zip`
- `without`
- `difference`
- `union`
- `intersection`
- `flatten`
- `compact`
- `shuffle`
- `every` (aka `all`)
- `some` (aka `any`)
- `indexOf`
- `contains`
- `min`
- `max`

This library is experimental and still a work in progress.
