describe("find", function() {
  it("returns the first element matching the specified predicate", function() {
    var firstSon = Lazy(people).find(function(p) {
      return p.getGender() === "M" && p.getName() !== "David";
    });

    expect(firstSon).toBe(adam);
  });
});

describe("findWhere", function() {
  var peopleDtos;

  beforeEach(function() {
    peopleDtos = Lazy(people).map(Person.toDto).toArray();
    Person.reset(people);
  });

  it("like where, but only returns the first match", function() {
    var namedDavid = Lazy(peopleDtos).findWhere({ name: "David" });
    expect(namedDavid).toEqual({ name: "David", age: 63, gender: "M" });
  });
});
