comprehensiveSequenceTest('first', {
  cases: [
    {
      input: [1, 2, 3, 4, 5],
      params: [3],
      result: [1, 2, 3]
    }
  ],

  aliases: ['head', 'take']
});

describe("take", function() {
  it("doesn't prematurely get the first element when given 0", function() {
    expect(Lazy.generate(function (i) {return i;}).take(0).toArray()).toEqual([]);
  });
});

describe("takeWhile", function() {
  it("exits immediately if the very first element doesn't satisfy the condition", function() {
    expect(Lazy([1, 2, 3]).takeWhile(isEven)).toComprise([]);
  });
});

comprehensiveSequenceTest('takeWhile', {
  cases: [
    {
      input: [2, 4, 6, 7, 8, 9],
      params: [isEven],
      result: [2, 4, 6]
    }
  ]
});

describe("initial", function() {
  ensureLaziness(function() { Lazy(people).initial(); });

  it("selects all but the last element from the collection", function() {
    var allButHappy = Lazy(people).initial().toArray();
    expect(allButHappy).toEqual([david, mary, lauren, adam, daniel]);
  });

  it("if N is given, selects all but the last N elements from the collection", function() {
    var allButDanAndHappy = Lazy(people).initial(2).toArray();
    expect(allButDanAndHappy).toEqual([david, mary, lauren, adam]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(people).initial(2)).toPassToEach(1, [0, 1, 2, 3]);
  });
});
