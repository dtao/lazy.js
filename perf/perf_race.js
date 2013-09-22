var Lazy        = require('../lazy.js'),
    lodash      = require('lodash'),
    underscore  = require('underscore'),
    Benchmark   = require('benchmark'),
    Race        = require('race.js'),
    stringTable = require('string-table');

Benchmark.options.maxTime = 0.5;

function increment(x) {
  return x + 1;
}

function isEven(x) {
  return x % 2 === 0;
}

function numbersInput(fn) {
  return [
    {
      name: '10-element array',
      values: [Race.integers(10), fn],
      size: 10
    },
    {
      name: '100-element array',
      values: [Race.integers(100), fn],
      size: 100
    },
    {
      name: '1000-element array',
      values: [Race.integers(1000), fn],
      size: 1000
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

marathon.add(new Race({
  description: 'map',

  impls: {
    'lazy': function(array, fn) {
      var sequence = Lazy(array).map(fn);
      sequence.each(function(x) {});
      return sequence;
    },

    'lodash': function(array, fn) {
      var array = lodash.map(array, fn);
      lodash.each(array, function(x) {});
      return array;
    },

    'underscore': function(array, fn) {
      var array = underscore.map(array, fn);
      underscore.each(array, function(x) {});
      return array;
    }
  },

  inputs: numbersInput(increment),

  comparer: sequenceComparer
}));

marathon.add(new Race({
  description: 'filter',

  impls: {
    'lazy': function(array, fn) {
      var sequence = Lazy(array).filter(fn);
      sequence.each(function(x) {});
      return sequence;
    },

    'lodash': function(array, fn) {
      var array = lodash.filter(array, fn);
      lodash.each(array, function(x) {});
      return array;
    },

    'underscore': function(array, fn) {
      var array = underscore.filter(array, fn);
      underscore.each(array, function(x) {});
      return array;
    }
  },

  inputs: numbersInput(isEven),

  comparer: sequenceComparer
}));

function formatWinner(winner) {
  return winner.impl + ' (by ' + (winner.margin * 100).toFixed(2) + '%)';
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

  marathonComplete: function(resultGroups) {
    var dataObjects = Lazy(resultGroups)
      .map(function(resultGroup) {
        var dataObject = { 'input size': resultGroup.input.size };

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
  }
});
