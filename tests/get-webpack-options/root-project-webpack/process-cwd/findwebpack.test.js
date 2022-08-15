const { test } = require('uvu');
const assert = require('uvu/assert');
const { getWebpackOptions } = require('../../../../src/index');

test('getWebpackOptions / tryRootProjectWebpack / process-cwd', () => {
    assert.ok(getWebpackOptions());
});

test.run();
