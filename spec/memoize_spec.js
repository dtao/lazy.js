describe('memoize', function() {
  it('only iterates as far as it needs', function() {
    var visited = [];

    var sequence = Lazy([1, 2, 3, 4, 5]).map(function(x) {
      visited.push(x);
      return x;
    });

    var memoized = sequence.memoize();

    expect(memoized.get(0)).toEqual(1);
    expect(visited).toEqual([1]);

    expect(memoized.get(1)).toEqual(2);
    expect(visited).toEqual([1, 2]);

    expect(memoized.take(3)).toComprise([1, 2, 3]);
    expect(visited).toEqual([1, 2, 3]);

    // Ensure iterating over memoized again doesn't re-trigger side effects.
    visited.length = 0;
    expect(memoized.take(2)).toComprise([1, 2]);
    expect(visited).toEqual([]);

    // Reading one more from the sequence should result in 1 more side effect.
    visited.length = 0;
    expect(memoized.take(4)).toComprise([1, 2, 3, 4]);
    expect(visited).toEqual([4]);

    // Make sure actually iterating to the end doesn't cause any issues.
    visited.length = 0;
    expect(memoized).toComprise([1, 2, 3, 4, 5]);
    expect(visited).toEqual([5]);

    // Just for funsies.
    visited.length = 0;
    expect(memoized.map(Lazy.identity)).toComprise([1, 2, 3, 4, 5]);
    expect(visited).toEqual([]);
  });

  it('works just fine on empty sequences', function() {
    expect(Lazy([]).memoize()).toComprise([]);
  });

  it('works just fine on generated sequences', function() {
    var numbers = Lazy.generate(Math.random).memoize().take(3);
  });
});
