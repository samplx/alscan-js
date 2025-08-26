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
import { Tick } from "../lib/tick.ts";
import { TimeSlot } from "../lib/timeslot.ts";

describe('timeslot', () => {
    const getTimeSlot = (opts?: Record<string, unknown>): TimeSlot => {
        const ticks = [];
        const time = new Date(2001, 0, 10, 12, 34, 56);
        const start = new Date(2001, 0, 10, 0, 0, 0);
        const stop = new Date(2001, 0, 10, 23, 59, 59);
        const options = opts || {};

        for (let n=0; n < 100; n++) {
            ticks.push(new Tick(time.getTime()+n, n, 'item #' + n));
        }
        return new TimeSlot(ticks, 0, 99, start.getTime(), stop.getTime(), options);
    };

    describe('constructor', () => {
        test('with new', () => {
            const ticks = [];
            const time = new Date(2001, 0, 10, 12, 34, 56);
            const start = new Date(2001, 0, 10, 0, 0, 0);
            const stop = new Date(2001, 0, 10, 23, 59, 59);
            const options = {};

            for (let n=0; n < 100; n++) {
                ticks.push(new Tick(time.getTime()+n, n, 'item #' + n));
            }
            const ts = new TimeSlot(ticks, 0, 99, start.getTime(), stop.getTime(), options);

            assert.equal(ts.ticks, ticks);
            assert.equal(ts.options, options);
            assert.equal(ts.firstIndex, 0);
            assert.equal(ts.lastIndex, 99);
            assert.equal(ts.startTime, start.getTime());
            assert.equal(ts.stopTime, stop.getTime());
            assert.equal(ts.totals, undefined);
            assert.equal(ts.items.length, 0);
        });
    });

    describe('nItems', () => {
        const ts = getTimeSlot();

        test('nItems zero initially', () => {
            const n = ts.nItems();
            assert.equal(n, 0);
        });

        test('nItems after scan', () => {
            ts.scan();
            const n = ts.nItems();
            assert.equal(n, 100);
        });
    });

    describe('getItem', () => {
        const ts = getTimeSlot();
        ts.scan();

        test('negative index throws', () => {
            assert.throws(() => {
                ts.getItem(-1);
            });
        });

        test('too large index throws', () => {
            assert.throws(() => {
                ts.getItem(101);
            });
        });

        test('valid index ok', () => {
            const item = ts.getItem(0);
            assert.notEqual(item, undefined);
        });
    });

    describe('totalScan', () => {
        const ts = getTimeSlot();

        test('no totals before totalScan', () => {
            assert.equal(ts.totals, undefined);
        });

        test('totals defined after totalScan', () => {
            ts.totalScan();
            assert.notEqual(ts.totals, undefined);
        });
    });

    describe('scan', () => {
        test('default sort', () => {
            const ts = getTimeSlot();
            ts.scan();
            const item0 = ts.getItem(0);
            const item1 = ts.getItem(1);
            assert.equal(item0.bandwidth, 0);
            assert.equal(item1.bandwidth, 1);
        });
        test('title sort', () => {
            const ts = getTimeSlot({ 'order': 'title' });
            ts.scan();
            const item0 = ts.getItem(0);
            const item1 = ts.getItem(1);
            assert.equal(item0.title, 'item #0');
            assert.equal(item1.title, 'item #1');
        });
        test('bandwidth sort', () => {
            const ts = getTimeSlot({ 'order': 'bandwidth' });
            ts.scan();
            const item0 = ts.getItem(0);
            const item1 = ts.getItem(1);
            assert.equal(item0.bandwidth, 99);
            assert.equal(item1.bandwidth, 98);
        });
        test('duplicate ticks', () => {
            const ticks = [];
            const time = new Date(2001, 0, 10, 12, 34, 56);
            const start = new Date(2001, 0, 10, 0, 0, 0);
            const stop = new Date(2001, 0, 10, 23, 59, 59);
            const options = {'order': 'nonsuch'};

            for (var n=0; n < 100; n++) {
                ticks.push(new Tick(time.getTime()+n, n, 'item #' + n));
                ticks.push(new Tick(time.getTime()+n, n, 'item #' + n));
            }
            const ts = new TimeSlot(ticks, 0, 199, start.getTime(), stop.getTime(), options);
            ts.scan();
            assert.equal(ts.nItems(), 100);
        });
    });

    describe('inc', () => {
        const dummy = new Tick(0, 0, 'dummy');

        test('index < 0', () => {
            const ts = getTimeSlot();
            ts.scan();
            assert.throws(() => {
                ts.inc(-1, dummy);
            });
        });
        test('index > number of items', () => {
            const ts = getTimeSlot();
            ts.scan();
            assert.throws(() => {
                ts.inc(1000, dummy);
            });
        });
        test('index valid', () => {
            const ts = getTimeSlot();
            ts.scan();
            const tick = new Tick(ts.getItem(1).lastTime, 1, 'item #1');
            ts.inc(1, tick);
            const slot = ts.getItem(1);
            assert.equal(slot.count, 2);
        });
        test('inc existing', () => {
            const ts = getTimeSlot();
            ts.scan();
            const slot0 = ts.getItem(1);
            assert.equal(slot0.count, 1);
            assert.equal(slot0.peakCount, 1);
            const tick = new Tick(ts.getItem(1).lastTime+1, 1, 'item #1');
            ts.inc(1, tick);
            const slot1 = ts.getItem(1);
            assert.equal(slot1.count, 2);
            assert.equal(slot1.peakCount, 1);
            ts.inc(1, tick);
            const slot = ts.getItem(1);
            assert.equal(slot.count, 3);
            assert.equal(slot.peakCount, 2);
        });
    });

    describe('find', () => {
        const ts = getTimeSlot();
        ts.scan();
        test('found', () => {
            const slot = ts.getItem(1);
            const tick = new Tick(slot.lastTime, 1, 'item #1');
            const found = ts.find(tick);
            assert.equal(found, 1);
        });
        test('not found', () => {
            const slot = ts.getItem(1);
            const tick = new Tick(slot.lastTime, 1, 'nonsuch');
            const found = ts.find(tick);
            assert.equal(found, -1);
        });
    });

    describe('totalScan', () => {
        test('no totals before totalScan', () => {
            const ts = getTimeSlot();
            assert.equal(ts.getTotals(), undefined);
        });

        test('totals defined after totalScan', () => {
            const ts = getTimeSlot();
            ts.totalScan();
            assert.notEqual(ts.getTotals(), undefined);
        });
    });

});
