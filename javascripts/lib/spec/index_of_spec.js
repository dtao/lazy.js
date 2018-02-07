describe('indexOf', function() {
  it('only iterates as far as necessary', function() {
    expect(Lazy(people).indexOf(lauren)).toBe(2);
    expect(personsAccessed()).toBe(3);
  });

  it('supports a custom equality function', function() {
    function eq(x, y) { return x.toLowerCase() == y.toLowerCase(); }

    expect(Lazy(['foo', 'bar']).indexOf('BAR', eq)).toBe(1);
    expect(Lazy(['foo', 'bar']).indexOf('BAZ', eq)).toBe(-1);
  });
});

describe('lastIndexOf', function() {
  it('only iterates as far as necessary', function() {
    expect(Lazy(people).lastIndexOf(lauren)).toBe(2);
    expect(personsAccessed()).toBe(4);
  });

  it('supports a custom equality function', function() {
    function eq(x, y) { return x.toLowerCase() == y.toLowerCase(); }

    expect(Lazy(['foo', 'bar']).lastIndexOf('BAR', eq)).toBe(1);
    expect(Lazy(['foo', 'bar']).lastIndexOf('BAZ', eq)).toBe(-1);
  });
});
