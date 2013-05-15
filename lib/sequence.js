var Sequence = function(parent) {
  this.parent = parent;
};

Sequence.inherit = function(ctor) {
  ctor.prototype = new Sequence();
  return ctor;
};

Sequence.prototype.depth = function() {
  return this.parent ? this.parent.depth() + 1 : 0;
};

Sequence.prototype.log = function(msg) {
  console.log(indent(this.depth()) + msg);
};

Sequence.prototype.toArray = function() {
  var array = [];
  this.each(function(e) {
    array.push(e);
  });

  return array;
};

Sequence.prototype.toObject = function() {
  var object = {};
  this.each(function(e) {
    object[e[0]] = e[1];
  });

  return object;
};

Sequence.prototype.map = function(mapFn) {
  if (this.indexed) {
    return new IndexedMappedSequence(this, mapFn);
  } else {
    return new MappedSequence(this, mapFn);
  }
};

Sequence.prototype.pluck = function(propertyName) {
  return this.map(function(e) {
    return e[propertyName];
  });
};

Sequence.prototype.invoke = function(methodName) {
  return this.map(function(e) {
    return e[methodName]();
  });
};

Sequence.prototype.select =
Sequence.prototype.filter = function(filterFn) {
  if (this.indexed) {
    return new IndexedFilteredSequence(this, filterFn);
  } else {
    return new FilteredSequence(this, filterFn);
  }
};

Sequence.prototype.reject = function(rejectFn) {
  return this.filter(function(e) {
    return !rejectFn(e);
  });
};

Sequence.prototype.where = function(properties) {
  return this.filter(function(e) {
    for (var p in properties) {
      if (e[p] !== properties[p]) {
        return false;
      }
    }
    return true;
  });
};

Sequence.prototype.reverse = function() {
  if (this.indexed) {
    return new IndexedReversedSequence(this);
  } else {
    return new ReversedSequence(this);
  }
};

Sequence.prototype.first =
Sequence.prototype.head =
Sequence.prototype.take = function(count) {
  if (typeof count === "undefined") {
    return getFirst(this);
  }

  if (this.indexed) {
    return new IndexedTakeSequence(this, count);
  } else {
    return new TakeSequence(this, count);
  }
};

Sequence.prototype.initial = function(count) {
  if (typeof count === "undefined") {
    count = 1;
  }
  return this.take(this.length() - count);
};

Sequence.prototype.last = function(count) {
  if (typeof count === "undefined") {
    return this.reverse().first();
  }
  return this.reverse().take(count).reverse();
};

Sequence.prototype.findWhere = function(properties) {
  return this.where(properties).first();
};

Sequence.prototype.rest =
Sequence.prototype.tail =
Sequence.prototype.drop = function(count) {
  if (this.indexed) {
    return new IndexedDropSequence(this, count);
  } else {
    return new DropSequence(this, count);
  }
};

Sequence.prototype.sortBy = function(sortFn) {
  return new SortedSequence(this, sortFn);
};

Sequence.prototype.groupBy = function(keyFn) {
  return new GroupedSequence(this, keyFn);
};

Sequence.prototype.countBy = function(keyFn) {
  return new CountedSequence(this, keyFn);
};

Sequence.prototype.uniq = function() {
  return new UniqueSequence(this);
};

Sequence.prototype.zip = function() {
  return new ZippedSequence(this, Array.prototype.slice.call(arguments, 0));
};

Sequence.prototype.shuffle = function() {
  return new ShuffledSequence(this);
};

Sequence.prototype.flatten = function() {
  return new FlattenedSequence(this);
};

Sequence.prototype.compact = function() {
  return this.filter(function(e) { return !!e; });
};

Sequence.prototype.without =
Sequence.prototype.difference = function() {
  return new WithoutSequence(this, Array.prototype.slice.call(arguments, 0));
};

Sequence.prototype.union = function() {
  return new UnionSequence(this, Array.prototype.slice.call(arguments, 0));
};

Sequence.prototype.intersection = function() {
  return new IntersectionSequence(this, Array.prototype.slice.call(arguments, 0));
};

Sequence.prototype.every =
Sequence.prototype.all = function(predicate) {
  var success = true;
  this.each(function(e) {
    if (!predicate(e)) {
      success = false;
      return false;
    }
  });
  return success;
};

Sequence.prototype.some =
Sequence.prototype.any = function(predicate) {
  if (!predicate) {
    predicate = function() { return true; };
  }

  var success = false;
  this.each(function(e) {
    if (predicate(e)) {
      success = true;
      return false;
    }
  });
  return success;
};

Sequence.prototype.isEmpty = function() {
  return !this.any();
};

Sequence.prototype.indexOf = function(value) {
  var index = 0;
  var foundIndex = -1;
  this.each(function(e) {
    if (e === value) {
      foundIndex = index;
      return false;
    }
    ++index;
  });
  return foundIndex;
};

Sequence.prototype.lastIndexOf = function(value) {
  var index = this.reverse().indexOf(value);
  if (index !== -1) {
    index = this.length() - index - 1;
  }
  return index;
};

Sequence.prototype.sortedIndex = function(value) {
  var lower = 0;
  var upper = this.length();
  var i;

  while (lower < upper) {
    i = (lower + upper) >>> 1;
    if (this.get(i) < value) {
      lower = i + 1;
    } else {
      upper = i;
    }
  }
  return lower;
};

Sequence.prototype.contains = function(value) {
  return this.indexOf(value) !== -1;
};

Sequence.prototype.reduce =
Sequence.prototype.inject =
Sequence.prototype.foldl = function(aggregator, memo) {
  this.each(function(e) {
    memo = aggregator(memo, e);
  });
  return memo;
};

Sequence.prototype.reduceRight =
Sequence.prototype.foldr = function(aggregator, memo) {
  return this.reverse().reduce(aggregator, memo);
};

Sequence.prototype.find =
Sequence.prototype.detect = function(predicate) {
  return this.filter(predicate).first();
};

Sequence.prototype.min = function() {
  return this.reduce(function(least, value) {
    if (typeof least === "undefined") {
      return value;
    }
    return value < least ? value : least;
  });
};

Sequence.prototype.max = function() {
  return this.reduce(function(greatest, value) {
    if (typeof greatest === "undefined") {
      return value;
    }
    return value > greatest ? value : greatest;
  });
};
