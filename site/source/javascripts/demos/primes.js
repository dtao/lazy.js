function addValue(value) {
  // Create a <span> element containing the value
  var span = document.createElement('span');
  span.textContent = value;

  // Append it to the <div>
  var div = document.querySelector('div');
  div.appendChild(span);

  // Scroll down, if necessary
  if (Math.abs((div.scrollHeight - div.offsetHeight) - div.scrollTop) < 50) {
    span.scrollIntoView()
  }
}

var knownPrimes = [];

function isPossibleFactor(value) {
  return function(x) {
    return x * x <= value;
  };
}

function isDivisibleBy(value) {
  return function(x) {
    return value % x === 0;
  };
}

function isPrime(value) {
  var prime = !Lazy(knownPrimes)
    .filter(isPossibleFactor(value))
    .any(isDivisibleBy(value));

  if (prime) {
    knownPrimes.push(value);
  }

  return prime;
}

Lazy.generate(function(i) { return 2 + i; })
  .filter(isPrime)
  .async()
  .each(addValue);
