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
