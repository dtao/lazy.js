describe('equals', function() {
  it('only iterates as far as necessary', function() {
    expect(Lazy(people).equals(Lazy([1, 2, 3]))).toEqual(false);
    expect(personsAccessed()).toBe(1);
  });

  it('supports a custom equality function', function() {
    function eq(x, y) { return x.toLowerCase() == y.toLowerCase(); }

    expect(Lazy(['foo', 'bar']).equals(Lazy(['FOO', 'BAR']), eq)).toBe(true);
    expect(Lazy(['foo', 'bar']).equals(Lazy(['BAR', 'FOO']), eq)).toBe(false);
  });
});
