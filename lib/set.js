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

      // Only possibilities are u, o, b, n, s, f, and x -- all unique.
      // (Is this a good idea? Probably not.)
      key = (typeof value).charAt(0) + value;

  if (!table[key]) {
    table[key] = [value];
    return true;
  }
  if (table[key].indexOf(value) >= 0) {
    return false;
  }
  table[key].push(value);
  return true;
};

/**
 * Checks whether the set contains a value.
 *
 * @param {*} value The value to check for.
 * @return {boolean} True if the set contains the value, or else false.
 */
Set.prototype.contains = function(value) {
  var key = (typeof value).charAt(0) + value,
      valuesForKey = this.table[key];
  return valuesForKey && valuesForKey.indexOf(value) !== -1;
};
