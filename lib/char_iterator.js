/**
 * @constructor
 */
function CharIterator(source) {
  this.source = source;
  this.index = -1;
}

CharIterator.prototype.current = function() {
  return this.source.charAt(this.index);
};

CharIterator.prototype.moveNext = function() {
  return (++this.index < this.source.length);
};
