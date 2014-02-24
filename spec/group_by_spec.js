describe("groupBy", function() {
  ensureLaziness(function() { Lazy(people).groupBy(Person.getGender); });

  it("groups the collection by a specified selector function", function() {
    var byGender = Lazy(people).groupBy(Person.getGender).toArray();
    expect(byGender).toEqual([
      ["M", [david, adam, daniel]],
      ["F", [mary, lauren, happy]]
    ]);
  });

  it("groups the collection by a specified selector function for async sequences", function() {
    var byGender;
    var done = false;
    var handle = Lazy(people).async().groupBy(Person.getGender).toArray();
    waitsFor(function() { return done; });
    handle.onComplete(function(result) {
      byGender = result;
      done = true;
    });
    runs(function() {
      expect(byGender).toEqual([
        ["M", [david, adam, daniel]],
        ["F", [mary, lauren, happy]]
      ]);
    });
  });

  testAllSequenceTypes(
    "uses a 'pluck'-style callback when a string is passed instead of a function",

    [
      { foo: 1, bar: 1 },
      { foo: 2, bar: 2 },
      { foo: 1, bar: 3 }
    ],

    function(sequence) {
      expect(sequence.groupBy('foo').toObject()).toEqual({
        '1': [
          { foo: 1, bar: 1 },
          { foo: 1, bar: 3 }
        ],
        '2': [
          { foo: 2, bar: 2 }
        ]
      });
    }
  );
});
