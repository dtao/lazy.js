describe('ObjectLikeSequence', function() {
  // I don't think these tests are technically right since I don't think
  // iteration order is guaranteed, but maybe it is, but I don't really care
  // because I feel like leaving this comment is good enough for now.

  describe('keys', function() {
    var keys = Lazy({foo: 1, bar: 2}).keys();

    it('works with getIterator as you would expect', function() {
      var iterator = keys.getIterator();
      expect(iterator.moveNext()).toBe(true);
      expect(iterator.current()).toBe('foo');
      expect(iterator.moveNext()).toBe(true);
      expect(iterator.current()).toBe('bar');
      expect(iterator.moveNext()).toBe(false);
    });
  });

  describe('values', function() {
    var values = Lazy({foo: 1, bar: 2}).values();

    it('works with getIterator as you would expect', function() {
      var iterator = values.getIterator();
      expect(iterator.moveNext()).toBe(true);
      expect(iterator.current()).toBe(1);
      expect(iterator.moveNext()).toBe(true);
      expect(iterator.current()).toBe(2);
      expect(iterator.moveNext()).toBe(false);
    });
  });
});
