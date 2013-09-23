// Exposing Benchmark to the global object so that we can make adjustments
// (i.e., maxTime, below) that will affect race.js.
global.Benchmark = require('benchmark');

var Lazy        = require('../lazy.js'),
    lodash      = require('lodash'),
    Race        = require('race.js'),
    stringTable = require('string-table');

Benchmark.options.maxTime = 0.5;

var selectedRace = null;

if (process.argv.length > 2) {
  selectedRace = process.argv[2];
  console.log('Just going to run "' + selectedRace + '" race');

} else {
  console.log('Running all races...');
}

function identity(x) {
  return x;
}

function increment(x) {
  return x + 1;
}

function isEven(x) {
  return x % 2 === 0;
}

function lastLetter(str) {
  return str.charAt(str.length - 1);
}

function randomNumber(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

function randomNumbers(count, min, max) {
  var getRandomNumber = function() {
    return randomNumber(min, max);
  };

  return Lazy.generate(getRandomNumber, count).toArray();
}

function numbersInput() {
  return Race.inputs.arraysOfIntegers([5, 10, 100]);
}

function randomNumbersInput() {
  return Race.inputs.arraysOfRandomIntegers([5, 10, 100]);
}

function doubleNumbersInput() {
  return [
    {
      name: '2 5-element arrays',
      values: [Race.utils.integers(5), Race.utils.integers(5, 3)],
      size: 5
    },
    {
      name: '2 10-element arrays',
      values: [Race.utils.integers(10), Race.utils.integers(10, 5)],
      size: 10
    },
    {
      name: '2 100-element arrays',
      values: [Race.utils.integers(100), Race.utils.integers(100, 50)],
      size: 100
    }
  ];
}

function nestedNumbersInput() {
  return [
    {
      name: 'small nested array',
      values: [
        [1, 2, [3, 4, [5, 6], 7, 8], 9, 10]
      ],
      size: 10
    },
    {
      name: 'medium nested array',
      values: [
        [1, 2, 3, [4, 5], [6, 7, [8, 9, 10, 11], 12], 13, 14, [15, 16], 17, [18, [19, [20]]]]
      ],
      size: 20
    }
  ];
}

function wordsInput() {
  return Race.inputs.arraysOfStrings([5, 10, 100]);
}

function evaluateSequence(value, other) {
  if (value instanceof Lazy.Sequence) {
    if (other instanceof Array) {
      return value.toArray();
    }

    return value.toObject();
  }

  return value;
}

function orderAwareComparer(x, y) {
  x = evaluateSequence(x, y);
  y = evaluateSequence(y, x);

  return Race.compare(x, y);
}

function orderAgnosticComparer(x, y) {
  x = Lazy(x).sortBy(identity).toArray();
  y = Lazy(y).sortBy(identity).toArray();

  return Race.compare(x, y);
}

var marathon = new Race.Marathon();

function ensureLazyIteration(impl) {
  return function() {
    var sequence = Race.fastApply(impl, arguments);
    sequence.each(function(x, i) {});
    return sequence;
  };
}

function ensureLodashIteration(impl) {
  return function() {
    var result = Race.fastApply(impl, arguments);
    lodash.each(result, function(x, i) {});
    return result;
  };
}

function addRace(name, inputs, options) {
  if (!selectedRace || name === selectedRace) {
    marathon.add(new Race({
      description: name,
      inputs: inputs,
      impls: {
        lazy: options.valueOnly ? options.lazy : ensureLazyIteration(options.lazy),
        lodash: options.valueOnly ? options.lodash : ensureLodashIteration(options.lodash)
      },
      comparer: options.comparer || orderAwareComparer
    }));
  }
}

addRace('map', numbersInput(), {
  lazy: function(array) { return Lazy(array).map(increment); },
  lodash: function(array) { return lodash.map(array, increment); }
});

addRace('filter', numbersInput(), {
  lazy: function(array) { return Lazy(array).filter(isEven); },
  lodash: function(array) { return lodash.filter(array, isEven); }
});

addRace('sortBy', wordsInput(), {
  lazy: function(array) { return Lazy(array).sortBy(lastLetter); },
  lodash: function(array) { return lodash.sortBy(array, lastLetter); }
});

addRace('groupBy', wordsInput(), {
  lazy: function(array) { return  Lazy(array).groupBy(lastLetter); },
  lodash: function(array) { return lodash.groupBy(array, lastLetter); }
});

addRace('countBy', wordsInput(), {
  lazy: function(array) { return Lazy(array).countBy(lastLetter); },
  lodash: function(array) { return lodash.countBy(array, lastLetter); }
});

addRace('uniq', randomNumbersInput(), {
  lazy: function(array) { return Lazy(array).uniq(); },
  lodash: function(array) { return lodash.uniq(array); }
});

addRace('zip', doubleNumbersInput(), {
  lazy: function(array, other) { return Lazy(array).zip(other); },
  lodash: function(array, other) { return lodash.zip(array, other); }
});

addRace('shuffle', randomNumbersInput(), {
  lazy: function(array) { return Lazy(array).shuffle(); },
  lodash: function(array) { return lodash.shuffle(array); },
  comparer: orderAgnosticComparer
});

addRace('flatten', nestedNumbersInput(), {
  lazy: function(array) { return Lazy(array).flatten(); },
  lodash: function(array) { return lodash.flatten(array); }
});

addRace('difference', doubleNumbersInput(), {
  lazy: function(array, other) { return Lazy(array).difference(other); },
  lodash: function(array, other) { return lodash.difference(array, other); }
});

addRace('union', doubleNumbersInput(), {
  lazy: function(array, other) { return Lazy(array).union(other); },
  lodash: function(array, other) { return lodash.union(array, other); }
});

addRace('intersection', doubleNumbersInput(), {
  lazy: function(array, other) { return Lazy(array).intersection(other); },
  lodash: function(array, other) { return lodash.intersection(array, other); }
});

addRace('max', numbersInput(), {
  lazy: function(array) { return Lazy(array).max(); },
  lodash: function(array) { return lodash.max(array); },
  valueOnly: true
});

addRace('map-max', numbersInput(), {
  lazy: function(array) { return Lazy(array).map(increment).max(); },
  lodash: function(array) { return lodash.max(lodash.map(array, increment)); },
  valueOnly: true
});

addRace('map-filter-max', numbersInput(), {
  lazy: function(array) { return Lazy(array).map(increment).filter(isEven).max(); },
  lodash: function(array) { return lodash.max(lodash.filter(lodash.map(array, increment), isEven)); },
  valueOnly: true
});

function formatWinner(winner) {
  return winner.impl + ' (by ' + (winner.margin * 100).toFixed(2) + '%)';
}

function formatOverallWinner(resultGroups) {
  var winners = Lazy(resultGroups)
    .countBy(function(resultGroup) {
      return resultGroup.winner.impl;
    })
    .toObject();

  if (Object.keys(winners).length === 1) {
    return Lazy(winners).keys().first();
  }

  var breakdown = Lazy(winners)
    .map(function(count, winner) {
      return winner + ' - ' + count
    })
    .join(', ');

  return 'mixed (' + breakdown + ')';
}

marathon.start({
  start: function(race) {
    console.log('Starting "' + race.description + '" race...');
  },

  result: function(result) {
    console.log(' * ' + [
      result.input.name,
      result.impl,
      result.perf.toFixed(3) + ' ops/sec'
    ].join('\t'));
  },

  mismatch: function(outputs) {
    console.log(' * mismatch for the "' + outputs.input.name + '" case!');
  },

  complete: function(resultGroups) {
    console.log(' * WINNER: ' + formatOverallWinner(resultGroups));
    console.log('');
  },

  marathonComplete: function(resultGroups) {
    var dataObjects = Lazy(resultGroups)
      .map(function(resultGroup) {
        var dataObject = {
          'race': resultGroup.race,
          'input size': resultGroup.input.size
        };

        Lazy(resultGroup.results).each(function(perf, impl) {
          dataObject[impl] = perf;
        });

        dataObject.winner = formatWinner(resultGroup.winner);

        return dataObject;
      })
      .toArray();

    console.log(stringTable.create(dataObjects, {
      typeFormatters: {
        'number': function(value) {
          return Number(value.toFixed(3));
        }
      },
      capitalizeHeaders: true
    }));
    console.log('');
  }
});
