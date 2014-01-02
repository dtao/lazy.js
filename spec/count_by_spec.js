describe("countBy", function() {
  ensureLaziness(function() { Lazy(people).countBy(Person.getGender); });

  it("counts the collection by a specified selector function", function() {
    var byGender = Lazy(people).countBy(Person.getGender).toArray();
    expect(byGender).toEqual([["M", 3], ["F", 3]]);
  });

  testAllSequenceTypes(
    "uses a 'pluck'-style callback when a string is passed instead of a function",

    [
      { foo: 1, bar: 1 },
      { foo: 2, bar: 2 },
      { foo: 1, bar: 3 }
    ],

    function(sequence) {
      expect(sequence.countBy('foo').toObject()).toEqual({ '1': 2, '2': 1 });
    }
  );
});
