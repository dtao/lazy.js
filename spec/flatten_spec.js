describe("flatten", function() {
  ensureLaziness(function() { Lazy([[david], [mary], [lauren], [adam]]).flatten(); });

  it("flattens nested arrays of arrays into one big array", function() {
    var nested = [[david], [mary], [lauren, adam], [[daniel], happy]];
    var flattened = Lazy(nested).flatten().toArray();
    expect(flattened).toEqual([david, mary, lauren, adam, daniel, happy]);
  });

  it("flattens nested sequences along with arrays", function() {
    var nestedSequences = [
      Lazy([david, mary,
        Lazy([lauren, adam,
          Lazy([daniel, happy])
        ])
      ])
    ];

    var flattened = Lazy(nestedSequences).flatten().toArray();
    expect(flattened).toEqual([david, mary, lauren, adam, daniel, happy]);
  });

  it("supports early exiting", function() {
    var nestedSequences = [
      Lazy([david, mary,
        Lazy([lauren, adam,
          Lazy([daniel, happy])
        ])
      ])
    ];

    var iterated = [];
    Lazy(nestedSequences).flatten().each(function(p) {
      iterated.push(p);
      if (p === lauren) {
        return false;
      }
    });

    expect(iterated).toEqual([david, mary, lauren]);
  });

  it("doesn't over-collect on early exit for multiple 'top-level' arrays", function() {
    var arrays = [[1, 2, 3], [4, 5, 6]];
    var flattened = Lazy(arrays).flatten().take(2).toArray();
    expect(flattened).toEqual([1, 2]);
  });

  it("doesn't over-collect on early exit for multiple 'top-level' sequences", function() {
    var sequences = [Lazy([1, 2, 3]), Lazy([4, 5, 6])];
    var flattened = Lazy(sequences).flatten().take(2).toArray();
    expect(flattened).toEqual([1, 2]);
  });

  it("passes an index along with each element", function() {
    var nested = [[david], [mary], [lauren, adam], [[daniel], happy]];
    expect(Lazy(nested).flatten()).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
  });
});
