/**
 * An AsyncSequence iterates over its elements asynchronously when {@link #each}
 * is called.
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
