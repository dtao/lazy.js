describe('support for ES6 features', function() {
  describe('generators', function() {
    var sequence = Lazy(function*() {
      yield 1;
      yield 2;
      yield 3;
    });

    it('can wrap generators as sequences', function() {
      expect(sequence).toBeInstanceOf(Lazy.Sequence);
    });

    it('can iterate over the generated output', function() {
      expect(sequence).toComprise([1, 2, 3]);
    });

    it('can map, etc. over the result, same as any other sequence', function() {
      sequence = sequence.map(increment);
      expect(sequence).toComprise([2, 3, 4]);
    });
  });
});
