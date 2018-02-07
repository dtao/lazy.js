describe('equals', function() {
  it('only iterates as far as necessary', function() {
    expect(Lazy(people).equals(Lazy([1, 2, 3]))).toEqual(false);
    expect(personsAccessed()).toBe(1);
  });
});
