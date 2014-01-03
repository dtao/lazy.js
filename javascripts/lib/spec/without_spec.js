describe("without", function() {
  var integers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  ensureLaziness(function() { Lazy(people).without(adam, lauren); });

  it("returns the values in collection not including the specified values", function() {
    var withoutFibonaccis = Lazy(integers)
      .without(1, 2, 3, 5, 8)
      .toArray();

    expect(withoutFibonaccis).toEqual([4, 6, 7, 9, 10]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(people).without(david, mary, daniel, happy)).toPassToEach(1, [0, 1]);
  });
});

describe("difference", function() {
  var integers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  ensureLaziness(function() { Lazy(people).difference([daniel, happy]); });

  it("returns only the values in collection not in the specified array(s)", function() {
    var minusFibonaccis = Lazy(integers)
      .difference([1, 2, 3], [5, 8])
      .toArray();

    expect(minusFibonaccis).toEqual([4, 6, 7, 9, 10]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(people).difference([adam, daniel])).toPassToEach(1, [0, 1, 2, 3]);
  });
});
