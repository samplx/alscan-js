/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018, 2025 James Burlingame
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

import { Reporter } from "../lib/reporter.ts";

describe('reporter', () => {
    describe('constructor', () => {
        test('normal', () => {
            const r = new Reporter();
        });
    });

    describe('padZero', () => {
        const r = new Reporter();
        test('(1, 2)', () => {
            assert.equal(r.padZero(1, 2), '01');
        });
        test('(0, 2)', () => {
            assert.equal(r.padZero(0, 2), '00');
        });
        test('(100, 2)', () => {
            assert.equal(r.padZero(100, 2), '100');
        });
        test('("x", 2)', () => {
            assert.equal(r.padZero('x' as unknown as number, 2), '0x');
        });
    });

    describe('padField', () => {
        const r = new Reporter();
        test('("x", 2)', () => {
            assert.equal(r.padField('x', 2), ' x');
        });
        test('("xxx", 2)', () => {
            assert.equal(r.padField('xxx', 2), 'xxx');
        });
        test('("xx", 2)', () => {
            assert.equal(r.padField('xx', 2), 'xx');
        });
    });

    describe('padFieldRight', () => {
        const r = new Reporter();
        test('("x", 2)', () => assert.equal(r.padFieldRight('x', 2), 'x '));
        test('("xxx", 2)', () => assert.equal(r.padFieldRight('xxx', 2), 'xxx'));
        test('("xx", 2)', () => assert.equal(r.padFieldRight('xx', 2), 'xx'));
    });

    describe('getTimestamp', () => {
        const months: Array<number> = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
        const days = [ 1, 10, 20, 28 ];

        for (const month of months) {
            for (const day of days) {
                const r = new Reporter();
                const time = new Date(Date.UTC(2010, month, day, 12, 34, 56, 0));
                const timeString = time.toString();
                test(`getTimestamp("${timeString}")`, () => {
                    //            0         1         2         3
                    //            0123456789012345678901234567890123456789
                    // timeString=Fri Jan 01 2010 06:34:56 GMT-0600 (CST)
                    // timestamp =01/Jan/2010:06:34:56 -0600
                    const timestamp = r.getTimestamp(time.getTime());
                    assert.equal(timestamp.substr(0, 2), timeString.substr(8, 2));
                    assert.equal(timestamp.charAt(2), '/');
                    assert.equal(timestamp.substr(3, 3), timeString.substr(4, 3));
                    assert.equal(timestamp.charAt(6), '/');
                    assert.equal(timestamp.substr(7, 4), timeString.substr(11, 4));
                    assert.equal(timestamp.charAt(11), ':');
                    assert.equal(timestamp.substr(12, 2), timeString.substr(16, 2));
                    assert.equal(timestamp.charAt(14), ':');
                    assert.equal(timestamp.substr(15, 2), timeString.substr(19, 2));
                    assert.equal(timestamp.charAt(17), ':');
                    assert.equal(timestamp.substr(18, 2), timeString.substr(22, 2));
                    assert.equal(timestamp.charAt(20), ' ');
                    assert.equal(timestamp.substr(21, 5), timeString.substr(28, 5));
                });
            }
        }
    });


    describe('getDatestamp', () => {
        const months: Array<number> = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
        const days = [ 1, 10, 20, 28 ];

        for (const month of months) {
            for (const day of days) {
                const r = new Reporter();
                const time = new Date(Date.UTC(2010, month, day, 12, 34, 56, 0));
                const timeString = time.toString();
                test(`getDatestamp("${timeString}")`, () => {
                    //            0         1         2         3
                    //            0123456789012345678901234567890123456789
                    // timeString=Fri Jan 01 2010 06:34:56 GMT-0600 (CST)
                    // timestamp =01/Jan/2010:06:34:56 -0600
                    const timestamp = r.getDatestamp(time);
                    assert.equal(timestamp.substr(0, 2), timeString.substr(8, 2));
                    assert.equal(timestamp.charAt(2), '/');
                    assert.equal(timestamp.substr(3, 3), timeString.substr(4, 3));
                    assert.equal(timestamp.charAt(6), '/');
                    assert.equal(timestamp.substr(7, 4), timeString.substr(11, 4));
                    assert.equal(timestamp.charAt(11), ':');
                    assert.equal(timestamp.substr(12, 2), timeString.substr(16, 2));
                    assert.equal(timestamp.charAt(14), ':');
                    assert.equal(timestamp.substr(15, 2), timeString.substr(19, 2));
                    assert.equal(timestamp.charAt(17), ':');
                    assert.equal(timestamp.substr(18, 2), timeString.substr(22, 2));
                    assert.equal(timestamp.charAt(20), ' ');
                    assert.equal(timestamp.substr(21, 5), timeString.substr(28, 5));
                });
            }
        }
    });

    describe('getBytesString()', () => {
        const r = new Reporter();
        describe('length', () => {
            var nBytes = 1;
            while (nBytes < 1e21) {
                test('getBytesString(' + nBytes + ') length', () => {
                    assert.equal(r.getBytesString(nBytes).length, 10);
                });
                nBytes *= 2;
            }
        });

        test('getBytesString(0)', () => {
            const result = r.getBytesString(0);
            assert.equal(result.length, 10);
            assert.equal(result, '   0     B');
        });
    });

    describe('getBPS()', () => {
        const r = new Reporter();
        describe('length', () => {
            var nBytes = 1;
            var elapsed = 1;
            while (nBytes < 5e22) {
                test('getBPS(' + nBytes + ', ' + elapsed + ') length', () => {
                    const s = r.getBPS(nBytes, elapsed);
                    assert.equal(s.length, 11);
                });
                nBytes *= 2;
                elapsed += 1;
            }
        });
        test('getBPS(nBytes, 0)', () => {
            const result = r.getBPS(4096, 0);
            assert.equal(result, '    NaN    ');
        });
    });

    describe('getTimestampHeader()', () => {
        const r = new Reporter();

        const testCase = (r: Reporter, firstDay: number, lastDay: number, stopDay: number, expectedWidth: number) => {
            const start = new Date(2001, 0, 2, 6, 0, 0, 0);
            const first = new Date(2001, 0, firstDay, 7, 0, 0, 0);
            const last = new Date(2001, 0, lastDay, 8, 0, 0, 0);
            const stop = new Date(2001, 0, stopDay, 9, 0, 0, 0);
            const title = 'title';
            const header = r.getTimestampHeader(start, first, last, stop, title);
            assert.equal(header.length, expectedWidth);
        };

        test('timezones and dates all match', () => {
            testCase(r, 2, 2, 2, 66);
        });

        test('timezones and start/first dates match', () => {
            testCase(r, 2, 3, 4, 90);
        });

        test('timezones and last/stop dates match', () => {
            testCase(r, 3, 4, 4, 90);
        });

        test('timezones match, no dates', () => {
            testCase(r, 3, 4, 5, 102);
        });

        test('full width', () => {
            const start = new Date(2001, 0, 2, 6, 0, 0);
            const first = new Date(2001, 1, 3, 7, 0, 0);
            const last  = new Date(2001, 6, 4, 8, 0, 0);
            const stop  = new Date(2001, 11, 5, 9, 0, 0);
            const title = 'title';
            const header = r.getTimestampHeader(start, first, last, stop, title);
            const timezone = start.toString().substr(28, 5);
            var tzSame = true;
            if ( (timezone != first.toString().substr(28, 5)) ||
                (timezone != last.toString().substr(28, 5))  ||
                (timezone != stop.toString().substr(28, 5)) ) {
                tzSame = false;
            }
            if (tzSame) {
                assert.equal(header.length, 102);
            } else {
                assert.equal(header.length, 120);
            }

        });
    });
});
