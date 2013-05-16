var SequenceIterator = function(sequence) {
  this.sequence = sequence;
  this.index = -1;
};

SequenceIterator.prototype.current = function() {
  return this.sequence.get(this.index);
};

SequenceIterator.prototype.moveNext = function() {
  if (this.index >= this.sequence.length() - 1) {
    return false;
  }

  ++this.index;
  return true;
};
