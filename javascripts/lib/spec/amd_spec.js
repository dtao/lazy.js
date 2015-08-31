var path = require('path'),
    requirejs = require('requirejs'),
    test_path = path.join(__dirname, 'amd_spec_test.js');

requirejs([test_path]);
