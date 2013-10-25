Benchmark.options.maxTime = 1;

function assertEquality(actual, expected) {
  if (actual instanceof Lazy.Sequence) {
    actual = actual.toArray();
  }
  expect(actual).toEqual(expected);
}
