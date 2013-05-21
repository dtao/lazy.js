/**
 * The Iterator object provides an API for iterating over a sequence.
 *
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
