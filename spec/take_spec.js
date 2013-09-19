describe("Lazy", function() {
  describe("take", function() {
    ensureLaziness(function() { Lazy(people).take(2); });

    it("only selects the first N elements from the collection", function() {
      var firstTwo = Lazy(people).take(2).toArray();
      expect(firstTwo).toEqual([david, mary]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).take(2)).toPassToEach(1, [0, 1]);
    });

    it("doesn't prematurely get the first element when given 0", function() {
      expect(Lazy.generate(function (i) {return i;}).take(0).toArray()).toEqual([]);
    })
  });

  describe("initial", function() {
    ensureLaziness(function() { Lazy(people).initial(); });

    it("selects all but the last element from the collection", function() {
      var allButHappy = Lazy(people).initial().toArray();
      expect(allButHappy).toEqual([david, mary, lauren, adam, daniel]);
    });

    it("if N is given, selects all but the last N elements from the collection", function() {
      var allButDanAndHappy = Lazy(people).initial(2).toArray();
      expect(allButDanAndHappy).toEqual([david, mary, lauren, adam]);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).initial(2)).toPassToEach(1, [0, 1, 2, 3]);
    });
  });
});
