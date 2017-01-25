describe("zip", function() {
  var names;

  beforeEach(function() {
    names = Lazy(people).map(Person.getName).toArray();
    Person.reset(people);
  });

  ensureLaziness(function() { Lazy(names).zip(people); });

  it("merges together the values of each array", function() {
    var zipped = Lazy(names).zip(people).toArray();

    expect(zipped).toEqual([
      ["David", david],
      ["Mary", mary],
      ["Lauren", lauren],
      ["Adam", adam],
      ["Daniel", daniel],
      ["Happy", happy]
    ]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(names).zip(people)).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
  });

  it("can zip together sequences", function() {
    var down = Lazy.range(5, 0, -1);
    var up = Lazy.range(0, Infinity);
    expect(Lazy(down).zip(up).toArray()).toEqual([[5, 0], [4, 1], [3, 2], [2, 3], [1, 4]]);
  });
});
