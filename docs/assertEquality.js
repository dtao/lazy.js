this.assertEquality = function(expected, actual) {
  if (actual !== actual) {
    expect(actual).toBeNaN();
    return;
  }

  if (actual instanceof Lazy.ObjectLikeSequence) {
    actual = actual.toObject();
  } else if (actual instanceof Lazy.StringLikeSequence) {
    actual = actual.toString();
  } else if (actual instanceof Lazy.Sequence) {
    actual = actual.toArray();
  }
  expect(actual).toEqual(expected);
};
