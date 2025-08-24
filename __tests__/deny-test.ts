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
import { DenyReport } from "../lib/deny.ts";

describe('deny', () => {
    describe('constructor', () => {
        test('new DenyReport() produces object', () => {
            const result = new DenyReport();
            assert.ok(result instanceof DenyReport);
        });
    });

    describe('report', () => {
        let r: DenyReport;
        beforeEach(() => {
            r = new DenyReport();
            r.output = mock.fn((s: string) => {});
            r.limit = Infinity;
            r.category = 'ips';
            r.start = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            r.stop = new Date(Date.UTC(2001, 0, 1, 23, 59, 59, 0));
            r.slotWidth = 60;
        });
        test('nothing to report', () => {
            r.report([]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 0);
        });
        test('single tick', () => {
            assert.ok(r.start);
            const tick = new Tick(r.start.getTime() + 100, 1, '127.0.0.1');
            r.report([tick]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 1);
        });
        test('two ticks, same date', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 1, '127.0.0.1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, '10.0.0.1');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 2);
        });
        test('two ticks, same IP', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, '127.0.0.1');
            const tick2 = new Tick(r.start.getTime() + 60000, 1, '127.0.0.1');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 1);
        });
        test('two ticks, second past slotWidth', () => {
            assert.ok(r.start);
            const tick1 = new Tick(r.start.getTime() + 100, 0, '127.0.0.1');
            const tick2 = new Tick(r.start.getTime() + 135000, 1, '10.0.0.1');
            r.report([tick1, tick2]);
            const output = r.output as test.Mock<(s: string) => void>;
            assert.equal(output.mock.callCount(), 2);
        });
    });
});
