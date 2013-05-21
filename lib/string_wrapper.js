/**
 * @constructor
 */
function StringWrapper(source) {
  this.source = source;
}

StringWrapper.prototype.match = function(pattern) {
  return new StringMatchSequence(this.source, pattern);
};

StringWrapper.prototype.split = function(delimiter) {
  return new SplitStringSequence(this.source, delimiter);
};
