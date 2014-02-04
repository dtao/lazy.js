testSequence(['map', 'pluck', 'collect'], {
  cases: [
    {
      input: [1, 2, 3],
      apply: function(sequence, method) {
        return sequence[method](function(x) { return x + 1; });
      },
      result: [2, 3, 4]
    },
    {
      label: 'pluck-style',
      input: [{ foo: 1 }, { foo: 2 }, { foo: 3 }],
      apply: function(sequence, method) {
        return sequence[method]('foo');
      },
      result: [1, 2, 3]
    }
  ],

  arrayLike: true,
  supportsAsync: true
});

describe("map", function() {
  it("can also map objects", function() {
    var keyValuePairs = Lazy({ foo: "FOO", bar: "BAR" })
      .map(function(v, k) { return [k, v]; });
    expect(keyValuePairs).toComprise([["foo", "FOO"], ["bar", "BAR"]]);
  });

  describe("map -> min", function() {
    it("works as expected", function() {
      var min = Lazy([1, 2, 3]).map(increment).min();
      expect(min).toEqual(2);
    });

    it("returns Infinity for an empty sequence", function() {
      var min = Lazy([]).map(function(d) { return d.foo; }).min();
      expect(min).toBe(Infinity);
    });
  });

  describe("map -> max", function() {
    it("works as expected", function() {
      var max = Lazy([1, 2, 3]).map(increment).max();
      expect(max).toEqual(4);
    });

    it("returns -Infinity for an empty sequence", function() {
      var max = Lazy([]).map(function(d) { return d.foo; }).max();
      expect(max).toBe(-Infinity);
    });
  });
});

describe("invoke", function() {
  ensureLaziness(function() { Lazy(people).invoke("getName"); });

  it("invokes the named method on every element in the collection", function() {
    var names = Lazy(people).invoke("getName");
    expect(names).toComprise(["David", "Mary", "Lauren", "Adam", "Daniel", "Happy"]);
  });
});
