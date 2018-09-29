/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2018 James Burlingame
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

// enable JavaScript strict mode.
'use strict';

// module imports
const fs = require('fs');
const path = require('path');

const testData = require('../test/testData.js');

const lines = require('../lib/lines.js');

describe('lines', () => {
    var dataDirectory;
    var testStream;

    beforeEach(() => {
        dataDirectory = path.join(testData.getDataDirectory(), 'lines');
        testStream = new lines.LineStream({ encoding: 'utf8' });
    });

    test('test end-of-file on end-of-line', done => {
        var inputStream = fs.createReadStream(path.join(dataDirectory, 'lines'), { encoding: 'utf8' });
        var lineNumber  = 1;

        testStream.on('data', function(chunk) {
            var n;
            if (chunk.substr(-1) == '\n') {
                n = parseInt(chunk.substr(0, chunk.length-1), 10);
            } else {
                n = parseInt(chunk, 10);
            }

            expect(n).toBe(lineNumber);
            lineNumber += 1;
        });

        testStream.on('end', function () {
            done();
        });
        inputStream.pipe(testStream);
    });

    test('test end-of-file before end-of-line', done => {
        var inputStream = fs.createReadStream(path.join(dataDirectory, 'no-nl'), { encoding: 'utf8' });
        var lineNumber  = 1;

        testStream.on('data', function(chunk) {
            var n;
            if (chunk.substr(-1) == '\n') {
                n = parseInt(chunk.substr(0, chunk.length-1), 10);
            } else {
                n = parseInt(chunk, 10);
            }

            expect(n).toBe(lineNumber);
            lineNumber += 1;
        });

        testStream.on('end', function () {
            done();
        });
        inputStream.pipe(testStream);
    });

    test('calling constructor function directly', () => {
        const obj = lines.LineStream({ encoding: 'utf8' });

        expect(obj).toBeDefined();
        expect(obj._buffer).toBe('');
    });
});
