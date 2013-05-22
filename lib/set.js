/**
 * A collection of unique elements.
 *
 * @constructor
 */
function Set() {
  this.table = {};
}

/**
 * Attempts to add a unique value to the set.
 *
 * @param {*} value The value to add.
 * @return {boolean} True if the value was added to the set (meaning an equal
 *     value was not already present), or else false.
 */
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

/**
 * Checks whether the set contains a value.
 *
 * @param {*} value The value to check for.
 * @return {boolean} True if the set contains the value, or else false.
 */
Set.prototype.contains = function(value) {
  var valuesForType = this.table[typeof value];
  return valuesForType && valuesForType["@" + value];
};
