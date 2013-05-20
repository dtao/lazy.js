var CachingSequence = Sequence.inherit(function() {});

CachingSequence.inherit = function(ctor) {
  ctor.prototype = new CachingSequence();
  return ctor;
};

CachingSequence.prototype.cache = function() {
  if (!this.cached) {
    this.cached = this.toArray();
  }
  return this.cached;
};

CachingSequence.prototype.get = function(i) {
  return this.cache()[i];
};

CachingSequence.prototype.length = function() {
  return this.cache().length;
};
