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

const request = require('../lib/request.js');
const RequestReport = request.RequestReport;
const Tick = require('../lib/tick.js').Tick;

describe('request', () => {
    describe('constructor', () => {
        test('direct function call produces object', () => {
            const result = RequestReport();
            expect(result instanceof RequestReport).toBeTruthy();
        });
        test('new DenyReport() produces object', () => {
            const result = new RequestReport();
            expect(result instanceof RequestReport).toBeTruthy();
        });
    });

    describe('report', () => {
        var r;
        var output;
        beforeEach(() => {
            r = new RequestReport();
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
            const tick = new Tick(r.start.getTime() + 100, 1, 'line 1');
            r.report([tick]);
            expect(output.mock.calls.length).toBe(1);
        });
        test('two ticks, same date', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 1, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 2');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(2);
        });
        test('two ticks, same request', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 1');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(2);
        });
        test('two ticks, one request undefined', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, undefined);
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(1);
        });
        test('two ticks, second past slotWidth', () => {
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            r.report([tick1, tick2]);
            expect(output.mock.calls.length).toBe(2);
        });
    });
});
