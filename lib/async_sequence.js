var AsyncSequence = Sequence.inherit(function(parent, interval) {
  if (parent instanceof AsyncSequence) {
    throw "Sequence is already asynchronous!";
  }

  this.parent = parent;
  this.onNextCallback = getOnNextCallback(interval);
});

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
    if (typeof process !== "undefined" && typeof process.nextTick === "function") {
      return process.nextTick;
    }
    if (typeof context.setImmediate === "function") {
      return context.setImmediate;
    }
  }

  interval = interval || 0;
  return function(fn) {
    setTimeout(fn, interval);
  };
}
