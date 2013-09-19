describe("Lazy", function() {
  describe("filter", function() {
    ensureLaziness(function() { Lazy(people).filter(Person.isMale); });

    it("selects values from the collection using a selector function", function() {
      var boys = Lazy(people).filter(Person.isMale).toArray();
      expect(boys).toEqual([david, adam, daniel]);
    });

    it("combines with previous filters", function() {
      var sons = Lazy(people)
        .filter(Person.isMale)
        .filter(function(p) { return p.getName() !== "David"; })
        .toArray();
      expect(sons).toEqual([adam, daniel]);
    });

    it("passes an index along with each element", function() {
      // NOTE: So here Lazy deviates from Underscore/Lo-Dash in that filter
      // will pass along the index *in the original array*, not an incrementing
      // index starting from 0. This is to provide unified behavior between
      // arrays and objects (when iterating over objects, the second argument is
      // the *key*, which should be the same in the result as in the source).
      //
      // My reasoning here is that if a dev wants indexes starting from 0 w/ a
      // step of 1 he/she can trivially produce that him-/herself.
      expect(Lazy(people).filter(Person.isMale)).toPassToEach(1, [0, 3, 4]);
    });

    createAsyncTest("supports asynchronous iteration", {
      getSequence: function() { return Lazy(people).filter(Person.isMale).async(); },
      expected: function() { return [david, adam, daniel]; }
    });

    createAsyncTest("can exit early even when iterating asynchronously", {
      getSequence: function() { return Lazy(people).filter(Person.isMale).async().take(1); },
      expected: function() { return [david]; },
      additionalExpectations: function() { expect(Person.accesses).toBe(1); }
    });
  });
});
