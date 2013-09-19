describe("Lazy", function() {
  describe("shuffle", function() {
    ensureLaziness(function() { Lazy(people).shuffle(); });

    // Not 100% sure of a great way to do this, so... let's just go with a
    // probabilistic test.
    it("shuffles the collection", function() {
      var shuffledCollections = Lazy.generate(function() {})
        .take(10)
        .map(function() { return Lazy(people).shuffle().toArray(); });

      var firstResult = shuffledCollections.first();
      shuffledCollections.each(function(collection) {
        // Verify the elements in the collection
        var resorted = Lazy(collection)
          .sortBy(Person.getAge)
          .reverse()
          .toArray();
        expect(resorted).toEqual(people);
      });

      var differences = 0;
      shuffledCollections.drop(1).each(function(collection) {
        for (var i = 0; i < collection.length; ++i) {
          if (collection[i] !== firstResult[i]) {
            ++differences;
            return false;
          }
        }
      });

      expect(differences).toBeGreaterThan(0);
    });

    it("passes an index along with each element", function() {
      expect(Lazy(people).shuffle()).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
    });
  });
});
