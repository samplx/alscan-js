/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018 James Burlingame
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

const reporter = require('../lib/reporter.js');
const Reporter = reporter.Reporter;

var r = null;

describe('reporter', () => {
    beforeEach(() => {
        r = new Reporter();
    });

    describe('constructor', () => {
        test('normal', () => {
            const normal = new Reporter();
            expect(normal).toEqual(r);
        });
        test('direct', () => {
            const direct = Reporter();
            expect(direct).toEqual(r);
        });
    });

    describe('padZero', () => {
        test('(1, 2)', () => expect(r.padZero(1, 2)).toEqual('01'));
        test('(0, 2)', () => expect(r.padZero(0, 2)).toEqual('00'));
        test('(100, 2)', () => expect(r.padZero(100, 2)).toEqual('100'));
        test('("x", 2)', () => expect(r.padZero('x', 2)).toEqual('0x'));
    });

    describe('padField', () => {
        test('("x", 2)', () => expect(r.padField('x', 2)).toEqual(' x'));
        test('("xxx", 2)', () => expect(r.padField('xxx', 2)).toEqual('xxx'));
        test('("xx", 2)', () => expect(r.padField('xx', 2)).toEqual('xx'));
    });

    describe('padFieldRight', () => {
        test('("x", 2)', () => expect(r.padFieldRight('x', 2)).toEqual('x '));
        test('("xxx", 2)', () => expect(r.padFieldRight('xxx', 2)).toEqual('xxx'));
        test('("xx", 2)', () => expect(r.padFieldRight('xx', 2)).toEqual('xx'));
    });

    describe('getTimestamp', () => {
        const months = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
        const days = [ 1, 10, 20, 28 ];

        months.forEach((month) => {
            days.forEach((day) => {
                const time = new Date(Date.UTC(2010, month, day, 12, 34, 56, 0));
                const timeString = time.toString();
                test('getTimestamp("' + timeString + '")', () => {
                    //            0         1         2         3
                    //            0123456789012345678901234567890123456789
                    // timeString=Fri Jan 01 2010 06:34:56 GMT-0600 (CST)
                    // timestamp =01/Jan/2010:06:34:56 -0600
                    const timestamp = r.getTimestamp(time);
                    expect(timestamp.substr(0, 2)).toEqual(timeString.substr(8, 2));
                    expect(timestamp.charAt(2)).toEqual('/');
                    expect(timestamp.substr(3, 3)).toEqual(timeString.substr(4, 3));
                    expect(timestamp.charAt(6)).toEqual('/');
                    expect(timestamp.substr(7, 4)).toEqual(timeString.substr(11, 4));
                    expect(timestamp.charAt(11)).toEqual(':');
                    expect(timestamp.substr(12, 2)).toEqual(timeString.substr(16, 2));
                    expect(timestamp.charAt(14)).toEqual(':');
                    expect(timestamp.substr(15, 2)).toEqual(timeString.substr(19, 2));
                    expect(timestamp.charAt(17)).toEqual(':');
                    expect(timestamp.substr(18, 2)).toEqual(timeString.substr(22, 2));
                    expect(timestamp.charAt(20)).toEqual(' ');
                    expect(timestamp.substr(21, 5)).toEqual(timeString.substr(28, 5));
                });
            });
        });
    });

    describe('getBytesString()', () => {
        describe('length', () => {
            var nBytes = 1;
            while (nBytes < 1e21) {
                test('getBytesString(' + nBytes + ') length', () => {
                    expect(r.getBytesString(nBytes).length).toBe(10);
                });
                nBytes *= 2;
            }
        });

        test('getBytesString(0)', () => {
            const result = r.getBytesString(0);
            expect(result.length).toBe(10);
            expect(result).toBe('   0     B');
        });
    });

    describe('getBPS()', () => {
        describe('length', () => {
            var nBytes = 1;
            var elapsed = 1;
            while (nBytes < 5e22) {
                test('getBPS(' + nBytes + ', ' + elapsed + ') length', () => {
                    const s = r.getBPS(nBytes, elapsed);
                    expect(s.length).toBe(11);
                });
                nBytes *= 2;
                elapsed += 1;
            }
        });
        test('getBPS(nBytes, 0)', () => {
            const result = r.getBPS(4096, 0);
            expect(result).toBe('    NaN    ');
        });
    });

    describe('getTimestampHeader()', () => {
        const testCase = (r, firstDay, lastDay, stopDay, expectedWidth) => {
            const start = new Date(2001, 0, 2, 6, 0, 0, 0);
            const first = new Date(2001, 0, firstDay, 7, 0, 0, 0);
            const last = new Date(2001, 0, lastDay, 8, 0, 0, 0);
            const stop = new Date(2001, 0, stopDay, 9, 0, 0, 0);
            const title = 'title';
            const header = r.getTimestampHeader(start, first, last, stop, title);
            expect(header.length).toBe(expectedWidth);
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
                expect(header.length).toBe(102);
            } else {
                expect(header.length).toBe(120);
            }

        });
    });

    describe('reportError', () => {
        test('message is written to stderr', () => {
            var mymessage = null;
            const myerr = {
                write: (msg) => { mymessage = msg; }
            };
            r.stderr = myerr;
            r.reportError(new Error('message'));
            expect(mymessage).toContain('message');
        });
    });

    describe('report', () => {
        test('stub message is written to stderr', () => {
            var mymessage = null;
            const myerr = {
                write: (msg) => { mymessage = msg; }
            };
            r.stderr = myerr;
            r.report();
            expect(mymessage).toEqual('Reporter::report: stub');
        });
    });
});
