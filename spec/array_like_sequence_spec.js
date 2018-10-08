describe('ArrayLikeSequence', function() {
  describe('unshift', function() {
    it('returns an ArrayLikeSequence', function() {
      var sequence = Lazy([1, 2]).unshift(3);
      expect(sequence).toBeInstanceOf(Lazy.ArrayLikeSequence);
    });
  });
});
