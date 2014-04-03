describe('AsyncHandle', function() {
  var sequence;

  beforeEach(function() {
    sequence = Lazy([1, 2, 3]).async();
  });

  function createHandle() {
    return sequence.each(Lazy.noop);
  }

  describe('then', function() {
    it('creates another AsyncHandle', function() {
      var handle = createHandle();
      var next = handle.then(function() {});
      expect(next).toBeInstanceOf(Lazy.AsyncHandle);
      expect(next).toNotBe(handle);
    });
  });

  describe('cancellation', function() {
    function spyOnSequence() {
      var spy = jasmine.createSpy();
      sequence = sequence.tap(spy);
      return spy;
    }

    it('can cancel iteration using the provided callback', function() {
      var spy = spyOnSequence();

      var handle = sequence
        .tap(function(e, i) {
          if (i === 1) { handle.cancel(); }
        })
        .each(Lazy.noop);

      var done = jasmine.createSpy();
      handle.onComplete(function() {
        expect(spy.callCount).toEqual(2);
        done();
      });

      waitsFor(toBeCalled(done));
    });

    it('passes the same cancellation function to child AsyncHandles create w/ `then`', function() {
      var spy = spyOnSequence();

      var handle, childHandle;

      handle = sequence
        .tap(function(e, i) {
          if (i === 1) { childHandle.cancel(); }
        })
        .each(Lazy.noop);

      childHandle = handle.then(function() { return 'foo'; });

      var done = jasmine.createSpy();
      childHandle.onComplete(function() {
        expect(spy.callCount).toEqual(2);
        done();
      });

      waitsFor(toBeCalled(done));
    });
  });
});
