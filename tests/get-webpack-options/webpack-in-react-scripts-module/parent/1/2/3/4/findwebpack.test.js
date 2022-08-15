const { test } = require('uvu');
const assert = require('uvu/assert');
const { getWebpackOptions } = require('../../../../../../../../src/index');

test('getWebpackOptions / tryWebpackInReactScriptsModule', () => {
    assert.ok(getWebpackOptions());
});

// TODO
// test.run();
