/*
 *     Copyright 2018 James Burlingame
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

const summary = require('../lib/summary.js');
const SummaryReport = summary.SummaryReport;
const Tick = require('../lib/tick.js').Tick;

describe('request', () => {
    describe('constructor', () => {
        test('direct function call produces object', () => {
            const result = SummaryReport();
            expect(result instanceof SummaryReport).toBeTruthy();
        });
        test('new DenyReport() produces object', () => {
            const result = new SummaryReport();
            expect(result instanceof SummaryReport).toBeTruthy();
        });
    });

    describe('report', () => {
        var r;
        var output;
        beforeEach(() => {
            r = new SummaryReport();
            output = jest.fn();
            r.output.write = output;
            r.limit = Infinity;
            r.category = 'ips';
            r.start = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            r.stop = new Date(Date.UTC(2001, 0, 1, 23, 59, 59, 0));
            r.slotWidth = 60;
        });
        test('nothing to report, not terse', () => {
            r.report([]);
            expect(output.mock.calls.length).toBe(1);
            expect(output.mock.calls[0][0]).toBe('No entires match search criteria.\n');
        });
        test('nothing to report, terse', () => {
            r.terse = true;
            r.report([]);
            expect(output.mock.calls.length).toBe(0);
        });
        test('single tick, not terse', () => {
            const tick = new Tick(r.start.getTime() + 100, 1, 'line 1');
            r.report([tick]);
            expect(output.mock.calls.length).toBe(4);
        });
        test('single tick, terse', () => {
            r.terse = true;
            const tick = new Tick(r.start.getTime() + 100, 1, 'line 1');
            r.report([tick]);
            // output.mock.calls.forEach(ar => console.log(ar[0]));
            expect(output.mock.calls.length).toBe(2);
        });
        test('two ticks, same date, not terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 1, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 2');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(6);
        });
        test('two ticks, same date, terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 1, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 2');
            r.terse = true;
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(3);
        });
        test('two ticks, same request, not terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 1');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(4);
        });
        test('two ticks, same request, terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 1');
            r.terse = true;
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(2);
        });
        test('two ticks, one request undefined, not terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, undefined);
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(6);
        });
        test('two ticks, one request undefined, terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, undefined);
            r.terse = true;
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(3);
        });
        test('two ticks, second past slotWidth, not terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(11);
        });
        test('two ticks, second past slotWidth, terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            r.terse = true;
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(5);
        });
        test('two ticks, slotWidth = Infinity, terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            r.terse = true;
            r.slotWidth = Infinity;
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(3);
        });
        test('two ticks, before and after, second past slotWidth, terse', () => {
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.terse = true;
            r.report([before, before, tick1, tick2, after]);
            expect(output.mock.calls.length).toBe(7);
        });
        test('two ticks, 2 before and 1 after, second past slotWidth, not terse', () => {
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.report([before, before, tick1, tick2, after]);
            expect(output.mock.calls.length).toBe(17);
        });
        test('two ticks, 1 before and 2 after, second past slotWidth, not terse', () => {
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.report([before, tick1, tick2, after, after]);
            expect(output.mock.calls.length).toBe(17);
        });
        test('no ticks, 1 before and 2 after, not terse', () => {
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.report([before, after, after]);
            expect(output.mock.calls.length).toBe(6);
        });
        test('no ticks, 1 before and 2 after, not terse', () => {
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            r.keepOutside = true;
            r.report([before, before]);
            expect(output.mock.calls.length).toBe(3);
        });
        test('three ticks, 2 limit, not terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135, 1, 'line 2');
            const tick3 = new Tick(r.start.getTime() + 135, 1, 'line 3');
            r.limit = 2;
            r.report([tick1, tick2, tick3]);
            expect(output.mock.calls.length).toBe(6);
        });
        test('three ticks, 2 limit, terse', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135, 1, 'line 2');
            const tick3 = new Tick(r.start.getTime() + 135, 1, 'line 3');
            r.terse = true;
            r.limit = 2;
            r.report([tick1, tick2, tick3]);
            expect(output.mock.calls.length).toBe(3);
        });
    });
});
