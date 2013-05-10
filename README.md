Like underscore.js, but with lazy evaluation.

Here's an example:

```javascript
var array = [];
for (var i = 1; i <= 1000; ++i) {
  array.push(i);
}

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

This library is experimental and still a work in progress.
