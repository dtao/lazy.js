describe("union", function() {
  var oneThroughTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var fiveThroughFifteen = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  it("returns all the elements in any of the arrays", function() {
    var union = Lazy(oneThroughTen).union(fiveThroughFifteen).toArray();
    expect(union).toEqual([1, 2, 3, 4, 5, 6, 7, 8,  9, 10, 11, 12, 13, 14, 15]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(["foo", "bar"]).union(["bar", "baz"])).toPassToEach(1, [0, 1, 2]);
  });
});
