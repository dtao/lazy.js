describe("sum", function() {
  it("returns 0 for an empty collection", function() {
    expect(Lazy([]).sum()).toEqual(0);
  });

  it("returns the sum of values from the collection", function() {
    expect(Lazy([1, 2, 3]).sum()).toEqual(6);
  });

  it("uses a value selector, if supplied", function() {
    expect(Lazy([{ foo: 1 }, { foo: 2 }]).sum('foo')).toEqual(3);
  });
});
