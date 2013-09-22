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

function sequenceComparer(x, y) {
  if (x.toArray) {
    x = x.toArray();
  }

  if (y.toArray) {
    y = y.toArray();
  }

  return Race.compare(x, y);
}

var marathon = new Race.Marathon();

function addRace(name, inputs, impls) {
  if (!selectedRace || name === selectedRace) {
    marathon.add(new Race({
      description: name,
      inputs: inputs,
      impls: impls,
      comparer: sequenceComparer
    }));
  }
}

addRace('map', numbersInput(increment), {
  lazy: function(array, fn) {
    var sequence = Lazy(array).map(fn);
    sequence.each(function(x) {});
    return sequence;
  },

  lodash: function(array, fn) {
    var array = lodash.map(array, fn);
    lodash.each(array, function(x) {});
    return array;
  }
});

addRace('filter', numbersInput(isEven), {
  lazy: function(array, fn) {
    var sequence = Lazy(array).filter(fn);
    sequence.each(function(x) {});
    return sequence;
  },

  lodash: function(array, fn) {
    var array = lodash.filter(array, fn);
    lodash.each(array, function(x) {});
    return array;
  }
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
