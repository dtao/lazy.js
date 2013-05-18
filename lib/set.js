var Set = function() {
  this.table = {};
};

Set.prototype.add = function(value) {
  var table = this.table,
      typeKey = typeof value;

  if (!table[typeKey]) {
    table[typeKey] = {};
    return table[typeKey][value] = true;
  }
  if (table[typeKey][value]) {
    return false;
  }
  return table[typeKey][value] = true;
};

Set.prototype.contains = function(value) {
  var valuesForType = this.table[typeof value];
  return valuesForType && valuesForType[value];
};
