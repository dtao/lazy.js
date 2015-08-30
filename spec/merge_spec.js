describe("merge", function () {
  var object_a = {
    string: 'foobar',
    number: 42,
    array: [4, 8, 15, 16, 23, 42],
    date: new Date(),
    bool: true,
    object: { foo:"bar" }
  },
  object_b = {
    string: 'snafu',
    number: 23,
    array: [1, 2, 3],
    date: new Date(0),
    bool: false,
    object: { bar:"foo" }
  };

  if (typeof Buffer === 'function') {
    object_a.buffer = new Buffer([1, 2, 3, 4, 5, 6]);
    object_b.buffer = new Buffer([3, 2, 1]);
  }

  var merged = Lazy(object_a).merge(object_b).toObject();

  it("should merge as expected", function () {
    expect(merged.string).toEqual(object_b.string);
    expect(merged.number).toEqual(object_b.number);
    expect(merged.array).toEqual([1, 2, 3, 16, 23, 42]);
    expect(merged.date).toEqual(object_b.date);
    expect(merged.buffer).toEqual(object_b.buffer);
    expect(merged.bool).toEqual(object_b.bool);
    expect(merged.object).toEqual({ foo: "bar", bar: "foo" });
  });

  it("should retain types", function () {
    for (var key in merged) {
      expect(merged[key].constructor.name).toEqual(object_a[key].constructor.name);
    }
  });
});
