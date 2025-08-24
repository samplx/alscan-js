/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2018, 2025 James Burlingame
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

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { getDataDirectory } from "../test/testData.ts";
import { LineStream } from "../lib/lines.ts";

const dataDirectory = path.join(getDataDirectory(), 'lines');

describe('lines', () => {
    test('test end-of-file on end-of-line', (_t, done) => {
        const testStream = new LineStream({ encoding: 'utf8' });
        const inputStream = fs.createReadStream(path.join(dataDirectory, 'lines'), { encoding: 'utf8' });
        let lineNumber  = 1;

        testStream.on('data', (chunk) => {
            let n: number;
            if (chunk.substr(-1) == '\n') {
                n = parseInt(chunk.substr(0, chunk.length-1), 10);
            } else {
                n = parseInt(chunk, 10);
            }

            assert.equal(n, lineNumber);
            lineNumber += 1;
        });

        testStream.on('end', function () {
            done();
        });
        inputStream.pipe(testStream);
    });

    test('test end-of-file before end-of-line', (_t, done) => {
        const testStream = new LineStream({ encoding: 'utf8' });
        const inputStream = fs.createReadStream(path.join(dataDirectory, 'no-nl'), { encoding: 'utf8' });
        let lineNumber  = 1;

        testStream.on('data', function(chunk) {
            let n: number;
            if (chunk.substr(-1) == '\n') {
                n = parseInt(chunk.substr(0, chunk.length-1), 10);
            } else {
                n = parseInt(chunk, 10);
            }

            assert.equal(n, lineNumber);
            lineNumber += 1;
        });

        testStream.on('end', function () {
            done();
        });
        inputStream.pipe(testStream);
    });
});
