(function(context) {

  var Lazy = context.Lazy;

  if (typeof Lazy === 'undefined' && typeof require === 'function') {
    Lazy = require('../lazy.js');
  }

  /**
   * @constructor
   */
  function JsonSequence(json) {
    this.json = json;
  };

  JsonSequence.prototype = new Lazy.Sequence();

  JsonSequence.prototype.getIterator = function() {
    return new JsonIterator(this.json);
  };

  // Patterns
  var NumberPattern  = /^\d+(?:\.\d+)?$/,
      BooleanPattern = /^(?:true|false)$/,
      NullPattern    = /^null$/;

  /**
   * @constructor
   */
  function JsonIterator(json) {
    this.json         = json;
    this.position     = 0;
    this.tokenMatcher = /[":,\[\]\{\}]|\d+(?:\.\d+)?|true|false|null|\b./g;
    this.moveNext     = this.firstMoveNext;
  };

  JsonIterator.prototype.current = function() {
    return this.currentValue;
  };

  JsonIterator.prototype.firstMoveNext = function() {
    this.expectToken('[');
    return this.readValue();
  };

  JsonIterator.prototype.readValue = function() {
    var match = this.tokenMatcher.exec(this.json);

    if (!match) {
      this.unexpectedEOS();
    }

    var token = match[0];
    if (token === ']') {
      return false;
    }

    this.position = match.index + token.length;

    if (token === '"') {
      this.currentValue = this.readString();

    } else if (token === '[') {
      this.currentValue = this.readArray();

    } else if (token === '{') {
      this.currentValue = this.readObject();

    } else if (NumberPattern.test(token)) {
      this.currentValue = Number(token);

    } else if (NullPattern.test(token)) {
      this.currentValue = null;

    } else if (BooleanPattern.test(token)) {
      this.currentValue = token === 'true';

    } else {
      this.unexpectedToken(match);
    }

    this.moveNext = this.readAnotherValue;
    return true;
  };

  JsonIterator.prototype.readString = function(fromPosition) {
    var json         = this.json,
        tokenMatcher = this.tokenMatcher,
        position     = typeof fromPosition === 'number' ? fromPosition : this.position,
        match,
        string;

    while (match = tokenMatcher.exec(json)) {
      if (match[0] === '"' && json.charAt(match.index - 1) !== '\\') {
        return json.substring(position, match.index)
          .replace(/\\(.)/g, '$1');
      }
    }

    this.unexpectedEOS();
  };

  JsonIterator.prototype.readArray = function(fromPosition) {
    var json         = this.json,
        tokenMatcher = this.tokenMatcher,
        position     = typeof fromPosition === 'number' ? fromPosition : this.position,
        openBrackets = 1,
        match,
        string;

    while ((openBrackets > 0) && (match = tokenMatcher.exec(json))) {
      switch (match[0]) {
        case '"':
          this.readString(match.index + 1);
          break;

        case '[':
          ++openBrackets;
          break;

        case ']':
          --openBrackets;
          break;
      }
    }

    if (openBrackets === 0) {
      // For now we'll just be lazy (ba-dum, ching!) and use JSON.parse for arrays
      // *within* the JSON.
      return JSON.parse(json.substring(position - 1, match.index + 1));
    }

    this.unexpectedEOS();
  };

  JsonIterator.prototype.readObject = function() {
    var json         = this.json,
        tokenMatcher = this.tokenMatcher,
        openBraces   = 1,
        expecting    = ['"', '}'],
        state        = 'key',
        match,
        string;

    while ((openBraces > 0) && (match = tokenMatcher.exec(json))) {
      if (expecting && !this.tokenIsExpected(match[0], expecting)) {
        this.unexpectedToken(match, expecting);
      }

      switch (match[0]) {
        case '"':
          this.readString(match.index + 1);
          expecting = state === 'key' ? ':' : [',', '}'];
          break;

        case '[':
          this.readArray(match.index + 1);
          expecting = [',', '}'];
          break;

        case ':':
          state = 'value';
          expecting = null;
          break;

        case ',':
          state = 'key';
          expecting = '"';
          break;

        case '{':
          state = 'key';
          expecting = '"';
          ++openBraces;
          break;

        case '}':
          expecting = [',', '}'];
          --openBraces;
          break;
      }
    }

    if (openBraces === 0) {
      // For now we'll just be lazy (ba-dum, ching!) and use JSON.parse for
      // objects *within* the JSON.
      return JSON.parse(json.substring(this.position - 1, match.index + 1));
    }

    this.unexpectedEOS();
  };

  JsonIterator.prototype.readAnotherValue = function() {
    var separator = this.expectToken([',', ']']);

    if (separator === ']') {
      return false;
    }

    return this.readValue();
  };

  JsonIterator.prototype.expectToken = function(expectation) {
    var match = this.tokenMatcher.exec(this.json);

    if (!match) {
      this.unexpectedEOS();
    }

    var token = match[0];
    if (!this.tokenIsExpected(token, expectation)) {
      this.unexpectedToken(match, expectation);
    }

    return token;
  };

  JsonIterator.prototype.tokenIsExpected = function(token, expectation) {
    if (typeof expectation === 'string') {
      return token === expectation;
    }

    for (var i = 0; i < expectation.length; ++i) {
      if (token === expectation[i]) {
        return true;
      }
    }

    return false;
  };

  JsonIterator.prototype.unexpectedToken = function(match, expectation) {
    var errorMessage = typeof match === 'object' ?
      'Unexpected token ' + match[0] + ' at ' + match.index :
      'Unexpected token ' + match;

    if (expectation) {
      if (typeof expectation === 'string') {
        expectation = [expectation];
      }
      errorMessage += ' (expected one of: ' + expectation.join(' ') + ')';
    }

    throw new SyntaxError(errorMessage);
  };

  JsonIterator.prototype.unexpectedEOS = function() {
    throw new SyntaxError(
      'Unexpected end of input: ' +
      JSON.stringify(this.json.substring(this.position))
    );
  };

  /**
   * Parses a JSON array into a sequence.
   *
   * @param {string} json A string representing a JSON array.
   * @return {Sequence} A sequence comprising the elements in the JSON array,
   *     which are parsed out lazily.
   *
   * @examples
   * Lazy.parseJSON('foo').toArray()               // throws
   * Lazy.parseJSON('[1, 2, 3]')                   // sequence: [1, 2, 3]
   * Lazy.parseJSON('["foo", "bar"]')              // sequence: ['foo', 'bar']
   * Lazy.parseJSON('["foo", 1, "bar", 123]')      // sequence: ['foo', 1, 'bar', 123]
   * Lazy.parseJSON('[3.14, "foo"]')               // sequence: [3.14, 'foo']
   * Lazy.parseJSON('[1, "foo, \\"bar\\", baz"]')  // sequence: [1, 'foo, "bar", baz']
   * Lazy.parseJSON('[1, null, true, false]')      // sequence: [1, null, true, false]
   * Lazy.parseJSON('[1, [2, 3]]')                 // sequence: [1, [2, 3]]
   * Lazy.parseJSON('[1, ["foo [1, 2] bar"]]')     // sequence: [1, ["foo [1, 2] bar"]]
   * Lazy.parseJSON('[1, [2, [3, 4]]]')            // sequence: [1, [2, [3, 4]]]
   * Lazy.parseJSON('[1, [2, 3], 4').toArray()     // throws
   * Lazy.parseJSON('[1, [2, 3], blah]').toArray() // throws
   * Lazy.parseJSON('[1, [2, 3], blah').take(2)    // sequence: [1, [2, 3]]
   * Lazy.parseJSON('[1, { "foo": "bar" }]')       // sequence: [1, { foo: 'bar' }]
   * Lazy.parseJSON('[1, {}]')                     // sequence: [1, {}]
   * Lazy.parseJSON('[1, {}}]').toArray()          // throws
   *
   * // crazy example
   * Lazy.parseJSON('[1, { "foo": { "bar": [1, null, ["baz"]] } }, [3, false]]') // sequence: [1, { foo: { 'bar': [1, null, ['baz']] } }, [3, false]]
   */
  Lazy.parseJSON = function(json) {
    return new JsonSequence(json);
  };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = Lazy;
  }

}(typeof global !== 'undefined' ? global : this));
