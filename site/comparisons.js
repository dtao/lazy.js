describe("compared to Underscore, Lo-Dash, etc.", function() {
  function inc(x) { return x + 1; }
  function dec(x) { return x - 1; }
  function square(x) { return x * x; }
  function isEven(x) { return x % 2 === 0; }
  function identity(x) { return x; }

  function arr(from, to) {
    return Lazy.range(from, to).toArray();
  }

  function dupes(min, max, count) {
    var numbers = Lazy.generate(function() {
      return Math.floor((Math.random() * (max - min)) + min);
    });
    return numbers.take(count).toArray();
  }

  function wuTake(arr, count) {
    var i = -1;
    return wu(arr).takeWhile(function() { return ++i < count; });
  }

  function wuDrop(arr, count) {
    var i = -1;
    return wu(arr).dropWhile(function() { return ++i < count; });
  }

  var jaggedArray = [
    [1, 2, 3],
    [
      [4, 5, 6],
      [7, 8, 9],
      [
        [10, 11],
        12
      ],
      13,
      14,
      [15, 16],
      17
    ],
    [
      18,
      19,
      20,
      [21, 22]
    ],
    [23, 24, 25],
    26,
    27,
    28,
    [29, 30],
    [
      [31, 32, 33],
      [34, 35]
    ],
    36
  ];

  compareAlternatives("map", {
    lazy: function(arr) { return Lazy(arr).map(square); },
    underscore: function(arr) { return _(arr).map(square); },
    lodash: function(arr) { return lodash.map(arr, square); },
    wu: function(arr) { return wu(arr).map(square); },
    sugar: function(arr) { return arr.map(square); },
    linq: function(arr) { return Enumerable.From(arr).Select(square); },
    jslinq: function(arr) { return JSLINQ(arr).Select(square); },
    from: function(arr) { return from(arr).select(square); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(square); },
    boiler: function(arr) { return boiler.map(arr, square); },

    // JSLINQ skips falsy values (e.g., conflates Select and Where --
    // not sure why they thought that was a good idea).
    doesNotMatch: ["jslinq"]
  });

  compareAlternatives("filter", {
    lazy: function(arr) { return Lazy(arr).filter(isEven); },
    underscore: function(arr) { return _(arr).filter(isEven); },
    lodash: function(arr) { return lodash.filter(arr, isEven); },
    wu: function(arr) { return wu(arr).filter(isEven); },
    sugar: function(arr) { return arr.filter(isEven); },
    linq: function(arr) { return Enumerable.From(arr).Where(isEven); },
    jslinq: function(arr) { return JSLINQ(arr).Where(isEven); },
    from: function(arr) { return from(arr).where(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven); },
    boiler: function(arr) { return boiler.filter(arr, isEven); },
  });

  compareAlternatives("flatten", {
    lazy: function(arr) { return Lazy(arr).flatten(); },
    underscore: function(arr) { return _(arr).flatten(); },
    lodash: function(arr) { return lodash.flatten(arr); },
    sugar: function(arr) { return arr.flatten(); },
    linq: function(arr) { return Enumerable.From(arr).Flatten(); },
    boiler: function(arr) { return boiler.flatten(arr); },
    inputs: [[jaggedArray]]
  });

  compareAlternatives("uniq (mostly duplicates)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    linq: function(arr) { return Enumerable.From(arr).Distinct(); },
    jslinq: function(arr) { return JSLINQ(arr).Distinct(identity); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 2, 10)], [dupes(0, 10, 100)]]
  });

  compareAlternatives("uniq (about half dupes)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    linq: function(arr) { return Enumerable.From(arr).Distinct(); },
    jslinq: function(arr) { return JSLINQ(arr).Distinct(identity); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 5, 10)], [dupes(0, 50, 100)]]
  });

  compareAlternatives("uniq (mostly uniques)", {
    lazy: function(arr) { return Lazy(arr).uniq(); },
    underscore: function(arr) { return _(arr).uniq(); },
    lodash: function(arr) { return lodash.uniq(arr); },
    sugar: function(arr) { return arr.unique(); },
    linq: function(arr) { return Enumerable.From(arr).Distinct(); },
    jslinq: function(arr) { return JSLINQ(arr).Distinct(identity); },
    from: function(arr) { return from(arr).distinct(); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct(); },
    boiler: function(arr) { return boiler.uniq(arr); },
    inputs: [[dupes(0, 10, 10)], [dupes(0, 100, 100)]]
  });

  compareAlternatives("union", {
    lazy: function(arr, other) { return Lazy(arr).union(other); },
    underscore: function(arr, other) { return _.union(arr, other); },
    lodash: function(arr, other) { return lodash.union(arr, other); },
    sugar: function(arr, other) { return arr.union(other); },
    linq: function(arr, other) { return Enumerable.From(arr).Union(other); },
    from: function(arr, other) { return from(arr).union(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).union(other); },
    boiler: function(arr, other) { return boiler.union(arr, other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("intersection", {
    lazy: function(arr, other) { return Lazy(arr).intersection(other); },
    underscore: function(arr, other) { return _.intersection(arr, other); },
    lodash: function(arr, other) { return lodash.intersection(arr, other); },
    sugar: function(arr, other) { return arr.intersect(other); },
    linq: function(arr, other) { return Enumerable.From(arr).Intersect(other); },
    jslinq: function(arr, other) { return JSLINQ(arr).Intersect(other); },
    from: function(arr, other) { return from(arr).intersect(other); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).intersect(other); },
    boiler: function(arr, other) { return boiler.intersection(arr, other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("shuffle", {
    lazy: function(arr) { return Lazy(arr).shuffle(); },
    underscore: function(arr) { return _(arr).shuffle(); },
    lodash: function(arr) { return lodash.shuffle(arr); },
    sugar: function(arr) { return arr.randomize(); },
    linq: function(arr) { return Enumerable.From(arr).Shuffle(); },
    boiler: function(arr) { return boiler.shuffle(arr); },
    shouldMatch: false
  });

  compareAlternatives("zip", {
    lazy: function(arr, other) { return Lazy(arr).zip(other); },
    underscore: function(arr, other) { return _(arr).zip(other); },
    lodash: function(arr, other) { return lodash.zip(arr, other); },
    sugar: function(arr, other) { return arr.zip(other); },
    boiler: function(arr, other) { return boiler.zip(arr, other); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> indexOf", {
    lazy: function(arr, value) { return Lazy(arr).map(inc).indexOf(value); },
    underscore: function(arr, value) { return _.chain(arr).map(inc).indexOf(value); },
    lodash: function(arr, value) { return lodash(arr).map(inc).indexOf(value); },
    sugar: function(arr, value) { return arr.map(inc).indexOf(value); },
    linq: function(arr, value) { return Enumerable.From(arr).Select(inc).IndexOf(value); },
    boiler: function(arr, value) { return boiler.chain(arr).map(inc).indexOf(value); },
    inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
    valueOnly: true
  });

  compareAlternatives("map -> sortedIndex", {
    lazy: function(arr) { return Lazy(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    underscore: function(arr) { return _.chain(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    lodash: function(arr) { return lodash(arr).map(inc).sortedIndex(arr[arr.length / 2]); },
    inputs: [[arr(0, 10), 4], [arr(0, 100), 35]],
    valueOnly: true
  });

  compareAlternatives("map -> filter", {
    lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).filter(isEven); },
    wu: function(arr) { return wu(arr).map(inc).filter(isEven); },
    sugar: function(arr) { return arr.map(inc).filter(isEven); },
    linq: function(arr) { return Enumerable.From(arr).Select(inc).Where(isEven); },
    jslinq: function(arr) { return JSLINQ(arr).Select(inc).Where(isEven); },
    from: function(arr) { return from(arr).select(inc).where(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).where(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).filter(isEven).end(); }
  });

  compareAlternatives("map -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).take(5); },
    sugar: function(arr) { return arr.map(inc).first(5); },
    linq: function(arr) { return Enumerable.From(arr).Select(inc).Take(5); },
    from: function(arr) { return from(arr).select(inc).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).first(5).end(); }
  });

  compareAlternatives("filter -> take", {
    lazy: function(arr) { return Lazy(arr).filter(isEven).take(5); },
    underscore: function(arr) { return _.chain(arr).filter(isEven).first(5); },
    lodash: function(arr) { return lodash(arr).filter(isEven).first(5); },
    sugar: function(arr) { return arr.filter(isEven).first(5); },
    linq: function(arr) { return Enumerable.From(arr).Where(isEven).Take(5); },
    from: function(arr) { return from(arr).where(isEven).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven).take(5); },
    boiler: function(arr) { return boiler.chain(arr).filter(isEven).first(5).end(); }
  });

  compareAlternatives("map -> filter -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).filter(isEven).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).filter(isEven).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).filter(isEven).take(5); },
    wu: function(arr) { return wuTake(wu(arr).map(inc).filter(isEven), 5); },
    sugar: function(arr) { return arr.map(inc).filter(isEven).first(5); },
    linq: function(arr) { return Enumerable.From(arr).Select(inc).Where(isEven).Take(5); },
    from: function(arr) { return from(arr).select(inc).where(isEven).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).where(isEven).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).filter(isEven).first(5).end(); }
  });

  compareAlternatives("map -> drop -> take", {
    lazy: function(arr) { return Lazy(arr).map(inc).drop(5).take(5); },
    underscore: function(arr) { return _.chain(arr).map(inc).rest(5).take(5); },
    lodash: function(arr) { return lodash(arr).map(inc).rest(5).take(5); },
    wu: function(arr) { return wuTake(wuDrop(wu(arr).map(inc), 5), 5); },
    sugar: function(arr) { return arr.map(inc).last(arr.length - 5).first(5); },
    linq: function(arr) { return Enumerable.From(arr).Select(inc).Skip(5).Take(5); },
    from: function(arr) { return from(arr).select(inc).skip(5).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).skip(5).take(5); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).rest(5).first(5).end(); }
  });

  compareAlternatives("filter -> drop -> take", {
    lazy: function(arr) { return Lazy(arr).filter(isEven).drop(5).take(5); },
    underscore: function(arr) { return _.chain(arr).filter(isEven).rest(5).first(5); },
    lodash: function(arr) { return lodash(arr).filter(isEven).rest(5).first(5); },
    linq: function(arr) { return Enumerable.From(arr).Where(isEven).Skip(5).Take(5); },
    from: function(arr) { return from(arr).where(isEven).skip(5).take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).where(isEven).skip(5).take(5); },
    boiler: function(arr) { return boiler.chain(arr).filter(isEven).rest(5).first(5).end(); }
  });

  compareAlternatives("flatten -> take", {
    lazy: function(arr) { return Lazy(arr).flatten().take(5); },
    underscore: function(arr) { return _.chain(arr).flatten().first(5); },
    lodash: function(arr) { return lodash(arr).flatten().first(5); },
    sugar: function(arr) { return arr.flatten().first(5); },
    linq: function(arr) { return Enumerable.From(arr).Flatten().Take(5); },
    boiler: function(arr) { return boiler.chain(arr).flatten().first(5).end(); },
    inputs: [[jaggedArray]]
  });

  compareAlternatives("uniq -> take", {
    lazy: function(arr) { return Lazy(arr).uniq().take(5); },
    underscore: function(arr) { return _.chain(arr).uniq().first(5); },
    lodash: function(arr) { return lodash(arr).uniq().first(5); },
    sugar: function(arr) { return arr.unique().first(5); },
    linq: function(arr) { return Enumerable.From(arr).Distinct().Take(5); },
    from: function(arr) { return from(arr).distinct().take(5); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).distinct().take(5); },
    boiler: function(arr) { return boiler.chain(arr).uniq().first(5).end(); },
    inputs: [[dupes(0, 5, 10)], [dupes(0, 10, 100)]]
  });

  compareAlternatives("union -> take", {
    lazy: function(arr, other) { return Lazy(arr).union(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).union(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).union(other).first(5); },
    sugar: function(arr, other) { return arr.union(other).first(5); },
    linq: function(arr, other) { return Enumerable.From(arr).Union(other).Take(5); },
    from: function(arr, other) { return from(arr).union(other).take(5); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).union(other).take(5); },
    boiler: function(arr, other) { return boiler.chain(arr).union(other).first(5).end(); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("intersection -> take", {
    lazy: function(arr, other) { return Lazy(arr).intersection(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).intersection(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).intersection(other).first(5); },
    sugar: function(arr, other) { return arr.intersect(other).first(5); },
    linq: function(arr, other) { return Enumerable.From(arr).Intersect(other).Take(5); },
    from: function(arr, other) { return from(arr).intersect(other).take(5); },
    ix: function(arr, other) { return Ix.Enumerable.fromArray(arr).intersect(other).take(5); },
    boiler: function(arr, other) { return boiler.chain(arr).intersection(other).first(5).end(); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("without -> take", {
    lazy: function(arr, other) { return Lazy(arr).without(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).difference(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).difference(other).first(5); },
    sugar: function(arr, other) { return arr.subtract(other).first(5); },
    inputs: [[arr(0, 10), arr(3, 7)], [arr(0, 100), arr(25, 75)]]
  });

  compareAlternatives("shuffle -> take", {
    lazy: function(arr) { return Lazy(arr).shuffle().take(5); },
    underscore: function(arr) { return _.chain(arr).shuffle().first(5); },
    lodash: function(arr) { return lodash(arr).shuffle().first(5); },
    sugar: function(arr) { return arr.randomize().first(5); },
    linq: function(arr) { return Enumerable.From(arr).Shuffle().Take(5); },
    boiler: function(arr) { return boiler.chain(arr).shuffle().first(5).end(); },
    shouldMatch: false
  });

  compareAlternatives("zip -> take", {
    lazy: function(arr, other) { return Lazy(arr).zip(other).take(5); },
    underscore: function(arr, other) { return _.chain(arr).zip(other).first(5); },
    lodash: function(arr, other) { return lodash(arr).zip(other).first(5); },
    sugar: function(arr, other) { return arr.zip(other).first(5); },
    boiler: function(arr, other) { return boiler.chain(arr).zip(other).first(5).end(); },
    inputs: [[arr(0, 10), arr(5, 15)], [arr(0, 100), arr(50, 150)]]
  });

  compareAlternatives("map -> any", {
    lazy: function(arr) { return Lazy(arr).map(inc).any(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).any(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).any(isEven); },
    sugar: function(arr) { return arr.map(inc).any(isEven); },
    linq: function(arr) { return Enumerable.From(arr).Select(inc).Any(isEven); },
    jslinq: function(arr) { return JSLINQ(arr).Select(inc).Any(isEven); },
    from: function(arr) { return from(arr).select(inc).any(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).any(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).any(isEven); },
    valueOnly: true
  });

  compareAlternatives("map -> all", {
    lazy: function(arr) { return Lazy(arr).map(inc).all(isEven); },
    underscore: function(arr) { return _.chain(arr).map(inc).every(isEven); },
    lodash: function(arr) { return lodash(arr).map(inc).every(isEven); },
    sugar: function(arr) { return arr.map(inc).all(isEven); },
    linq: function(arr) { return Enumerable.From(arr).Select(inc).All(isEven); },
    jslinq: function(arr) { return JSLINQ(arr).Select(inc).All(isEven); },
    from: function(arr) { return from(arr).select(inc).all(isEven); },
    ix: function(arr) { return Ix.Enumerable.fromArray(arr).select(inc).all(isEven); },
    boiler: function(arr) { return boiler.chain(arr).map(inc).all(isEven); },
    valueOnly: true
  });

  // These aren't really comparisons to Underscore or Lo-Dash; rather, they're
  // comparisons to the native Array.join, String.split, and String.match
  // methods. But designating them as such at the UI level will require some
  // refactoring. For now, I think it's fine to put them here.
  compareAlternatives("map -> join", {
    lazy: function(arr) { return Lazy(arr).map(inc).join(", "); },
    underscore: function(arr) { return _(arr).map(inc).join(", "); },
    valueOnly: true
  });

  compareAlternatives("split(string) -> take", {
    lazy: function(str, delimiter) { return Lazy(str).split(delimiter).take(5); },
    underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
    inputs: [[Lazy.range(100).join(", "), ", "]]
  });

  compareAlternatives("split(regex) -> take", {
    lazy: function(str, delimiter) { return Lazy(str).split(delimiter).take(5); },
    underscore: function(str, delimiter) { return _(str.split(delimiter)).take(5); },
    inputs: [[Lazy.range(100).join(", "), /,\s*/]]
  });

  compareAlternatives("match(regex) -> take", {
    lazy: function(str, pattern) { return Lazy(str).match(pattern).take(5); },
    underscore: function(str, pattern) { return _(str.match(pattern)).take(5); },
    inputs: [[Lazy.range(100).join(" "), /\d+/g]]
  });
});
