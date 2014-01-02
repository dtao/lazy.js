describe("uniq", function() {
  ensureLaziness(function() { Lazy(people).map(Person.getGender).uniq(); });

  it("only returns 1 of each unique value", function() {
    var genders = Lazy(people).map(Person.getGender).uniq().toArray();
    expect(genders).toEqual(["M", "F"]);
  });

  it("does not mistakenly combine distinct values w/ identical string representations", function() {
    var source = [1, 1, "1", "1", { toString: function() { return "1"; } }];
    var results = Lazy(source).uniq().toArray();

    // Not really sure how to test equality of an object w/ a function, so...
    expect(results.length).toEqual(3);
    expect(results.slice(0, 2)).toEqual([1, "1"]);
    expect(typeof results[2].toString).toBe("function");
  });

  it("does not override methods on Set, screwing up everything", function() {
    var results = Lazy(["__proto__", "constructor", "add", "contains"]).uniq().toArray();
    expect(results).toEqual(["__proto__", "constructor", "add", "contains"]);
  });

  it("correctly distinguishes between distinct objects with the same string representation", function() {
    var objects, x, y;
    objects = [
      x = { toString: function() { return "foo"; } },
      y = { toString: function() { return "foo"; } }
    ];

    expect(Lazy(objects).uniq().toArray()).toEqual([x, y]);
  });

  it("distinguishes between booleans, null, and undefined and their string equivalents", function() {
    var source = [true, false, null, undefined, "true", "false", "null", "undefined"];
    var results = Lazy(source).uniq().toArray();
    expect(results).toEqual(source);
  });

  it("does not conflate a string w/ its prefixed self", function() {
    var results = Lazy(["foo", "@foo"]).uniq().toArray();
    expect(results).toEqual(["foo", "@foo"]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy([10, 5, 5, 5, 8, 8]).uniq()).toPassToEach(1, [0, 1, 2]);
  });

  it("correctly selects unique elements for medium-sized (~300 elements) collections", function() {
    var medium = Lazy.range(150).toArray();
    var result = Lazy(medium.concat(medium)).uniq().toArray()
    expect(result).toEqual(medium);
  });

  it("correctly selects unique elements for large (>= 800 elements) collections", function() {
    var large = Lazy.range(500).toArray();
    var result = Lazy(large.concat(large)).uniq().toArray();
    expect(result).toEqual(large);
  });

  testAllSequenceTypes(
    "accepts an optional key function to perform equality comparisons by key",

    [{ x: 1, y: 2 }, { x: 1, y: 2 }],

    function(sequence) {
      var selector = function(obj) { return obj.x; };
      expect(sequence.uniq(selector)).toComprise([{ x: 1, y: 2 }]);
    }
  );

  testAllSequenceTypes(
    "supports a 'pluck'-style callback when a string is passed instead of a function",

    [{ x: 1, y: 2 }, { x: 1, y: 2 }],

    function(sequence) {
      expect(sequence.uniq('x')).toComprise([{ x: 1, y: 2 }]);
    }
  );
});
