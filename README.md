Like Underscore, but lazier
===========================

[![Build Status](https://travis-ci.org/dtao/lazy.js.png?branch=master)](https://travis-ci.org/dtao/lazy.js)
[![Bower version](https://badge.fury.io/bo/lazy.js.png)](http://badge.fury.io/bo/lazy.js)
[![NPM version](https://badge.fury.io/js/lazy.js.png)](http://badge.fury.io/js/lazy.js)

**Lazy.js** it a utility library for JavaScript, similar to [Underscore](http://underscorejs.org/) and [Lo-Dash](http://lodash.com/) but with one important difference: **lazy evaluation** (also known as deferred execution). This can translate to superior performance in many cases, *especially* when dealing with large arrays and/or "chaining" together multiple methods. For simple cases (`map`, `filter`, etc.) on small arrays, Lazy's performance should be similar to Underscore or Lo-Dash.

The following chart illustrates the performance of Lazy.js versus Underscore and Lo-Dash for several common operations using arrays with 10 elements each on Chrome:

![Lazy.js versus Underscore/Lo-Dash](http://i.imgur.com/9vP6sVG.png)

You can see that the performance difference becomes much more significant for methods that don't require iterating an entire collection (e.g., `indexOf`, `take`) as the arrays get larger:

![Lazy.js versus Underscore/Lo-Dash](http://i.imgur.com/oGPlPug.png)

Intrigued? Great! Lazy.js has no external dependencies, so you can get started right away with:

```html
<script type="text/javascript" src="lazy.js"></script>

<!-- optional: if you want support for DOM event and AJAX-based sequences: -->
<script type="text/javascript" src="lazy.browser.js"></script>
```

Or, if you're using Node.js:

```bash
npm install lazy.js
```

Now let's look at what you can do with Lazy.js. (For more thorough information, take a look at the [API Docs](http://dtao.github.io/lazy.js/docs/).)

Introduction
------------

We'll start with an array containing 1000 integers. Incidentally, generating such an array using Lazy.js is quite trivial:

```javascript
var array = Lazy.range(1000).toArray();
```

Note the `toArray` call; without it, what you'll get from `Lazy.range` won't be an actual *array* but rather a `Lazy.Sequence` object, which you can iterate over using `each`. But we'll get to that in a moment.

Now let's say we want to take the *squares* of each of these numbers, increment them, and then take the first five even results. We'll use these helper functions, to keep the code concise:

```javascript
function square(x) { return x * x; }
function inc(x) { return x + 1; }
function isEven(x) { return x % 2 === 0; }
```

Yes, this is admittedly a very arbitrary goal. (Later I'll get around to thinking of a more realistic scenario.) Anyway, here's one way you might accomplish it using Underscore and its convenient `chain` method:

```javascript
var result = _.chain(array).map(square).map(inc).filter(isEven).take(5).value();
```

This query does a lot of stuff:

- `map(square)`: iterates over the array and creates a new 1000-element array
- `map(inc)`: iterates over the new array, creating *another* new 1000-element array
- `filter(isEven)`: iterates over *that* array, creating yet *another* new (500-element) array
- `take(5)`: all that just for 5 elements!

So if performance and/or efficiency were a concern for you, you would probably *not* do things that way using Underscore. Instead, you'd likely go the procedural route:

```javascript
var results = [];
for (var i = 0; i < array.length; ++i) {
  var value = (array[i] * array[i]) + 1;
  if (value % 2 === 0) {
    results.push(value);
    if (results.length === 5) {
      break;
    }
  }
}
```

There&mdash;now we haven't created any extraneous arrays, and we did all of the work in one iteration. Any problems?

Well, yeah. The main problem is that this is one-off code, which isn't reusable and took a bit of time to write. If only we could somehow leverage the expressive power of Underscore but still get the performance of the hand-written procedural solution...

***

That's where Lazy.js comes in! Here's how we'd write the above query using Lazy.js:

```javascript
var result = Lazy(array).map(square).map(inc).filter(isEven).take(5);
```

Looks almost identical, right? That's the idea: Lazy.js aims to be completely familiar to experienced JavaScript devs. Every method from Underscore should have the same name and identical behavior in Lazy.js, except that instead of returning a fully-populated array on every call, it creates a *sequence* object with an `each` method.

What's important here is that **no iteration takes place until you call `each`**, and **no intermediate arrays are created**. Essentially Lazy.js combines all query operations into a sequence that behaves quite a bit like the procedural code we wrote a moment ago.

Of course, *unlike* the procedural approach, Lazy.js lets you keep your code clean and functional, and focus on buliding an application instead of optimizing array traversals.

Features
--------

OK, cool. What else can Lazy.js do?

### Indefinite sequence generation

The sequence-based paradigm of Lazy.js lets you do some pretty cool things that simply aren't possible with Underscore's array-based approach. One of these is the generation of **indefinite sequences**, which can go on forever, yet still support all of Lazy's built-in mapping and filtering capablities.

Want an example? Sure thing! Let's say we want 300 unique random numbers between 1 and 1000.

```javascript
var uniqueRandsFrom1To1000 = Lazy.generate(function() { return Math.random(); })
  .map(function(e) { return Math.floor(e * 1000) + 1; })
  .uniq()
  .take(300);

// Output: see for yourself!
uniqueRandsFrom1To1000.each(function(e) { console.log(e); });
```

Pretty neat. How about a slightly more advanced example? Let's use Lazy.js to make a [Fibonacci sequence](http://en.wikipedia.org/wiki/Fibonacci_number).

```javascript
var fibonacci = Lazy.generate(function() {
  var x = 1,
      y = 1;
  return function() {
    var prev = x;
    x = y;
    y += prev;
    return prev;
  };
}());

// Output: undefined
var length = fibonacci.length();

// Output: [2, 2, 3, 4, 6, 9, 14, 22, 35, 56]
var firstTenFibsPlusOne = fibonacci.map(inc).take(10).toArray();
```

OK, what else?

### Asynchronous iteration

You've probably [seen code snippets before](https://gist.github.com/dtao/2351944) that show how to iterate over an array asynchronously in JavaScript. But have you seen an example packed full of map-y, filter-y goodness like this?

```javascript
var asyncSequence = Lazy(array)
  .async(100) // specifies a 100-millisecond interval between each element
  .map(inc)
  .filter(isEven)
  .take(20);

// This function returns immediately and begins iterating over the sequence asynchronously.
asyncSequence.each(function(e) {
  console.log(new Date().getMilliseconds() + ": " + e);
});
```

All right... what else?

### Event sequences

With indefinite sequences, we saw that unlike Underscore and Lo-Dash, Lazy.js doesn't actually need an in-memory collection to iterate over. And asynchronous sequences demonstrate that it also doesn't need to do all its iteration at once.

Now here's a really cool combination of these two features: with a small extension to Lazy.js (lazy.browser.js, a separate file to include in browser-based environments), you can apply all of the power of Lazy.js to **handling DOM events**. In other words, Lazy.js lets you think of DOM events as a *sequence*&mdash;just like any other&mdash;and apply the usual `map`, `filter`, etc. functions on that sequence.

Here's an example. Let's say we want to handle all `mousemove` events on a given DOM element, and show their coordinates in one of two other DOM elements depending on location.

```javascript
// First we define our "sequence" of events.
var mouseEvents = Lazy(sourceElement).on("mousemove");

// Map the Event objects to their coordinates, relative to the element.
var coordinates = mouseEvents.map(function(e) {
  var elementRect = sourceElement.getBoundingClientRect();
  return [
    Math.floor(e.clientX - elementRect.left),
    Math.floor(e.clientY - elementRect.top)
  ];
});

// For mouse events on one side of the element, display the coordinates in one place.
coordinates
  .filter(function(pos) { return pos[0] < sourceElement.clientWidth / 2; })
  .each(function(pos) { displayCoordinates(leftElement, pos); });

// For those on the other side, display them in a different place.
coordinates
  .filter(function(pos) { return pos[0] > sourceElement.clientWidth / 2; })
  .each(function(pos) { displayCoordinates(rightElement, pos); });
```

Anything else? Of course!

### String processing

Now here's something you may not have even thought of: `String.match` and `String.split`. In JavaScript, each of these methods returns an *array* of substrings. If you think about it, this often means doing more work than necessary; but it's the quickest way (from a developer's standpoint) to get the job done.

For example, suppose you wanted the first five lines of a block of text. You could always do this:

```javascript
var firstFiveLines = text.split("\n").slice(0, 5);
```

But of course, this actually splits *the entire string* into every single line. If the string is very large, this is quite wasteful.

With Lazy.js, we don't need to split up an entire string just to treat it as a sequence of lines. We can get the same effect by wrapping the string with `Lazy` and calling `split`:

```javascript
var firstFiveLines = Lazy(text).split("\n").take(5);
```

This way we can read the first five lines of an arbitrarily large string (without pre-populating a huge array) and map/reduce on it just as with any other sequence.

Similarly with `String.match`: let's say we wanted to find the first 5 alphanumeric matches in a string. With Lazy.js, it's easy!

```javascript
var firstFiveWords = Lazy(text).match(/[a-z0-9]+/i).take(5);
```

Piece of cake.

### Stream processing

Lazy.js can wrap *streams* in Node.js as well.

Given any [`Readable Stream`](http://nodejs.org/api/stream.html#stream_class_stream_readable), you can wrap it with `Lazy` just as with arrays:

```javascript
Lazy(stream)
  .take(5) // Read just the first 5 chunks of data read into the buffer.
  .each(processData);
```

For convenience, specialized helper methods for dealing with either file streams or HTTP streams are also offered. (**Note: this API will probably change.**)

```javascript
// Read the first 5 lines from a file:
Lazy.readFile("path/to/file")
  .lines()
  .take(5)
  .each(doSomething);

// Read lines 5-10 from an HTTP response.
Lazy.makeHttpRequest("http://example.com")
  .lines()
  .drop(5)
  .take(5)
  .each(doSomething);
```

In each case, the elements in the sequence will be "chunks" of data most likely comprising multiple lines. The `lines()` method splits each chunk into lines (lazily, of course).

***

**This library is experimental and still a work in progress.**
