/**
 * The Iterator object provides an API for iterating over a sequence.
 *
 * @param {Sequence=} sequence The sequence to iterate over.
 * @constructor
 */
function Iterator(sequence) {
  this.sequence = sequence;
  this.index = -1;
}

/**
 * Gets the current item this iterator is pointing to.
 *
 * @return {*} The current item.
 */
Iterator.prototype.current = function() {
  return this.sequence.get(this.index);
};

/**
 * Moves the iterator to the next item in a sequence, if possible.
 *
 * @return {boolean} True if the iterator is able to move to a new item, or else
 *     false.
 */
Iterator.prototype.moveNext = function() {
  if (this.index >= this.sequence.length() - 1) {
    return false;
  }

  ++this.index;
  return true;
};

/**
 * @constructor
 */
function FilteringIterator(sequence, filterFn) {
  this.iterator = sequence.getIterator();
  this.filterFn = filterFn;
}

FilteringIterator.prototype.current = function() {
  return this.value;
};

FilteringIterator.prototype.moveNext = function() {
  var iterator = this.iterator,
      filterFn = this.filterFn,
      value;

  while (iterator.moveNext()) {
    value = iterator.current();
    if (filterFn(value)) {
      this.value = value;
      return true;
    }
  }

  this.value = undefined;
  return false;
};

/**
 * @constructor
 * @param {string|StringLikeSequence} source
 */
function CharIterator(source) {
  this.source = source;
  this.index = -1;
}

CharIterator.prototype = new Iterator();

CharIterator.prototype.current = function() {
  return this.source.charAt(this.index);
};

CharIterator.prototype.moveNext = function() {
  return (++this.index < this.source.length);
};

/**
 * @constructor
 */
function StringMatchIterator(source, pattern) {
  this.source = source;

  // clone the RegExp
  this.pattern = eval("" + pattern + (!pattern.global ? "g" : ""));
}

StringMatchIterator.prototype.current = function() {
  return this.match[0];
};

StringMatchIterator.prototype.moveNext = function() {
  return !!(this.match = this.pattern.exec(this.source));
};

/**
 * @constructor
 */
function SplitWithRegExpIterator(source, pattern) {
  this.source = source;

  // clone the RegExp
  this.pattern = eval("" + pattern + (!pattern.global ? "g" : ""));
}

SplitWithRegExpIterator.prototype.current = function() {
  return this.source.substring(this.start, this.end);
};

SplitWithRegExpIterator.prototype.moveNext = function() {
  if (!this.pattern) {
    return false;
  }

  var match = this.pattern.exec(this.source);

  if (match) {
    this.start = this.nextStart ? this.nextStart : 0;
    this.end = match.index;
    this.nextStart = match.index + match[0].length;
    return true;

  } else if (this.pattern) {
    this.start = this.nextStart;
    this.end = undefined;
    this.nextStart = undefined;
    this.pattern = undefined;
    return true;
  }

  return false;
};

/**
 * @constructor
 */
function SplitWithStringIterator(source, delimiter) {
  this.source = source;
  this.delimiter = delimiter;
}

SplitWithStringIterator.prototype.current = function() {
  return this.source.substring(this.leftIndex, this.rightIndex);
};

SplitWithStringIterator.prototype.moveNext = function() {
  if (!this.finished) {
    this.leftIndex = typeof this.leftIndex !== "undefined" ?
      this.rightIndex + this.delimiter.length :
      0;
    this.rightIndex = this.source.indexOf(this.delimiter, this.leftIndex);
  }

  if (this.rightIndex === -1) {
    this.finished = true;
    this.rightIndex = undefined;
    return true;
  }

  return !this.finished;
};
