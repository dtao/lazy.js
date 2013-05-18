var Set = function() {
  this.table = {};
};

Set.prototype.add = function(value) {
  var table = this.table,
      typeKey = typeof value,
      valueKey = "@" + value;

  if (!table[typeKey]) {
    table[typeKey] = {};
    return table[typeKey][valueKey] = true;
  }
  if (table[typeKey][valueKey]) {
    return false;
  }
  return table[typeKey][valueKey] = true;
};

Set.prototype.contains = function(value) {
  var valuesForType = this.table[typeof value];
  return valuesForType && valuesForType["@" + value];
};
