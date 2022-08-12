const { test } = require('uvu');
const assert = require('uvu/assert');
const { getWebpackOptions } = require('../../../src/index');

test('getWebpackOptions / tryEjectedReactScripts', () => {
    assert.ok(getWebpackOptions());
});

test.run();
