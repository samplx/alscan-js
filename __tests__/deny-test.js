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

const deny = require('../lib/deny.js');
const DenyReport = deny.DenyReport;
const Tick = require('../lib/tick.js').Tick;

describe('deny', () => {
    describe('constructor', () => {
        test('direct function call produces object', () => {
            const result = DenyReport();
            expect(result instanceof DenyReport).toBeTruthy();
        });
        test('new DenyReport() produces object', () => {
            const result = new DenyReport();
            expect(result instanceof DenyReport).toBeTruthy();
        });
    });

    describe('report', () => {
        var r;
        var output;
        beforeEach(() => {
            r = new DenyReport();
            output = jest.fn();
            r.output.write = output;
            r.limit = Infinity;
            r.category = 'ips';
            r.start = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            r.stop = new Date(Date.UTC(2001, 0, 1, 23, 59, 59, 0));
            r.slotWidth = 60;
        });
        test('nothing to report', () => {
            r.report([]);
            expect(output.mock.calls.length).toBe(0);
        });
        test('single tick', () => {
            const tick = new Tick(r.start.getTime() + 100, 1, '127.0.0.1');
            r.report([tick]);
            expect(output.mock.calls.length).toBe(1);
        });
        test('two ticks, same date', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 1, '127.0.0.1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, '10.0.0.1');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(2);
        });
        test('two ticks, same IP', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, '127.0.0.1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, '127.0.0.1');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(1);
        });
        test('two ticks, second past slotWidth', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, '127.0.0.1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, '10.0.0.1');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(2);
        });
    });
});
