/**
 * An `AsyncSequence` iterates over its elements asynchronously when
 * {@link #each} is called.
 *
 * Returning values
 * ----------------
 *
 * Because of its asynchronous nature, an `AsyncSequence` cannot be used in the
 * same way as other sequences for functions that return values directly (e.g.,
 * `reduce`, `max`, `any`, even `toArray`).
 *
 * The plan is to eventually implement all of these methods differently for
 * `AsyncSequence`: instead of returning values, they will accept a callback and
 * pass a result to the callback once iteration has been completed (or an error
 * is raised). But that isn't done yet.
 *
 * Defining custom asynchronous sequences
 * --------------------------------------
 *
 * There are plenty of ways to define an asynchronous sequence. Here's one.
 *
 * 1. First, implement an {@link Iterator}. This is an object whose prototype
 *    has the methods {@link Iterator#moveNext} (which returns a `boolean`) and
 *    {@link current} (which returns the current value).
 * 2. Next, create a simple wrapper that inherits from `AsyncSequence`, whose
 *    `getIterator` function returns an instance of the iterator type you just
 *    defined.
 *
 * The default implementation for {@link #each} on an `AsyncSequence` is to
 * create an iterator and then asynchronously call {@link Iterator#moveNext}
 * (using the most efficient mechanism for the platform) until the iterator
 * can't move ahead any more.
 *
 * @param {Sequence} parent A {@link Sequence} to wrap, to expose asynchronous
 *     iteration.
 * @param {number=} interval How many milliseconds should elapse between each
 *     element when iterating over this sequence. If this argument is omitted,
 *     asynchronous iteration will be executed as fast as possible.
 * @constructor
 */
function AsyncSequence(parent, interval) {
  if (parent instanceof AsyncSequence) {
    throw "Sequence is already asynchronous!";
  }

  this.parent = parent;
  this.onNextCallback = getOnNextCallback(interval);
}

AsyncSequence.prototype = new Sequence();

/**
 * An asynchronous version of {@link Sequence#each}.
 */
AsyncSequence.prototype.each = function(fn) {
  var iterator = this.parent.getIterator(),
      onNextCallback = this.onNextCallback;

  if (iterator.moveNext()) {
    onNextCallback(function iterate() {
      if (fn(iterator.current()) !== false && iterator.moveNext()) {
        onNextCallback(iterate);
      }
    });
  }
};

function getOnNextCallback(interval) {
  if (typeof interval === "undefined") {
    if (typeof context.setImmediate === "function") {
      return context.setImmediate;
    }
    if (typeof process !== "undefined" && typeof process.nextTick === "function") {
      return process.nextTick;
    }
  }

  interval = interval || 0;
  return function(fn) {
    setTimeout(fn, interval);
  };
}
