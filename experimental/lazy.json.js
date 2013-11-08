var Lazy = require('../lazy.js');

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
var SpacePattern   = /^\s+$/,
    NumberPattern  = /^\d+(?:\.\d+)?$/,
    BooleanPattern = /^(?:true|false)$/,
    NullPattern    = /^null$/;

/**
 * @constructor
 */
function JsonIterator(json) {
  this.json         = json;
  this.position     = 0;
  this.tokenMatcher = /[":,\[\]\{\}]|\d+(?:\.\d+)?|true|false|null/g;
  this.moveNext     = this.firstMoveNext;
};

JsonIterator.prototype.current = function() {
  return this.currentValue;
};

JsonIterator.prototype.readSegment = function(index) {
  return this.json.substring(this.position, index);
};

JsonIterator.prototype.firstMoveNext = function() {
  this.expectToken('[');
  return this.readValue();
};

JsonIterator.prototype.readValue = function() {
  var match = this.tokenMatcher.exec(this.json);

  if (!match) {
    return false;
  }

  var token = match[0];
  if (token === ']') {
    return false;
  }

  if (token === '"') {
    this.position = match.index;
    this.currentValue = this.readString();

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

JsonIterator.prototype.readString = function() {
  var json         = this.json,
      tokenMatcher = this.tokenMatcher,
      match,
      string;

  while (match = tokenMatcher.exec(json)) {
    if (match[0] === '"' && json.charAt(match.index - 1) !== '\\') {
      return json.substring(this.position + 1, match.index)
        .replace(/\\(.)/g, '$1');
    }
  }

  this.unexpectedToken(this.readSegment());
}

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
    this.unexpectedToken(this.readSegment());
  }

  var token = match[0];
  if (!this.tokenIsExpected(token, expectation)) {
    this.unexpectedToken(match, expectation);
  }

  this.position = match.index + token.length;
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
    errorMessage += ' (expected one of: ' + expectation.join(', ') + ')';
  }

  throw new SyntaxError(errorMessage);
};

/**
 * Parses a JSON array into a sequence.
 *
 * @param {string} json A string representing a JSON array.
 * @return {Sequence} A sequence comprising the elements in the JSON array,
 *     which are parsed out lazily.
 *
 * @examples
 * Lazy.parseJSON('foo').toArray()              // throws
 * Lazy.parseJSON('[1, 2, 3]')                  // sequence: [1, 2, 3]
 * Lazy.parseJSON('["foo", "bar"]')             // sequence: ['foo', 'bar']
 * Lazy.parseJSON('["foo", 1, "bar", 123]')     // sequence: ['foo', 1, 'bar', 123]
 * Lazy.parseJSON('[3.14, "foo"]')              // sequence: [3.14, 'foo']
 * Lazy.parseJSON('[1, "foo, \\"bar\\", baz"]') // sequence: [1, 'foo, "bar", baz']
 * Lazy.parseJSON('[1, null, true, false]')     // sequence: [1, null, true, false]
 */
Lazy.parseJSON = function(json) {
  return new JsonSequence(json);
};

module.exports = Lazy;
