describe("intersection", function() {
  var oneThroughTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var fiveThroughFifteen = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  it("returns only the elements in all of the arrays", function() {
    var intersection = Lazy(oneThroughTen).intersection(fiveThroughFifteen).toArray();
    expect(intersection).toEqual([5, 6, 7, 8, 9, 10]);
  });

  // TODO: figure out a smart way to fix this without seriously hurting performance.
  xit("returns unique elements", function() {
    var intersection = Lazy([1, 1, 2, 3]).intersection([1, 2]).toArray();
    expect(intersection).toEqual([1, 2]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(["foo", "bar", "baz"]).intersection(["bar", "baz", "blah"])).toPassToEach(1, [0, 1]);
  });
});
