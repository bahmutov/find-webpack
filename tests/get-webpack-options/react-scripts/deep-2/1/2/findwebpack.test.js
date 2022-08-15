const { test } = require('uvu');
const assert = require('uvu/assert');
const { getWebpackOptions } = require('../../../../../../src/index');

test('getWebpackOptions / tryReactScripts / deep 2', () => {
    assert.ok(getWebpackOptions());
});

test.run();
