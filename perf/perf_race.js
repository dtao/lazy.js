var Lazy        = require('../lazy.js'),
    lodash      = require('lodash'),
    underscore  = require('underscore'),
    Benchmark   = require('benchmark'),
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

var alphabet = 'abcdefghijklmnopqrstuvwxyz';
function randomWord() {
  var length = (3 + Math.floor(Math.random() * 7));

  var word = '';
  while (word.length < length) {
    word += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return word;
}

function randomWords(count) {
  return Lazy.generate(randomWord, count).toArray();
}

function numbersInput(fn) {
  return [
    {
      name: '5-element array',
      values: [Race.integers(5), fn],
      size: 5
    },
    {
      name: '10-element array',
      values: [Race.integers(10), fn],
      size: 10
    },
    {
      name: '100-element array',
      values: [Race.integers(100), fn],
      size: 100
    }
  ];
}

function randomNumbersInput() {
  return [
    {
      name: '5 random numbers between 1-3',
      values: [randomNumbers(5, 1, 3)],
      size: 5
    },
    {
      name: '10 random numbers between 1-5',
      values: [randomNumbers(10, 1, 5)],
      size: 10
    },
    {
      name: '100 random numbers between 1-25',
      values: [randomNumbers(100, 1, 25)],
      size: 100
    }
  ]
}

function doubleNumbersInput() {
  return [
    {
      name: '2 5-element arrays',
      values: [Race.integers(5), Race.integers(5, 3)],
      size: 5
    },
    {
      name: '2 10-element arrays',
      values: [Race.integers(10), Race.integers(10, 5)],
      size: 10
    },
    {
      name: '2 100-element arrays',
      values: [Race.integers(100), Race.integers(100, 50)],
      size: 100
    }
  ];
}

function nestedNumbersInput() {
  return [
    {
      name: 'Small nested array',
      values: [
        [1, 2, [3, 4, [5, 6], 7, 8], 9, 10]
      ],
      size: 10
    },
    {
      name: 'Medium nested array',
      values: [
        [1, 2, 3, [4, 5], [6, 7, [8, 9, 10, 11], 12], 13, 14, [15, 16], 17, [18, [19, [20]]]]
      ],
      size: 20
    }
  ];
}

function wordsInput(fn) {
  var words = randomWords(100);

  return [
    {
      name: '5-element array',
      values: [words.slice(0, 5), fn],
      size: 5
    },
    {
      name: '10-element array',
      values: [words.slice(0, 10), fn],
      size: 10
    },
    {
      name: '100-element array',
      values: [words.slice(0, 100), fn],
      size: 100
    }
  ];
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

addRace('map', numbersInput(increment), {
  lazy: function(array, fn) { return Lazy(array).map(fn); },
  lodash: function(array, fn) { return lodash.map(array, fn); }
});

addRace('filter', numbersInput(isEven), {
  lazy: function(array, fn) { return Lazy(array).filter(fn); },
  lodash: function(array, fn) { return lodash.filter(array, fn); }
});

addRace('sortBy', wordsInput(lastLetter), {
  lazy: function(array, fn) { return Lazy(array).sortBy(fn); },
  lodash: function(array, fn) { return lodash.sortBy(array, fn); }
});

addRace('groupBy', wordsInput(lastLetter), {
  lazy: function(array, fn) { return  Lazy(array).groupBy(fn); },
  lodash: function(array, fn) { return lodash.groupBy(array, fn); }
});

addRace('countBy', wordsInput(lastLetter), {
  lazy: function(array, fn) { return Lazy(array).countBy(fn); },
  lodash: function(array, fn) { return lodash.countBy(array, fn); }
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

addRace('map-max', numbersInput(increment), {
  lazy: function(array, fn) { return Lazy(array).map(fn).max(); },
  lodash: function(array, fn) { return lodash.max(lodash.map(array, fn)); },
  valueOnly: true
});

addRace('map-filter-max', numbersInput(increment), {
  lazy: function(array, fn) { return Lazy(array).map(fn).filter(isEven).max(); },
  lodash: function(array, fn) { return lodash.max(lodash.filter(lodash.map(array, fn), isEven)); },
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
