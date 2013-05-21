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
