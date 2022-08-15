const { test } = require('uvu');
const assert = require('uvu/assert');
const { getWebpackOptions } = require('../../../src/index');

test('getWebpackOptions / tryVueCLIScripts', () => {
    assert.ok(getWebpackOptions());
});

test.run();
