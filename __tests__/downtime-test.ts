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
import { DowntimeReport } from "../lib/downtime.ts";

describe('downtime', () => {
    describe('constructor', () => {
        test('new DowntimeReport() produces object', () => {
            const result = new DowntimeReport();
            assert.ok(result instanceof DowntimeReport);
        });
    });

    describe('report', () => {
        let r: DowntimeReport;
        beforeEach(() => {
            r = new DowntimeReport();
            r.output = mock.fn((s: string) => {});
            r.limit = Infinity;
            r.category = 'agent';
            r.start = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            r.stop = new Date(Date.UTC(2001, 0, 1, 23, 59, 59, 0));
            r.slotWidth = 60;
        });
        test('nothing to report', () => {
            r.report([]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 1);
            const call = output.mock.calls[0];
            assert.equal(call.arguments[0], 'No entires match search criteria.');
        });
        test('single tick', () => {
            assert.ok(r.start);
            const tick = new Tick(r.start.getTime() + 100, 1, 'agent');
            r.report([tick]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 3);
        });
        test('two ticks, same date', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 1, 'agent');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, 'agent');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 4);
        });
        test('two ticks, second past stop date', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'agent');
            assert.ok(r.stop);
            const tick2 = new Tick(r.stop.getTime() + 60000, 1, 'agent');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 3);
        });
        test('two ticks, second past slotWidth', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, 'agent');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, 'agent');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 5);
        });
    });
});
