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
      values: [Race.integers(5), Race.integers(5)],
      size: 5
    },
    {
      name: '2 10-element arrays',
      values: [Race.integers(10), Race.integers(10)],
      size: 10
    },
    {
      name: '2 100-element arrays',
      values: [Race.integers(100), Race.integers(100)],
      size: 100
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

function sequenceComparer(x, y) {
  x = evaluateSequence(x, y);
  y = evaluateSequence(y, x);

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

function addRace(name, inputs, impls) {
  if (!selectedRace || name === selectedRace) {
    marathon.add(new Race({
      description: name,
      inputs: inputs,
      impls: {
        lazy: ensureLazyIteration(impls.lazy),
        lodash: ensureLodashIteration(impls.lodash)
      },
      comparer: sequenceComparer
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
      }
    }));
    console.log('');
  }
});
