describe("min", function() {
  it("returns the minimum value from the collection", function() {
    expect(Lazy(people).map(Person.getAge).min()).toEqual(25);
  });

  it("uses a value selector, if supplied", function() {
    expect(Lazy(people).min(Person.getAge)).toBe(happy);
  });
});
