/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
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

const Tick = require('../lib/tick.js').Tick;

describe('Tick', () => {
    test('constructor time set, size undefined, item undefined', () => {
        const tick = new Tick(500);
        expect(tick).toBeDefined();
        expect(tick.time).toBe(500);
        expect(tick.size).toBe(0);
        expect(tick.item).toBeUndefined();
    });

    test('call constructor function directly with time set, size undefined, item undefined', () => {
        const tick = Tick(500);
        expect(tick).toBeDefined();
        expect(tick.time).toBe(500);
        expect(tick.size).toBe(0);
        expect(tick.item).toBeUndefined();
    });

    test('constructor with time set, size number, item undefined', () => {
        const tick = new Tick(500, 12);
        expect(tick).toBeDefined();
        expect(tick.time).toBe(500);
        expect(tick.size).toBe(12);
        expect(tick.item).toBeUndefined();
    });

    test('constructor with time set, size string number, item undefined', () => {
        const tick = new Tick(500, '12');
        expect(tick).toBeDefined();
        expect(tick.time).toBe(500);
        expect(tick.size).toBe(12);
        expect(tick.item).toBeUndefined();
    });

    test('constructor with time set, size string invalid number, item undefined', () => {
        const tick = new Tick(500, 'twelve');
        expect(tick).toBeDefined();
        expect(tick.time).toBe(500);
        expect(tick.size).toBe(0);
        expect(tick.item).toBeUndefined();
    });


    test('constructor with time set, size string invalid number, item defined', () => {
        const tick = new Tick(500, 'twelve', 'ten');
        expect(tick).toBeDefined();
        expect(tick.time).toBe(500);
        expect(tick.size).toBe(0);
        expect(tick.item).toBeDefined();
        expect(tick.item).toBe('ten');
    });
});
