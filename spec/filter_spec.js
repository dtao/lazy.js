comprehensiveSequenceTest(['filter', 'select', 'where'], {
  cases: [
    {
      input: [1, 2, 3, 4, 5],
      apply: function(sequence, method) {
        return sequence[method](isEven);
      },
      result: [2, 4],
      accessCountForTake2: 4
    },
    {
      label: 'pluck-style',
      input: [{ foo: true }, { foo: false }, { foo: true }, { foo: false }],
      apply: function(sequence, method) {
        return sequence[method]('foo');
      },
      result: [{ foo: true }, { foo: true }],
      accessCountForTake2: 3
    }
  ],

  arrayLike: false,
  supportsAsync: true
});

describe("filter", function() {
  it("combines with previous filters", function() {
    var sons = Lazy(people)
      .filter(Person.isMale)
      .filter(function(p) { return p.getName() !== "David"; })
      .toArray();
    expect(sons).toEqual([adam, daniel]);
  });

  it("passes an index along with each element", function() {
    // NOTE: So here Lazy deviates from Underscore/Lo-Dash in that filter
    // will pass along the index *in the original array*, not an incrementing
    // index starting from 0. This is to provide unified behavior between
    // arrays and objects (when iterating over objects, the second argument is
    // the *key*, which should be the same in the result as in the source).
    //
    // My reasoning here is that if a dev wants indexes starting from 0 w/ a
    // step of 1 he/she can trivially produce that him-/herself.
    expect(Lazy(people).filter(Person.isMale)).toPassToEach(1, [0, 3, 4]);
  });

  testAllSequenceTypes(
    "acts like 'where' when an object is passed instead of a function",

    [{ foo: 'blub', bar: 1 }, { foo: 'glub', bar: 2 }],

    function(sequence) {
      expect(sequence.filter({ foo: 'blub' })).toComprise([{ foo: 'blub', bar: 1 }]);
    }
  );
});

describe("filter -> reverse", function() {
  it("iterates over the filtered elements in reverse order", function() {
    var evensBackwards = Lazy([1, 2, 3, 4]).filter(isEven).reverse().toArray();
    expect(evensBackwards).toEqual([4, 2]);
  });

  it("reverses before filtering", function() {
    var lastMale = Lazy(people).filter(Person.isMale).reverse().first();
    expect(lastMale).toBe(daniel);
    expect(Person.accesses).toBe(2);
  });
});

describe("reject", function() {
  ensureLaziness(function() { Lazy(people).reject(Person.isMale); });

  it("does the opposite of filter", function() {
    var girls = Lazy(people).reject(Person.isMale).toArray();
    expect(girls).toEqual([mary, lauren, happy]);
  });
});

describe("compact", function() {
  var mostlyFalsy = ["foo", false, null, 0, "", undefined, NaN];

  ensureLaziness(function() { Lazy(mostlyFalsy).compact(); });

  it("removes all falsy values from an array", function() {
    var compacted = Lazy(mostlyFalsy).compact().toArray();
    expect(compacted).toEqual(["foo"]);
  });
});
