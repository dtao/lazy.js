describe("concat", function() {
  var taos,
      nickses,
      bill,
      anne,
      clifford,
      louise;

  beforeEach(function() {
    taos = [
      bill = new Person("Bill", 93, "M"),
      anne = new Person("Anne", 90, "F")
    ];

    nickses = [
      clifford = new Person("Clifford", Infinity, "M"),
      louise = new Person("Louise", Infinity, "F")
    ];
  });

  ensureLaziness(function() { Lazy(people).concat(taos, nickses); });

  it("returns the specified elements after the end of the collection", function() {
    var family = Lazy(people).concat(taos, nickses).toArray();
    expect(family).toEqual([david, mary, lauren, adam, daniel, happy, bill, anne, clifford, louise]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(people).concat(taos, nickses)).toPassToEach(1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  testAllSequenceTypes(
    "supports asynchronous iteration",

    [1, 2],

    function(sequence) {
      performAsyncSteps({
        getSequence: function() { return sequence.concat([3, 4]).async(); },
        expected: function() { return [1, 2, 3, 4]; }
      });
    }
  );
});
