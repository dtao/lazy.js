(function(context) {

  /**
   * Formats a number by adding commas as the thousands separator and truncating
   * decimal part to 3 places (arbitrary decision on my part).
   *
   * @param {number} number
   * @returns {string}
   */
  context.formatNumber = function(number) {
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
  }

}(typeof exports === 'object' ? exports : this));
