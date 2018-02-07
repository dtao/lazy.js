describe('contains', function() {
  it('only iterates as far as necessary', function() {
    expect(Lazy(people).contains(lauren)).toBe(true);
    expect(personsAccessed()).toBe(3);
  });

  it('supports a custom equality function', function() {
    function eq(x, y) { return x.toLowerCase() == y.toLowerCase(); }

    expect(Lazy(['foo', 'bar']).contains('BAR', eq)).toBe(true);
    expect(Lazy(['foo', 'bar']).contains('BAZ', eq)).toBe(false);
  });
});
