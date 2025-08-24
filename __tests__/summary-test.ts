/*
 *     Copyright 2018, 2025 James Burlingame
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

import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

import { Tick } from "../lib/tick.ts";
import { SummaryReport } from "../lib/summary.ts";

describe('request', () => {
    describe('constructor', () => {
        test('new SummaryReport() produces object', () => {
            const result = new SummaryReport();
            assert.ok(result instanceof SummaryReport);
        });
    });

    describe('report', () => {
        var r: SummaryReport;
        beforeEach(() => {
            r = new SummaryReport();
            r.output = mock.fn((s: string) => {});
            r.limit = Infinity;
            r.category = 'ips';
            r.start = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            r.stop = new Date(Date.UTC(2001, 0, 1, 23, 59, 59, 0));
            r.slotWidth = 60;
        });
        test('nothing to report, not terse', () => {
            r.report([]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 1);
            const call = output.mock.calls[0];
            assert.equal(call.arguments[0], 'No entires match search criteria.');
        });
        test('nothing to report, terse', () => {
            r.terse = true;
            r.report([]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 0);
        });
        test('single tick, not terse', () => {
            assert.ok(r.start);
            const tick = new Tick(r.start.getTime() + 100, 1, 'line 1');
            r.report([tick]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 4);
        });
        test('single tick, terse', () => {
            r.terse = true;
            assert.ok(r.start);
            const tick = new Tick(r.start.getTime() + 100, 1, 'line 1');
            r.report([tick]);
            // output.mock.calls.forEach(ar => console.log(ar[0]));
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 2);
        });
        test('two ticks, same date, not terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 1, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 2');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 6);
        });
        test('two ticks, same date, terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 1, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 2');
            r.terse = true;
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 3);
        });
        test('two ticks, same request, not terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 1');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 4);
        });
        test('two ticks, same request, terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'line 1');
            r.terse = true;
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 2);
        });
        test('two ticks, one request undefined, not terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, undefined);
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 6);
        });
        test('two ticks, one request undefined, terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, undefined);
            r.terse = true;
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 3);
        });
        test('two ticks, second past slotWidth, not terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 11);
        });
        test('two ticks, second past slotWidth, terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            r.terse = true;
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 5);
        });
        test('two ticks, slotWidth = Infinity, terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            r.terse = true;
            r.slotWidth = Infinity;
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 3);
        });
        test('two ticks, before and after, second past slotWidth, terse', () => {
            assert.ok(r.start);
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            assert.ok(r.stop);
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.terse = true;
            r.report([before, before, tick1, tick2, after]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 7);
        });
        test('two ticks, 2 before and 1 after, second past slotWidth, not terse', () => {
            assert.ok(r.start);
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            assert.ok(r.stop);
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.report([before, before, tick1, tick2, after]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 17);
        });
        test('two ticks, 1 before and 2 after, second past slotWidth, not terse', () => {
            assert.ok(r.start);
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'line 2');
            assert.ok(r.stop);
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.report([before, tick1, tick2, after, after]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 17);
        });
        test('no ticks, 1 before and 2 after, not terse', () => {
            assert.ok(r.start);
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            assert.ok(r.stop);
            const after = new Tick(r.stop.getTime() + 100, 0, 'after');
            r.keepOutside = true;
            r.report([before, after, after]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 6);
        });
        test('no ticks, 1 before and 2 after, not terse', () => {
            assert.ok(r.start);
            const before = new Tick(r.start.getTime() - 100, 0, 'before');
            r.keepOutside = true;
            r.report([before, before]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 3);
        });
        test('three ticks, 2 limit, not terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135, 1, 'line 2');
            const tick3 = new Tick(r.start.getTime() + 135, 1, 'line 3');
            r.limit = 2;
            r.report([tick1, tick2, tick3]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 6);
        });
        test('three ticks, 2 limit, terse', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'line 1');
            const tick2 = new Tick(r.start.getTime() + 135, 1, 'line 2');
            const tick3 = new Tick(r.start.getTime() + 135, 1, 'line 3');
            r.terse = true;
            r.limit = 2;
            r.report([tick1, tick2, tick3]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 3);
        });
    });
});
