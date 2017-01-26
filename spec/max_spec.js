describe("max", function() {
  it("returns the maximum value from the collection", function() {
    expect(Lazy(people).map(Person.getAge).max()).toEqual(63);
  });

  it("uses a value selector, if supplied", function() {
    expect(Lazy(people).max(Person.getAge)).toBe(david);
  });
});
