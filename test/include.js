// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var test = require('tape');

var Thrift = require('../thrift').Thrift;
var path = require('path');

test('loads a thrift file with imports synchronously', function t(assert) {
    var mainThrift = makeThriftLoader('include-parent.thrift')();
    var importedThrift = makeThriftLoader('include-child.thrift')();

    var typeImportedByMainThrift = mainThrift
        .types
        .BatchGetResponse
        .fieldsByName
        .items
        .valueType
        .rw
        .valueType;

    var typeFromImportedThrift = importedThrift.types.Item;

    assert.equal(typeImportedByMainThrift, typeFromImportedThrift,
        'Type imported correctly');

    var keyValueServiceFunctions = Object.keys(
        mainThrift.services.KeyValue.functionsByName
    );

    assert.deepEqual(
        keyValueServiceFunctions,
        ['get', 'put', 'serviceName', 'healthy'],
        'KeyValue Service has functions inherited from service it extends'
    );

    assert.end();
});

test('bad include paths', function t(assert) {
    assert.throws(
        makeThriftLoader('include-error-not-path.thrift'),
        /Include path string must start with either .\/ or ..\//,
        'include throws without ./ or ../'
    );
    assert.end();
});

test('unknown thrift module name', function t(assert) {
    assert.throws(
        makeThriftLoader('include-error-unknown-module.thrift'),
        /cannot resolve module reference common for common.Item at 2:22/,
        'throws on unknown module'
    );
    assert.end();
});

test('include without explicitly defined namespace', function t(assert) {
    var thrift = makeThriftLoader('include-filename-namespace.thrift')();
    assert.ok(thrift.modulesByName.typedef,
        'modulesByName includes typedef thrift instance');
    assert.end();
});

test('bad thrift module name', function t(assert) {
    assert.throws(
        makeThriftLoader('include-error-invalid-filename-as-namespace.thrift'),
        /Thrift include filename is not valid thrift identifier/,
        'throws when module name from filename is an invalid thrift identifier'
    );
    assert.end();
});

function makeThriftLoader(filename) {
    return function thriftLoader() {
        return Thrift.loadSync({
            thriftFile: path.join(__dirname, filename),
            strict: false
        });
    };
}
