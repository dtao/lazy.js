/**
 * @constructor
 */
function JsonSequence(json) {
  this.json = json;
};

JsonSequence.prototype = new Sequence();

JsonSequence.prototype.getIterator = function() {
  return new JsonIterator(this.json);
};

JsonSequence.prototype.each = function(fn) {
  var iterator = this.getIterator(),
      i = 0;
  while (iterator.moveNext()) {
    if (fn(iterator.current(), i++) === false) {
      break;
    }
  }
};

/**
 * @constructor
 */
function JsonIterator(json) {
  this.json         = json;
  this.pos          = -1;
  this.state        = null;
  this.currentValue = null;
};

// Possible states:
// 0 - number
// 1 - string
// 2 - array
// 3 - object

JsonIterator.prototype.current = function() {
  return this.currentValue;
};

JsonIterator.prototype.moveNext = function() {
  this.establishState();

  switch (this.state) {
    case 0: // number
      this.readNumber();
      return true;
    case 1: // string
      this.readString();
      return true;
    case 2: // array
      this.readArray();
      return true;
    case 3: // object
      this.readObject();
      return true;
    default:
      return false;
  }
};

JsonIterator.prototype.establishState = function() {
  var pos  = this.pos,
      json = this.json,
      c;

  // If we're somewhere in the middle now, skip the comma.
  if (pos >= 0) {
    // Space before the comma is allowed.
    while (json.charAt(pos) === " ") { ++pos; }

    // Now, it's possible we just skipped a bunch of whitespace at the end of
    // the JSON. In that case, we're done.
    if (json.charAt(pos) === "]") {
      this.state = null;
      return;
    }

    // Otherwise, the only thing we should see next is a comma.
    c = json.charAt(pos++);
    if (c !== ",") {
      throw "Unexpected token '" + c + "' (expected ',')";
    }
  }

  // Just getting started here.
  if (pos === -1) { ++pos; }

  // Skip any leading whitespace.
  while (json.charAt(pos) === " ") { ++pos; }

  if (this.state === null) {
    c = json.charAt(pos++);
    if (c !== "[") {
      throw "Unexpected token '" + c + "' (right now Lazy.js can only parse JSON arrays)";
    }
  }

  c = json.charAt(pos);
  switch (c) {
    case '"':
      ++pos;
      this.state = 1;
      break;

    case "[":
      ++pos;
      this.state = 2;
      break;

    case '{':
      ++pos;
      this.state = 3;
      break;

    default:
      if (c >= "0" && c <= "9") {
        this.state = 0;
        break;
      }

      throw "Unexpected token '" + c + "' (expected one of '\"', '[', '{', or a number)";
  }

  this.pos = pos;
};

JsonIterator.prototype.readNumber = function() {
  var pos  = this.pos,
      json = this.json,
      c    = json.charAt(pos);

  while (c >= "0" && c <= "9") {
    c = json.charAt(++pos);
  }

  // If we're reading a float right now, we'll allow one dot and then a bunch
  // more numbers.
  if (c === ".") {
    do {
      c = json.charAt(++pos);
    } while (c >= "0" && c <= "9");

    this.currentValue = parseFloat(json.substring(this.pos, pos));

  } else {
    this.currentValue = parseInt(json.substring(this.pos, pos));
  }

  this.pos = pos;
};

JsonIterator.prototype.readString = function() {
  var pos  = this.pos,
      json = this.json,
      c    = json.charAt(pos);

  while (c !== '"') {
    // Advance twice if the next character is escaped.
    if (c === "\\") {
      ++pos;
    }

    c = json.charAt(++pos);
  }

  this.currentValue = json.substring(this.pos, pos);
  this.pos = pos + 1;
};

/**
 * Parses a JSON array into a sequence.
 *
 * NOTE: This method is *barely* functional right now! Only supports strings,
 * doesn't really handle escaping, implementation basically sucks. Just a
 * proof-of-concept at this point.
 *
 * @param {string} json A string representing a JSON array.
 * @return {Sequence} A sequence comprising the elements in the JSON array,
 *     which are parsed out lazily.
 */
Lazy.parse = function(json) {
  return new JsonSequence(json);
};
