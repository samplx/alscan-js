/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2018 James Burlingame
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

describe('timeslot', () => {
    const Tick = require('../lib/tick.js').Tick;

    const timeslot = require('../lib/timeslot.js');
    const TimeSlot = timeslot.TimeSlot;

    const getTimeSlot = (opts) => {
        const ticks = [];
        const time = new Date(2001, 0, 10, 12, 34, 56);
        const start = new Date(2001, 0, 10, 0, 0, 0);
        const stop = new Date(2001, 0, 10, 23, 59, 59);
        const options = opts || {};

        for (var n=0; n < 100; n++) {
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

            for (var n=0; n < 100; n++) {
                ticks.push(new Tick(time.getTime()+n, n, 'item #' + n));
            }
            const ts = new TimeSlot(ticks, 0, 99, start.getTime(), stop.getTime(), options);

            expect(ts.ticks).toBe(ticks);
            expect(ts.options).toBe(options);
            expect(ts.firstIndex).toBe(0);
            expect(ts.lastIndex).toBe(99);
            expect(ts.startTime).toBe(start.getTime());
            expect(ts.stopTime).toBe(stop.getTime());
            expect(ts.totals).toBeUndefined();
            expect(ts.items.length).toBe(0);
        });

        test('direct function call', () => {
            const ticks = [];
            const time = new Date(2001, 0, 10, 12, 34, 56);
            const start = new Date(2001, 0, 10, 0, 0, 0);
            const stop = new Date(2001, 0, 10, 23, 59, 59);
            const options = {};

            for (var n=0; n < 100; n++) {
                ticks.push(new Tick(time.getTime()+n, n, 'item #' + n));
            }
            const ts = TimeSlot(ticks, 0, 99, start.getTime(), stop.getTime(), options);

            expect(ts.ticks).toBe(ticks);
            expect(ts.options).toBe(options);
            expect(ts.firstIndex).toBe(0);
            expect(ts.lastIndex).toBe(99);
            expect(ts.startTime).toBe(start.getTime());
            expect(ts.stopTime).toBe(stop.getTime());
            expect(ts.totals).toBeUndefined();
            expect(ts.items.length).toBe(0);
        });
    });

    describe('nItems', () => {
        const ts = getTimeSlot();

        test('nItems zero initially', () => {
            const n = ts.nItems();
            expect(n).toBe(0);
        });

        test('nItems after scan', () => {
            ts.scan();
            const n = ts.nItems();
            expect(n).toBe(100);
        });
    });

    describe('getItem', () => {
        const ts = getTimeSlot();
        ts.scan();

        test('negative index throws', () => {
            const func = () => ts.getItem(-1);
            expect(func).toThrow();
        });

        test('too large index throws', () => {
            const func = () => ts.getItem(1000);
            expect(func).toThrow();
        });

        test('valid index ok', () => {
            const item = ts.getItem(0);
            expect(item).toBeDefined();
        });
    });

    describe('totalScan', () => {
        const ts = getTimeSlot();

        test('no totals before totalScan', () => {
            expect(ts.totals).toBeUndefined();
        });

        test('totals defined after totalScan', () => {
            ts.totalScan();
            expect(ts.totals).toBeDefined();
        });
    });

    describe('scan', () => {
        test('default sort', () => {
            const ts = getTimeSlot();
            ts.scan();
            const item0 = ts.getItem(0);
            const item1 = ts.getItem(1);
            expect(item0.bandwidth).toBe(0);
            expect(item1.bandwidth).toBe(1);
        });
        test('title sort', () => {
            const ts = getTimeSlot({ 'order': 'title' });
            ts.scan();
            const item0 = ts.getItem(0);
            const item1 = ts.getItem(1);
            expect(item0.title).toBe('item #0');
            expect(item1.title).toBe('item #1');
        });
        test('title sort', () => {
            const ts = getTimeSlot({ 'order': 'bandwidth' });
            ts.scan();
            const item0 = ts.getItem(0);
            const item1 = ts.getItem(1);
            expect(item0.bandwidth).toBe(99);
            expect(item1.bandwidth).toBe(98);
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
            expect(ts.nItems()).toBe(100);
        });
    });

    describe('inc', () => {
        test('index < 0', () => {
            const ts = getTimeSlot();
            ts.scan();
            const func = () => ts.inc(-1, null);
            expect(func).toThrow();
        });
        test('index > number of items', () => {
            const ts = getTimeSlot();
            ts.scan();
            const func = () => ts.inc(1000, null);
            expect(func).toThrow();
        });
        test('index valid', () => {
            const ts = getTimeSlot();
            ts.scan();
            const tick = new Tick(ts.getItem(1).time, 1, 'item #1');
            ts.inc(1, tick);
            const slot = ts.getItem(1);
            expect(slot.count).toBe(2);
        });
        test('inc existing', () => {
            const ts = getTimeSlot();
            ts.scan();
            const tick = new Tick(ts.getItem(1).time, 1, 'item #1');
            ts.inc(1, tick);
            ts.inc(1, tick);
            const slot = ts.getItem(1);
            expect(slot.count).toBe(3);
            expect(slot.peakCount).toBe(2);
        });
    });

    describe('find', () => {
        const ts = getTimeSlot();
        ts.scan();
        test('found', () => {
            const slot = ts.getItem(1);
            const tick = new Tick(slot.time, 1, 'item #1');
            const found = ts.find(tick);
            expect(found).toBe(1);
        });
        test('not found', () => {
            const slot = ts.getItem(1);
            const tick = new Tick(slot.time, 1, 'nonsuch');
            const found = ts.find(tick);
            expect(found).toBe(-1);
        });
    });

    describe('totalScan', () => {
        const ts = getTimeSlot();

        test('no totals before totalScan', () => {
            expect(ts.getTotals()).toBeUndefined();
        });

        test('totals defined after totalScan', () => {
            ts.totalScan();
            expect(ts.getTotals()).toBeDefined();
        });
    });

});
