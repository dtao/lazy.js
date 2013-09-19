describe("Lazy", function() {
  describe("drop", function() {
    ensureLaziness(function() { Lazy(people).drop(2); });

    it("skips the first N elements from the collection", function() {
      var children = Lazy(people).drop(2).toArray();
      expect(children).toEqual([lauren, adam, daniel, happy]);
    });

    it("if no number is provided, skips the first element", function() {
      var allButDavid = Lazy(people).drop().toArray();
      expect(allButDavid).toEqual([mary, lauren, adam, daniel, happy]);
    });

    it("includes the entire collection with a count of 0", function() {
      var everybody = Lazy(people).drop(0).toArray();
      expect(everybody).toEqual(people);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).drop(2)).toPassToEach(1, [0, 1, 2, 3]);
    });
  });
});
