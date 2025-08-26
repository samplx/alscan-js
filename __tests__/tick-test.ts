/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
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

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Tick } from "../lib/tick.ts";

describe('Tick', () => {
    test('constructor time set, size undefined, item undefined', () => {
        const tick = new Tick(500, undefined);
        assert.notEqual(tick, undefined);
        assert.equal(tick.time, 500);
        assert.equal(tick.size, 0);
        assert.equal(tick.item, undefined);
    });

    test('constructor with time set, size number, item undefined', () => {
        const tick = new Tick(500, 12);
        assert.notEqual(tick, undefined);
        assert.equal(tick.time, 500);
        assert.equal(tick.size, 12);
        assert.equal(tick.item, undefined);
    });

    test('constructor with time set, size string number, item undefined', () => {
        const tick = new Tick(500, '12');
        assert.notEqual(tick, undefined);
        assert.equal(tick.time, 500);
        assert.equal(tick.size, 12);
        assert.equal(tick.item, undefined);
    });

    test('constructor with time set, size string invalid number, item undefined', () => {
        const tick = new Tick(500, 'twelve');
        assert.notEqual(tick, undefined);
        assert.equal(tick.time, 500);
        assert.equal(tick.size, 0);
        assert.equal(tick.item, undefined);
    });

    test('constructor with time set, size string invalid number, item defined', () => {
        const tick = new Tick(500, 'twelve', 'ten');
        assert.notEqual(tick, undefined);
        assert.equal(tick.time, 500);
        assert.equal(tick.size, 0);
        assert.equal(tick.item, 'ten');
    });
});
