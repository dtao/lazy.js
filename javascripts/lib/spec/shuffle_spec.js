describe("shuffle", function() {
  ensureLaziness(function() { Lazy(people).shuffle(); });

  // Not 100% sure of a great way to do this, so... let's just go with a
  // probabilistic test.
  it("shuffles the collection", function() {
    var shuffledCollections = Lazy.range(10)
      .map(function() { return Lazy(people).shuffle().toArray(); })
      .memoize();

    var firstResult = shuffledCollections.first();
    shuffledCollections.each(function(collection) {
      // Verify the elements in the collection
      var resorted = Lazy(collection)
        .sortBy(Person.getAge)
        .reverse()
        .toArray();
      expect(resorted).toEqual(people);
    });

    var differences = Lazy(people)
      .map(function() { return 0; })
      .toArray();

    shuffledCollections.drop(1).each(function(collection) {
      for (var i = 0; i < collection.length; ++i) {
        if (collection[i] !== firstResult[i]) {
          differences[i]++;
        }
      }
    });

    for (var i = 0; i < people.length; ++i) {
      expect(differences[i]).toBeGreaterThan(0, 'All elements at ' + i + ' are the same!');
    }
  });

  it("is unbiased", function() {
    var firsts = Lazy.range(100)
      .map(function() { return Lazy(people).shuffle().first(); })
      .memoize();

    expect(firsts.uniq().sortBy(Person.getName)).toComprise([
      adam, daniel, david, happy, lauren, mary
    ]);
  });

  it("passes an index along with each element", function() {
    expect(Lazy(people).shuffle()).toPassToEach(1, [0, 1, 2, 3, 4, 5]);
  });
});
