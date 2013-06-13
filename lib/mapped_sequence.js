var MappedSequence = Sequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

MappedSequence.prototype.each = function(fn) {
  var mapFn = this.mapFn;
  this.parent.each(function(e, i) {
    return fn(mapFn(e, i), i);
  });
};

var IndexedMappedSequence = IndexedSequence.inherit(function(parent, mapFn) {
  this.parent = parent;
  this.mapFn  = mapFn;
});

IndexedMappedSequence.prototype.get = function(i) {
  return this.mapFn(this.parent.get(i), i);
};

/**
 * @constructor
 */
function MappedArrayWrapper(source, mapFn) {
  this.source = source;
  this.mapFn  = mapFn;
}

MappedArrayWrapper.prototype = new IndexedSequence();

MappedArrayWrapper.prototype.get = function(i) {
  return this.mapFn(this.source[i]);
};

MappedArrayWrapper.prototype.length = function() {
  return this.source.length;
};

MappedArrayWrapper.prototype.each = function(fn) {
  var source = this.source,
      length = this.source.length,
      mapFn  = this.mapFn,
      i = -1;
  while (++i < length) {
    if (fn(mapFn(source[i], i), i) === false) {
      return;
    }
  }
};
