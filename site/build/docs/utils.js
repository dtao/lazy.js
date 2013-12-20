/**
 * Formats a number by adding commas as the thousands separator and truncating
 * decimal part to 3 places (arbitrary decision on my part).
 *
 * @global
 * @param {number} number
 * @returns {string}
 */
this.formatNumber = function(number) {
  var wholeAndDecimal = String(number.toFixed(3)).split('.'),
      whole           = wholeAndDecimal[0],
      parts           = [],
      separatorCurr   = whole.length - 3,
      separatorPrev;

  while (separatorCurr > 0) {
    parts.unshift(whole.substring(separatorCurr, separatorPrev));
    separatorPrev = separatorCurr;
    separatorCurr -= 3;
  }

  if (separatorCurr <= 0) {
    parts.unshift(whole.substring(0, separatorPrev));
  }

  return parts.join(',') + '.' + wholeAndDecimal[1];
};

/**
 * Appends a bunch of whitespace to the end of a string to get it to a desired
 * length. Has no effect if the string exceeds the specified length to begin
 * with.
 *
 * @global
 * @param {string} str The string to pad.
 * @param {number} length The desired length of the string.
 * @returns {string} The string with its fresh new white padding.
 *
 * @examples
 * padRight('foo', 5) // => 'foo  '
 * padRight('', 5)    // => '     '
 * padRight('foo', 2) // => 'foo'
 */
this.padRight = function(str, length) {
  while (str.length < length) {
    str += ' ';
  }
  return str;
};
