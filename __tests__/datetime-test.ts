/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018, 2025 James Burlingame
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
import { calcDay, calcHours, calcMinutes, calcMonth, calcSeconds, calcStartDate, calcTimezone, calculateStartStop, calculateStartStopNow, calcYear, dateFactory, PartialDate, validateDateSettings } from "../lib/datetime.ts";

function checkStopFunc(
    func: (stop: PartialDate) => void,
    stop: PartialDate,
    expectedYear: number,
    expectedMonth: number,
    expectedDay: number,
    expectedHours: number,
    expectedMinutes: number,
    expectedSeconds: number,
    expectedTimeZone: number,
): void {
    func(stop);
    assert.equal(stop.year, expectedYear);
    assert.equal(stop.month, expectedMonth);
    assert.equal(stop.day, expectedDay);
    assert.equal(stop.hours, expectedHours);
    assert.equal(stop.minutes, expectedMinutes);
    assert.equal(stop.seconds, expectedSeconds);
    assert.equal(stop.timezone, expectedTimeZone);
}

function checkStopParse(
    timestamp: string,
    roundDown: boolean,
    expectedYear: number,
    expectedMonth: number,
    expectedDay: number,
    expectedHours: number,
    expectedMinutes: number,
    expectedSeconds: number,
    expectedTimeZone: number,
): void {
    const stop = new PartialDate();
    const func = (stop: PartialDate) => {
        stop.parse(timestamp, roundDown);
    };
    checkStopFunc(func, stop, expectedYear, expectedMonth, expectedDay,
        expectedHours, expectedMinutes, expectedSeconds, expectedTimeZone);
}

describe('datetime', () => {

    for (const field of ['year', 'month', 'day', 'hours', 'minutes', 'seconds', 'timezone']) {
        test(`empty field ${field} is undefined`, () => {
            const empty = new PartialDate();
            const rec = empty as unknown as Record<string, unknown>;
            assert.equal(rec[field], undefined);
        });
    }

    test('setTime(1383136415000)=Wed, 30 Oct 2013 12:33:35 +0000', () => {
        const stop = new PartialDate();
        const func = (stop: PartialDate) => stop.setTime(1383136415000);
        checkStopFunc(func, stop, 2013, 9, 30, 12, 33, 35, 0);
    });

    test('parse("@1383136415")', () => {
        const stop = new PartialDate();
        const func = (stop: PartialDate) => stop.parse('@1383136415', false);
        checkStopFunc(func, stop, 2013, 9, 30, 12, 33, 35, 0);
    });

    for(const fmt of [
        '@1383136415',
        '10',
        '10:23',
        '1023',
        '102345',
        '10:23:45',
        '1T10',
        '1T10:23',
        '1T1023',
        '1T102345',
        '1T10:23:45',
        '1 10',
        '1 10:23',
        '1 1023',
        '1 102345',
        '1 10:23:45',
        '1 10:23:45.678',
        '1 10:23:45.678 Z',
        '1 10:23:45.678 +00',
        '1 10:23:45.678 +0000',
        '1 10:23:45.678 -06',
        '1 10:23:45.678 -0600',
        '2/1 10:23:45',
        '2-1 10:23:45',
        '2001/2/1 10:23:45',
        '2001-2-1 10:23:45',
        '2001/12/31 10:23:45',
        '2001/02/01 10:23:45',
        '1:10:23:45',
        '2001/02/01:10:23:45',
        '02/01:10:23:45',
        '2/1:10:23:45',
        '2/1:10',
        'Feb/1 10',
        'Feb/1 10:23',
        'Feb/1 10:23:45',
        'Feb-1 10:23:45',
        '2001/Feb/1 10:23:45',
        '2001-Feb-1 10:23:45',
        '2001/December/31 10:23:45',
        '2001/Feb/01:10:23:45',
        '2001/Feb/01:10:23:45.678',
        '2001/Feb/01:10:23:45 Z',
        '2001/Feb/01:10:23:45 +01',
        '2001/Feb/01:10:23:45 -01',
        '2001/Feb/01:10:23:45 +0100',
        '2001/Feb/01:10:23:45 -0600',
        '2001/Feb/01T10:23:45',
        '1/Feb 10',
        '01/Feb/2001 10',
        '01/Jan/2001T10:23',
        '03/Mar/2001:10:23:45',
        '04/Apr/2001 10:23:45 Z',
        '05/May/2001 10:23:45 +01',
        '06/June/2001 10:23:45 -01',
        '7/JUL/2001:10:23:45 +0000',
        '8-AUG-2010:10:23:45.678 -0600'
    ]) {
        test(`PartialDate.isValidFormat(${fmt}) is truthy`, () => {
            assert.ok(PartialDate.isValidFormat(fmt));
        });
    }

    for(const fmt of [
        '@none',
        '9999999999',
    ] ) {
        test(`PartialDate.isValidFormat(${fmt}) is false`, () => {
            assert.equal(PartialDate.isValidFormat(fmt), false);
        });
    }

    describe('parse', () => {
        for (const row of [
            // timestamp,                         roundDown, xyear,      xmonth,     xday,       xhours, xminutes,   xseconds,   xtimezone
            [ '10',                               true,      undefined,  undefined,  undefined,  10,     0,          0,          undefined ],
            [ '10',                               false,     undefined,  undefined,  undefined,  10,     59,         59,         undefined ],
            [ '10:23',                            true,      undefined,  undefined,  undefined,  10,     23,         0,          undefined ],
            [ '10:23',                            false,     undefined,  undefined,  undefined,  10,     23,         59,         undefined ],
            [ '1023',                             true,      undefined,  undefined,  undefined,  10,     23,         0,          undefined ],
            [ '1023',                             false,     undefined,  undefined,  undefined,  10,     23,         59,         undefined ],
            [ '10:23:45',                         true,      undefined,  undefined,  undefined,  10,     23,         45,         undefined ],
            [ '10:23:45',                         false,     undefined,  undefined,  undefined,  10,     23,         45,         undefined ],
            [ '10:23:45 Z',                       true,      undefined,  undefined,  undefined,  10,     23,         45,         0 ],
            [ '10:23:45 Z',                       false,     undefined,  undefined,  undefined,  10,     23,         45,         0 ],
            [ '10:23:45 +01',                     true,      undefined,  undefined,  undefined,  10,     23,         45,         3600000 ],
            [ '10:23:45 +01',                     false,     undefined,  undefined,  undefined,  10,     23,         45,         3600000 ],
            [ '10:23:45 -01',                     true,      undefined,  undefined,  undefined,  10,     23,         45,         -3600000 ],
            [ '10:23:45 -01',                     false,     undefined,  undefined,  undefined,  10,     23,         45,         -3600000 ],
            [ '10:23:45 +0100',                   true,      undefined,  undefined,  undefined,  10,     23,         45,         3600000 ],
            [ '10:23:45 +0100',                   false,     undefined,  undefined,  undefined,  10,     23,         45,         3600000 ],
            [ '10:23:45 -0130',                   true,      undefined,  undefined,  undefined,  10,     23,         45,         -5400000 ],
            [ '10:23:45 -0130',                   false,     undefined,  undefined,  undefined,  10,     23,         45,         -5400000 ],
            [ '102345',                           true,      undefined,  undefined,  undefined,  10,     23,         45,         undefined ],
            [ '102345',                           false,     undefined,  undefined,  undefined,  10,     23,         45,         undefined ],
            [ '1T10',                             true,      undefined,  undefined,  1,          10,     0,          0,          undefined ],
            [ '1T10',                             false,     undefined,  undefined,  1,          10,     59,         59,         undefined ],
            [ '1T10:23',                          true,      undefined,  undefined,  1,          10,     23,         0,          undefined ],
            [ '1T10:23',                          false,     undefined,  undefined,  1,          10,     23,         59,         undefined ],
            [ '1T1023',                           true,      undefined,  undefined,  1,          10,     23,         0,          undefined ],
            [ '1T1023',                           false,     undefined,  undefined,  1,          10,     23,         59,         undefined ],
            [ '1T10:23:45',                       true,      undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1T10:23:45',                       false,     undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1T102345',                         true,      undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1T102345',                         false,     undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1 102345',                         true,      undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1 102345',                         false,     undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1:10:23:45',                       true,      undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1:10:23:45',                       false,     undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1:10:23:45.678',                    true,     undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1:10:23:45.678',                    false,    undefined,  undefined,  1,          10,     23,         45,         undefined ],
            [ '1:10:23:45.678 Z',                  true,     undefined,  undefined,  1,          10,     23,         45,         0 ],
            [ '1:10:23:45.678 Z',                  false,    undefined,  undefined,  1,          10,     23,         45,         0 ],
            [ '1:10:23:45.678 +01',                true,     undefined,  undefined,  1,          10,     23,         45,         3600000 ],
            [ '1:10:23:45.678 +01',                false,    undefined,  undefined,  1,          10,     23,         45,         3600000 ],
            [ '1:10:23:45.678 -01',                true,     undefined,  undefined,  1,          10,     23,         45,         -3600000 ],
            [ '1:10:23:45.678 -01',                false,    undefined,  undefined,  1,          10,     23,         45,         -3600000 ],
            [ '1:10:23:45.678 +0130',              true,     undefined,  undefined,  1,          10,     23,         45,         5400000 ],
            [ '1:10:23:45.678 +0130',              false,    undefined,  undefined,  1,          10,     23,         45,         5400000 ],
            [ '1:10:23:45.678 -0600',              true,     undefined,  undefined,  1,          10,     23,         45,         -21600000 ],
            [ '1:10:23:45.678 -0600',              false,    undefined,  undefined,  1,          10,     23,         45,         -21600000 ],
            [ '2/1:10:23:45',                      true,     undefined,  1,          1,          10,     23,         45,         undefined ],
            [ '2/1:10:23:45',                      false,    undefined,  1,          1,          10,     23,         45,         undefined ],
            [ '2-1:10:23:45',                      true,     undefined,  1,          1,          10,     23,         45,         undefined ],
            [ '2-1:10:23:45',                      false,    undefined,  1,          1,          10,     23,         45,         undefined ],
            [ '2/1',                               true,     undefined,  1,          1,          0,      0,           0,         undefined ],
            [ '2/1',                               false,    undefined,  1,          1,          23,     59,         59,         undefined ],
            [ 'Foo/1',                             true,     undefined,  undefined,  1,          0,      0,           0,         undefined ],
            [ 'Foo/1',                             false,    undefined,  undefined,  1,          23,     59,         59,         undefined ],
            [ '2001/2/1:10:23:45',                 true,     2001,       1,          1,          10,     23,         45,         undefined ],
            [ '2001/2/1:10:23:45',                 false,    2001,       1,          1,          10,     23,         45,         undefined ],
            [ '2001-2-1:10:23:45',                 true,     2001,       1,          1,          10,     23,         45,         undefined ],
            [ '2001-2-1:10:23:45',                 false,    2001,       1,          1,          10,     23,         45,         undefined ],
            [ 'Feb/1 10',                          true,     undefined,  1,          1,          10,     0,          0,          undefined ],
            [ 'Feb/1 10',                          false,    undefined,  1,          1,          10,     59,         59,         undefined ],
            [ 'MAR/5 10',                          true,     undefined,  2,          5,          10,     0,          0,          undefined ],
            [ 'MAR/5 10',                          false,    undefined,  2,          5,          10,     59,         59,         undefined ],
            [ 'Feb/1 10:23',                       true,     undefined,  1,          1,          10,     23,         0,          undefined ],
            [ 'Feb/1 10:23',                       false,    undefined,  1,          1,          10,     23,         59,         undefined ],
            [ 'February/1 10:23',                  true,     undefined,  1,          1,          10,     23,         0,          undefined ],
            [ 'February/1 10:23',                  false,    undefined,  1,          1,          10,     23,         59,         undefined ],
            [ 'Feb/1 10:23:45',                    true,     undefined,  1,          1,          10,     23,         45,         undefined ],
            [ 'Feb/1 10:23:45',                    false,    undefined,  1,          1,          10,     23,         45,         undefined ],
            [ 'Feb-1 10:23:45',                    true,     undefined,  1,          1,          10,     23,         45,         undefined ],
            [ 'Feb-1 10:23:45',                    false,    undefined,  1,          1,          10,     23,         45,         undefined ],
            [ '2001/Jan/1 10:23:45',               true,     2001,       0,          1,          10,     23,         45,         undefined ],
            [ '2001/Jan/1 10:23:45',               false,    2001,       0,          1,          10,     23,         45,         undefined ],
            [ '2001-March-1 10:23:45',             true,     2001,       2,          1,          10,     23,         45,         undefined ],
            [ '2001-March-1 10:23:45',             false,    2001,       2,          1,          10,     23,         45,         undefined ],
            [ '2001/January/1 10:23:45',           true,     2001,       0,          1,          10,     23,         45,         undefined ],
            [ '2001/January/1 10:23:45',           false,    2001,       0,          1,          10,     23,         45,         undefined ],
            [ '2001/February/1 10:23:45',          true,     2001,       1,          1,          10,     23,         45,         undefined ],
            [ '2001/February/1 10:23:45',          false,    2001,       1,          1,          10,     23,         45,         undefined ],
            [ '2001/March/1 10:23:45',             true,     2001,       2,          1,          10,     23,         45,         undefined ],
            [ '2001/March/1 10:23:45',             false,    2001,       2,          1,          10,     23,         45,         undefined ],
            [ '2001/April/1 10:23:45',             true,     2001,       3,          1,          10,     23,         45,         undefined ],
            [ '2001/April/1 10:23:45',             false,    2001,       3,          1,          10,     23,         45,         undefined ],
            [ '2001/May/1 10:23:45',               true,     2001,       4,          1,          10,     23,         45,         undefined ],
            [ '2001/May/1 10:23:45',               false,    2001,       4,          1,          10,     23,         45,         undefined ],
            [ '2001/June/1 10:23:45',              true,     2001,       5,          1,          10,     23,         45,         undefined ],
            [ '2001/June/1 10:23:45',              false,    2001,       5,          1,          10,     23,         45,         undefined ],
            [ '2001/July/1 10:23:45',              true,     2001,       6,          1,          10,     23,         45,         undefined ],
            [ '2001/July/1 10:23:45',              false,    2001,       6,          1,          10,     23,         45,         undefined ],
            [ '2001/august/1 10:23:45',            true,     2001,       7,          1,          10,     23,         45,         undefined ],
            [ '2001/august/1 10:23:45',            false,    2001,       7,          1,          10,     23,         45,         undefined ],
            [ '2001/september/1 10:23:45',         true,     2001,       8,          1,          10,     23,         45,         undefined ],
            [ '2001/septemBER/1 10:23:45',         false,    2001,       8,          1,          10,     23,         45,         undefined ],
            [ '2001/october/1 10:23:45',           true,     2001,       9,          1,          10,     23,         45,         undefined ],
            [ '2001/october/1 10:23:45',           false,    2001,       9,          1,          10,     23,         45,         undefined ],
            [ '2001/November/1 10:23:45',          true,     2001,       10,         1,          10,     23,         45,         undefined ],
            [ '2001/November/1 10:23:45',          false,    2001,       10,         1,          10,     23,         45,         undefined ],
            [ '2001/December/1 10:23:45',          true,     2001,       11,         1,          10,     23,         45,         undefined ],
            [ '2001/December/1 10:23:45',          false,    2001,       11,         1,          10,     23,         45,         undefined ],
            [ '2001/Feb/1 10:23:45',               true,     2001,       1,          1,          10,     23,         45,         undefined ],
            [ '2001/Feb/1 10:23:45',               false,    2001,       1,          1,          10,     23,         45,         undefined ],
            [ '2001/Mar/1 10:23:45',               true,     2001,       2,          1,          10,     23,         45,         undefined ],
            [ '2001/Mar/1 10:23:45',               false,    2001,       2,          1,          10,     23,         45,         undefined ],
            [ '2001/APR/1 10:23:45',               true,     2001,       3,          1,          10,     23,         45,         undefined ],
            [ '2001/apr/1 10:23:45',               false,    2001,       3,          1,          10,     23,         45,         undefined ],
            [ '2001/may/1 10:23:45',               true,     2001,       4,          1,          10,     23,         45,         undefined ],
            [ '2001/May/1 10:23:45',               false,    2001,       4,          1,          10,     23,         45,         undefined ],
            [ '2001/JUN/1 10:23:45',               true,     2001,       5,          1,          10,     23,         45,         undefined ],
            [ '2001/Jun/1 10:23:45',               false,    2001,       5,          1,          10,     23,         45,         undefined ],
            [ '2001/Jul/1 10:23:45',               true,     2001,       6,          1,          10,     23,         45,         undefined ],
            [ '2001/JUL/1 10:23:45',               false,    2001,       6,          1,          10,     23,         45,         undefined ],
            [ '2001/aug/1 10:23:45',               true,     2001,       7,          1,          10,     23,         45,         undefined ],
            [ '2001/AUG/1 10:23:45',               false,    2001,       7,          1,          10,     23,         45,         undefined ],
            [ '2001/SEP/1 10:23:45',               true,     2001,       8,          1,          10,     23,         45,         undefined ],
            [ '2001/SEP/1 10:23:45',               false,    2001,       8,          1,          10,     23,         45,         undefined ],
            [ '2001/Oct/1 10:23:45',               true,     2001,       9,          1,          10,     23,         45,         undefined ],
            [ '2001/OCT/1 10:23:45',               false,    2001,       9,          1,          10,     23,         45,         undefined ],
            [ '2001/NOV/1 10:23:45',               true,     2001,       10,         1,          10,     23,         45,         undefined ],
            [ '2001/Nov/1 10:23:45',               false,    2001,       10,         1,          10,     23,         45,         undefined ],
            [ '2001/Dec/1 10:23:45',               true,     2001,       11,         1,          10,     23,         45,         undefined ],
            [ '2001/DEC/1 10:23:45',               false,    2001,       11,         1,          10,     23,         45,         undefined ],
            [ '2001/Dec/1 10:23:45.678',           false,    2001,       11,         1,          10,     23,         45,         undefined ],
            [ '2001/Dec/1 10:23:45 Z',             false,    2001,       11,         1,          10,     23,         45,         0 ],
            [ '2001/Dec/1 10:23:45 +01',           false,    2001,       11,         1,          10,     23,         45,         3600000 ],
            [ '2001/Dec/1 10:23:45 -01',           false,    2001,       11,         1,          10,     23,         45,         -3600000 ],
            [ '2001/Dec/1 10:23:45 +0130',         false,    2001,       11,         1,          10,     23,         45,         5400000 ],
            [ '2001/Dec/1 10:23:45 -0600',         false,    2001,       11,         1,          10,     23,         45,         -21600000 ],
            [ '1/Feb',                             true,     undefined,  1,          1,          0,      0,          0,          undefined ],
            [ '1/Feb',                             false,    undefined,  1,          1,          23,     59,         59,         undefined ],
            [ '1/Fob',                             true,     undefined,  undefined,  1,          0,      0,          0,          undefined ],
            [ '1/Fob',                             false,    undefined,  undefined,  1,          23,     59,         59,         undefined ],
            [ '1/Feb 10',                          true,     undefined,  1,          1,          10,     0,          0,          undefined ],
            [ '1/Feb 10',                          false,    undefined,  1,          1,          10,     59,         59,         undefined ],
            [ '1/Feb 10:23',                       true,     undefined,  1,          1,          10,     23,         0,          undefined ],
            [ '1/Feb 10:23',                       false,    undefined,  1,          1,          10,     23,         59,         undefined ],
            [ '1/Feb 10:23:45',                    true,     undefined,  1,          1,          10,     23,         45,         undefined ],
            [ '1/Feb 10:23:45',                    false,    undefined,  1,          1,          10,     23,         45,         undefined ],
            [ '31/Jan/2001 10:23:45',              true,     2001,       0,          31,         10,     23,         45,         undefined ],
            [ '31/Jan/2001 10:23:45',              false,    2001,       0,          31,         10,     23,         45,         undefined ],
            [ '03/Mar/2001 10:23:45 Z',            true,     2001,       2,          3,          10,     23,         45,         0 ],
            [ '03/Mar/2001 10:23:45 Z',            false,    2001,       2,          3,          10,     23,         45,         0 ],
            [ '04/April/2001:10:23:45.678 Z',      true,     2001,       3,          4,          10,     23,         45,         0 ],
            [ '04/April/2001:10:23:45.678 Z',      false,    2001,       3,          4,          10,     23,         45,         0 ],
            [ '04/April/2001:10:23:45.678 +01',    true,     2001,       3,          4,          10,     23,         45,         3600000 ],
            [ '04/April/2001:10:23:45.678 +01',    false,    2001,       3,          4,          10,     23,         45,         3600000 ],
            [ '04/April/2001:10:23:45.678 -01',    true,     2001,       3,          4,          10,     23,         45,         -3600000 ],
            [ '04/April/2001:10:23:45.678 -01',    false,    2001,       3,          4,          10,     23,         45,         -3600000 ],
            [ '04/April/2001:10:23:45.678 +0130',  true,     2001,       3,          4,          10,     23,         45,         5400000 ],
            [ '04/April/2001:10:23:45.678 +0130',  false,    2001,       3,          4,          10,     23,         45,         5400000 ],
            [ '04/April/2001:10:23:45.678 -0600',  true,     2001,       3,          4,          10,     23,         45,         -21600000 ],
            [ '04/April/2001:10:23:45.678 -0600',  false,    2001,       3,          4,          10,     23,         45,         -21600000 ],
        ]) {
            const [ timestamp, roundDown, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone ] = row;
            test(`stop.parse(${timestamp}, ${roundDown})`, () => {
                checkStopParse(timestamp as string,
                    roundDown as boolean,
                    xyear as number,
                    xmonth as number,
                    xday as number,
                    xhours as number,
                    xminutes as number,
                    xseconds as number,
                    xtimezone as number);
            });
        }

        test('invalid date throws', () => {
            assert.throws(() => {
                const stop = new PartialDate();
                stop.parse('invalid-date', false);
            });
        });
    });

    // const checkUtmp = () => {
    //     const exists = os.type().toLowerCase() == 'linux';
    //     try {
    //         const utmp = require('samplx-utmp');   // eslint-disable-line no-unused-vars
    //     } catch (e) {
    //         console.log('No utmp module');
    //         exists = false;
    //     }
    //     return exists;
    // };

    // const haveUtmp = checkUtmp();

    // describe('lastReboot', () => {
    //     test('lastReboot valid time', done => {
    //         const pathname = path.join(testData.getDataDirectory(), 'datetime', 'valid');
    //         setRootDirectory(pathname);
    //         const promise = d.lastReboot();
    //         expect(when.isPromiseLike(promise)).toBeTruthy();
    //         promise.then((reboot) => {
    //             if (haveUtmp) {
    //                 expect(reboot.year).toBe(2013);
    //                 expect(reboot.month).toBe(9);
    //                 expect(reboot.day).toBe(28);
    //                 expect(reboot.hours).toBe(10);
    //                 expect(reboot.minutes).toBe(9);
    //                 expect(reboot.seconds).toBe(52);
    //                 expect(reboot.timezone).toBe(0);
    //             } else {
    //                 expect(reboot.year).toBeUndefined();
    //                 expect(reboot.month).toBeUndefined();
    //                 expect(reboot.day).toBeUndefined();
    //                 expect(reboot.hours).toBeUndefined();
    //                 expect(reboot.minutes).toBeUndefined();
    //                 expect(reboot.seconds).toBeUndefined();
    //                 expect(reboot.timezone).toBeUndefined();
    //             }
    //             done();
    //         });
    //     });

    //     test('lastReboot missing wtmp', done => {
    //         const pathname = path.join(testData.getDataDirectory(), 'datetime', 'missing');
    //         scanfile.setRootDirectory(pathname);
    //         const promise = d.lastReboot();
    //         expect(when.isPromiseLike(promise)).toBeTruthy();
    //         promise.then((reboot) => {
    //             expect(reboot.year).toBeUndefined();
    //             expect(reboot.month).toBeUndefined();
    //             expect(reboot.day).toBeUndefined();
    //             expect(reboot.hours).toBeUndefined();
    //             expect(reboot.minutes).toBeUndefined();
    //             expect(reboot.seconds).toBeUndefined();
    //             expect(reboot.timezone).toBeUndefined();
    //             done();
    //         });
    //     });
    // });

    // describe('parsePartialDate("reboot"...', () => {
    //     test('valid wtmp', done => {
    //         const pathname = path.join(testData.getDataDirectory(), 'datetime', 'valid');
    //         scanfile.setRootDirectory(pathname);
    //         const promise = d.parsePartialDate('reboot', false);
    //         expect(when.isPromiseLike(promise)).toBeTruthy();
    //         promise.then((reboot) => {
    //             if (haveUtmp) {
    //                 expect(reboot.year).toBe(2013);
    //                 expect(reboot.month).toBe(9);
    //                 expect(reboot.day).toBe(28);
    //                 expect(reboot.hours).toBe(10);
    //                 expect(reboot.minutes).toBe(9);
    //                 expect(reboot.seconds).toBe(52);
    //                 expect(reboot.timezone).toBe(0);
    //             } else {
    //                 expect(reboot.year).toBeUndefined();
    //                 expect(reboot.month).toBeUndefined();
    //                 expect(reboot.day).toBeUndefined();
    //                 expect(reboot.hours).toBeUndefined();
    //                 expect(reboot.minutes).toBeUndefined();
    //                 expect(reboot.seconds).toBeUndefined();
    //                 expect(reboot.timezone).toBeUndefined();
    //             }
    //             done();
    //         });
    //     });
    // });


    // describe('parsePartialDate("non-reboot"...', () => {
    //     test('01/Feb', done => {
    //         const promise = d.parsePartialDate('01/Feb', false);
    //         expect(when.isPromiseLike(promise)).toBeTruthy();
    //         promise.then((timestamp) => {
    //             expect(timestamp.year).toBeUndefined();
    //             expect(timestamp.month).toBe(1);
    //             expect(timestamp.day).toBe(1);
    //             expect(timestamp.hours).toBe(23);
    //             expect(timestamp.minutes).toBe(59);
    //             expect(timestamp.seconds).toBe(59);
    //             expect(timestamp.timezone).toBeUndefined();
    //             done();
    //         });
    //     });
    // });

    describe('calcTimezone', () => {
        const cases = [
            { startTimezone: undefined, stopTimezone: undefined, expected: [ false, undefined, undefined ] },
            { startTimezone: undefined, stopTimezone: 8 * 60,    expected: [ true,  8 * 60,    8 * 60 ] },
            { startTimezone: 6 * 60,    stopTimezone: undefined, expected: [ true,  6 * 60,    6 * 60 ] },
            { startTimezone: 6 * 60,    stopTimezone: 8 * 60,    expected: [ true,  6 * 60,    8 * 60 ] }
        ];
        for (const row of cases) {
            test(`calcTimezone: ${row.startTimezone}, ${row.stopTimezone}`, () => {
                const results = calcTimezone(row.startTimezone, row.stopTimezone);
                assert.deepEqual(results, row.expected);
            });
        }
    });

    describe('calcYear', () => {
        const cases = [
            { stopYear: undefined, useUTC: false, now: new Date(2010, 0, 1), expected: 2010 },
            { stopYear: undefined, useUTC: true,  now: new Date(2010, 0, 1), expected: 2010 },
            { stopYear: 2018,      useUTC: false, now: new Date(2010, 0, 1), expected: 2018 },
            { stopYear: 2018,      useUTC: true,  now: new Date(2010, 0, 1), expected: 2018 },
        ];
        for (const row of cases) {
            test(`calcYear: ${row.stopYear}, ${row.useUTC} @${row.now.toUTCString()}`, () => {
                const results = calcYear(row.stopYear, row.useUTC, row.now);
                assert.equal(results, row.expected);
            });
        }
    });

    describe('calcMonth', () => {
        const cases = [
            { stopMonth: undefined, useUTC: false, now: new Date(2010, 0, 1), expected: 0 },
            { stopMonth: undefined, useUTC: true,  now: new Date(2010, 0, 1), expected: 0 },
            { stopMonth: 2,         useUTC: false, now: new Date(2010, 0, 1), expected: 2 },
            { stopMonth: 3,         useUTC: true,  now: new Date(2010, 0, 1), expected: 3 },
        ];
        for (const row of cases) {
            test(`calcMonth: ${row.stopMonth}, ${row.useUTC} @${row.now.toUTCString()}`, () => {
                const results = calcMonth(row.stopMonth, row.useUTC, row.now);
                assert.equal(results, row.expected);
            });
        }
    });

    describe('calcDay', () => {
        const cases = [
            { stopDay: undefined, useUTC: false, now: new Date(2010, 0, 1), expected: 1 },
            { stopDay: undefined, useUTC: true,  now: new Date(2010, 0, 1), expected: 1 },
            { stopDay: 2,         useUTC: false, now: new Date(2010, 0, 1), expected: 2 },
            { stopDay: 3,         useUTC: true,  now: new Date(2010, 0, 1), expected: 3 },
        ];
        for (const row of cases) {
            test(`calcDay: ${row.stopDay}, ${row.useUTC} @${row.now.toUTCString()}`, () => {
                const results = calcDay(row.stopDay, row.useUTC, row.now);
                assert.equal(results, row.expected);
            });
        }
    });

    describe('calcHours', () => {
        const cases = [
            { stopHours: undefined, slotWidth: 3600,   useUTC: false, now: new Date(2010, 0, 1, 1), expected: 1 },
            { stopHours: undefined, slotWidth: 3600,   useUTC: true,  now: new Date(Date.UTC(2010, 0, 1, 10)), expected: 10 },
            { stopHours: undefined, slotWidth: 360000, useUTC: false, now: new Date(2010, 0, 1, 2), expected: 23 },
            { stopHours: undefined, slotWidth: 360000, useUTC: true,  now: new Date(Date.UTC(2010, 0, 1, 10, 2)), expected: 23 },
            { stopHours: 2,         slotWidth: 360000, useUTC: false, now: new Date(2010, 0, 1), expected: 2 },
            { stopHours: 3,         slotWidth: 360000, useUTC: true,  now: new Date(2010, 0, 1), expected: 3 },
        ];
        for (const row of cases) {
            test(`calcDay: ${row.stopHours}, ${row.slotWidth}, ${row.useUTC} @${row.now.toUTCString()}`, () => {
                const results = calcHours(row.stopHours, row.slotWidth, row.useUTC, row.now);
                assert.equal(results, row.expected);
            });
        }
    });

    describe('calcMinutes', () => {
        const cases = [
            { stopMinutes: undefined, slotWidth: 10,   useUTC: false, now: new Date(2010, 0, 1, 1, 1), expected: 1 },
            { stopMinutes: undefined, slotWidth: 10,   useUTC: true,  now: new Date(Date.UTC(2010, 0, 1, 1, 10)), expected: 10 },
            { stopMinutes: undefined, slotWidth: 3600, useUTC: false, now: new Date(2010, 0, 1, 2), expected: 59 },
            { stopMinutes: undefined, slotWidth: 3600, useUTC: true,  now: new Date(Date.UTC(2010, 0, 1, 10, 2)), expected: 59 },
            { stopMinutes: 2,         slotWidth: 3600, useUTC: false, now: new Date(2010, 0, 1, 1, 2), expected: 2 },
            { stopMinutes: 3,         slotWidth: 3600, useUTC: true,  now: new Date(Date.UTC(2010, 0, 1, 1, 2)), expected: 3 },
        ];
        for (const row of cases) {
            test(`calcDay: ${row.stopMinutes}, ${row.slotWidth}, ${row.useUTC} @${row.now.toUTCString()}`, () => {
                const results = calcMinutes(row.stopMinutes, row.slotWidth, row.useUTC, row.now);
                assert.equal(results, row.expected);
            });
        }
    });

    describe('calcSeconds', () => {
        const cases = [
            { stopSeconds: undefined, expected: 59 },
            { stopSeconds: 30, expected: 30 },
        ];
        for (const row of cases) {
            test(`calcSeconds: ${row.stopSeconds}`, () => {
                const results = calcSeconds(row.stopSeconds);
                assert.equal(results, row.expected);
            });
        }
    });

    describe('dateFactory', () => {
        const localTime = new Date(2018, 1, 2, 3, 4, 5, 0);
        const utcTime = new Date(Date.UTC(2018, 1, 2, 3, 4, 5, 0));
        const timezone = (6 * 60 * 60 * 1000);
        const adjustedTime = new Date(utcTime.getTime() - timezone);
        const cases = [
            { timezone: undefined, useUTC: false, inputDate: localTime, expected: localTime },
            { timezone: timezone,  useUTC: true,  inputDate: utcTime,   expected: adjustedTime },
        ];
        for (const row of cases) {
            test(`dateFactory: ${row.timezone}, ${row.useUTC}, ${row.inputDate}`, () => {
                const results = dateFactory(2018, 1, 2, 3, 4, 5, row.timezone, row.useUTC);
                assert.equal(results.getTime(), row.expected.getTime());
            });
        }
    });

    describe('validateDateSettings', () => {
        const timestamp = 'test';
        const cases = [
            // year,           month,            day,            hours,            minutes,            seconds,            timezone,            xlength
            { year: 2001,      month: 0,         day: 1,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 'invalid', month: 0,         day: 1,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test year is not a number.' },
            { year: 1970,      month: 0,         day: 1,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 1969,      month: 0,         day: 1,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test year (expected year > 1970): 1969' },
            { year: 2001,      month: 'nan',     day: 1,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test month is not a number.' },
            { year: 2001,      month: -1,        day: 1,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test month is out of range.' },
            { year: 2001,      month: 12,        day: 1,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test month is out of range.' },
            { year: 2001,      month: 1,         day: 'nan',     hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test day of month is not a number.' },
            { year: 2001,      month: 0,         day: 0,         hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test day of month (expected 1 <= day <= 31): 0' },
            { year: 2001,      month: 0,         day: 32,        hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test day of month (expected 1 <= day <= 31): 32' },
            { year: 2001,      month: 1,         day: 28,        hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 1,         day: 29,        hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test day of month (expected 1 <= day <= 28): 29' },
            { year: 2000,      month: 1,         day: 29,        hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2400,      month: 1,         day: 29,        hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2004,      month: 1,         day: 29,        hours: 12,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 'one',     minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test hours is not a number.' },
            { year: 2001,      month: 0,         day: 1,         hours: 0,         minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: -1,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test hour (expected 0 <= hours <= 23): -1' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 24,        minutes: 30,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test hour (expected 0 <= hours <= 23): 24' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 'nan',     seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test minutes is not a number.' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: -1,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test minutes (expected 0 <= minutes <= 59): -1' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 59,        seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 60,        seconds: 0,         timezone: undefined, xlength: 1, xmessage: 'Invalid test minutes (expected 0 <= minutes <= 59): 60' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 'nan',     timezone: undefined, xlength: 1, xmessage: 'Invalid test seconds is not a number.' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: -1,        timezone: undefined, xlength: 1, xmessage: 'Invalid test seconds (expected 0 <= seconds <= 59): -1' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 59,        timezone: undefined, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 60,        timezone: undefined, xlength: 1, xmessage: 'Invalid test seconds (expected 0 <= seconds <= 59): 60' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone: 'nan',     xlength: 1, xmessage: 'Invalid test timezone is not a number.' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone: 0,         xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone: -86399999, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone: -86400000, xlength: 1, xmessage: 'Invalid test timezone is out of range.' },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone:  86399999, xlength: 0, xmessage: undefined },
            { year: 2001,      month: 0,         day: 1,         hours: 23,        minutes: 0,         seconds: 0,         timezone:  86400000, xlength: 1, xmessage: 'Invalid test timezone is out of range.' },
        ];
        for (const row of cases) {
            const title = 'validateDateSettings(' + row.year + ', ' + row.month + ', ' + row.day + ', ' + row.hours + ', ' + row.minutes + ', ' + row.seconds + ', ' + row.timezone + ')';
            test(title, () => {
                const actual = validateDateSettings(timestamp, row.year as number, row.month as number, row.day as number, row.hours as number, row.minutes as number, row.seconds as number, row.timezone as number);
                assert.ok(Array.isArray(actual));
                assert.equal(actual.length, row.xlength);
                if (actual.length > 0) {
                    assert.ok(actual[0]);
                    assert.equal(actual[0].message, row.xmessage);
                }
            });
        }
    });

    describe('calcStartDate', () => {
        test('start = stop, useUTC=false', () => {
            const now = new Date();
            const start = new PartialDate();
            const expected = new Date(2001, 0, 1, 0, 0, 0, 0);
            const actual = calcStartDate(start, now, now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), undefined as unknown as number, false);
            assert.equal(actual.getTime(), expected.getTime());
        });

        test('start = stop, useUTC=true', () => {
            const now = new Date();
            const start = new PartialDate();
            const expected = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            const actual = calcStartDate(start, now, now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), 0, true);
            assert.equal(actual.getTime(), expected.getTime());
        });

        test('start > stop, start.day == undefined, back one day, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 1, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            const expected = new Date(Date.UTC(2015, 1, 3, 12, 0, 0, 0));
            const actual = calcStartDate(start, stop, 2015, 1, 4, 12, 0, 0, 0, true);
            assert.equal(actual.getTime(), expected.getTime());
        });

        test('start > stop, start.day == defined, month = 1, start.month == undefined, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 1, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            start.day = 5;
            const expected = new Date(Date.UTC(2015, 0, 5, 12, 0, 0));
            const actual = calcStartDate(start, stop, 2015, 1, 5, 12, 0, 0, 0, true);
            assert.equal(actual.getTime(), expected.getTime());
        });

        test('start > stop, start.day == defined, month = 0, start.month == undefined, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 0, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            start.day = 5;
            const expected = new Date(Date.UTC(2014, 11, 5, 12, 0, 0));
            const actual = calcStartDate(start, stop, 2015, 0, 5, 12, 0, 0, 0, true);
            assert.equal(actual.getTime(), expected.getTime());
        });

        test('start > stop, start.day == defined, month = 0, start.month == defined, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 0, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            start.day = 5;
            start.month = 11;
            const expected = new Date(Date.UTC(2014, 11, 5, 12, 0, 0));
            const actual = calcStartDate(start, stop, 2015, 11, 5, 12, 0, 0, 0, true);
            assert.equal(actual.getTime(), expected.getTime());
        });

        test('start < stop, useUTC=true', () => {
            const now = new Date(Date.UTC(2015, 1, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            const expected = new Date(Date.UTC(2015, 1, 3, 12, 0, 0));
            const actual = calcStartDate(start, now, 2015, 1, 3, 12, 0, 0, 0, true);
            assert.equal(actual.getTime(), expected.getTime());
        });
    });

    describe('calculateStartStopNow', () => {
        test('stop has errors', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 'invalid' as unknown as number;
            const now = new Date(Date.UTC(2015, 0, 1, 12, 0, 0, 0));
            const actual = calculateStartStopNow(start, stop, 3600, now);
            assert.ok(actual);
            assert.equal(actual.start, undefined);
            assert.equal(actual.stop, undefined);
            assert.ok(actual.errors);
            assert.ok(Array.isArray(actual.errors));
            assert.equal(actual.errors.length, 1);
        });

        test('start has errors', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 'invalid' as unknown as number;
            const now = new Date(Date.UTC(2015, 0, 1, 12, 0, 0, 0));
            const actual = calculateStartStopNow(start, stop, 3600, now);
            assert.ok(actual);
            assert.equal(actual.start, undefined);
            assert.equal(actual.stop, undefined);
            assert.ok(actual.errors);
            assert.ok(Array.isArray(actual.errors));
            assert.equal(actual.errors.length, 1);
        });

        test('start == stop', () => {
            const stop = new PartialDate();
            stop.year = 2015;
            stop.month = 0;
            stop.day = 1;
            stop.hours = 12;
            stop.minutes = 0;
            stop.seconds = 0;
            stop.timezone = 0;
            const start = Object.assign(new PartialDate(), stop);
            start.year = undefined;
            const now = new Date(Date.UTC(2015, 0, 1, 12, 0, 0, 0));
            const actual = calculateStartStopNow(start, stop, 3600, now);
            assert.ok(actual);
            assert.ok(actual.start);
            assert.ok(actual.stop);
            assert.ok(actual.errors);
            assert.ok(Array.isArray(actual.errors));
            assert.equal(actual.errors.length, 0);
        });

        test('start > stop', () => {
            const stop = new PartialDate();
            stop.parse('2010/01/01:12:00:00 Z', false);
            const start = new PartialDate();
            start.parse('2018/01/01:12:00:00 Z', false);
            const now = new Date(Date.UTC(2015, 0, 1, 12, 0, 0, 0));
            const actual = calculateStartStopNow(start, stop, 3600, now);

            assert.ok(actual);
            assert.ok(actual.start);
            assert.ok(actual.stop);
            assert.ok(actual.errors);
            assert.ok(Array.isArray(actual.errors));
            assert.equal(actual.errors.length, 1);
        });

    // describe('calculateStartStopNow', () => {
    //     const table = [
    //         { start: '@0', stop: '@666000', slotWidth: Infinity, nowMS: 0, expectedStartMS: 978328800000, expectedStopMS: 1537678799000 }
    //     ];
    //     const x = new Date(978328800000);
    //     console.log('start=' + x.toISOString());
    //     table.forEach((entry) => {
    //         test('start='+entry.start+', stop='+entry.stop, () => {
    //             const start = d.parsePartialDate(entry.start, true);
    //             const stop = d.parsePartialDate(entry.stop, false);
    //             const slotWidth = entry.slotWidth;
    //             const now = (entry.nowMS === 0) ? new Date() : new Date(entry.nowMS);
    //             const expectedStartMS = entry.expectedStartMS;
    //             const expectedStopMS = entry.expectedStopMS;
    //             const result = d.calculateStartStopNow(start, stop, slotWidth, now);
    //             expect(result).toBeDefined();
    //             expect(result.errors.length).toBe(0);
    //             expect(result.start).toBeDefined();
    //             expect(result.start.getTime()).toBe(expectedStartMS);
    //             expect(result.stop).toBeDefined();
    //             expect(result.stop.getTime()).toBe(expectedStopMS);
    //         });
    //     });
    // });

    });

    describe('calculateStartStop', () => {
        test('happy path', () => {
            const stop = new PartialDate();
            stop.parse('2010/01/02:12:00:00 Z', false);
            const start = new PartialDate();
            start.parse('2010/01/01:12:00:00 Z', false);
            const actual = calculateStartStop(start, stop, 3600);

            assert.ok(actual);
            assert.ok(actual.start);
            assert.ok(actual.stop);
            assert.ok(actual.errors);
            assert.ok(Array.isArray(actual.errors));
            assert.equal(actual.errors.length, 0);
        });

        test('start > stop', () => {
            const stop = new PartialDate();
            stop.parse('2010/01/01:12:00:00 Z', false);
            const start = new PartialDate();
            start.parse('2018/01/01:12:00:00 Z', false);
            const actual = calculateStartStop(start, stop, 3600);

            assert.ok(actual);
            assert.ok(actual.start);
            assert.ok(actual.stop);
            assert.ok(actual.errors);
            assert.ok(Array.isArray(actual.errors));
            assert.equal(actual.errors.length, 1);
        });

        test('calculateStartStop(stop=empty, start=empty, slotWidth=Infinity)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            const startStop = calculateStartStop(start, stop, Infinity);
            const expectedStart = new Date(2001, 0, 1, 0, 0, 0);
            const expectedStop = new Date();
            assert.equal(typeof startStop, 'object');
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 0);
            assert.ok(startStop.start);
            assert.equal(startStop.start.getTime(), expectedStart.getTime());
            assert.ok(startStop.stop);
            assert.equal(startStop.stop.getFullYear(), expectedStop.getFullYear());
            assert.equal(startStop.stop.getMonth(), expectedStop.getMonth());
            assert.equal(startStop.stop.getDate(), expectedStop.getDate());
            assert.equal(startStop.stop.getHours(), 23);
            assert.equal(startStop.stop.getMinutes(), 59);
            assert.equal(startStop.stop.getSeconds(), 59);
            assert.equal(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
        });

        test('test calculateStartStop(stop=empty, start=empty, slotWidth=86400)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            const startStop = calculateStartStop(start, stop, 86400);
            const expectedStart = new Date(2001, 0, 1, 0, 0, 0);
            const expectedStop = new Date();
            assert.equal(typeof startStop, 'object');
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 0);
            assert.ok(startStop.start);
            assert.equal(startStop.start.getTime(), expectedStart.getTime());
            assert.ok(startStop.stop);
            assert.equal(startStop.stop.getFullYear(), expectedStop.getFullYear());
            assert.equal(startStop.stop.getMonth(), expectedStop.getMonth());
            assert.equal(startStop.stop.getDate(), expectedStop.getDate());
            assert.equal(startStop.stop.getHours(), 23);
            assert.equal(startStop.stop.getMinutes(), 59);
            assert.equal(startStop.stop.getSeconds(), 59);
            assert.equal(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
        });


        test('calculateStartStop(stop=empty, start=empty, slotWidth=3600)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            const startStop = calculateStartStop(start, stop, 3600);
            const expectedStart = new Date(2001, 0, 1, 0, 0, 0);
            const expectedStop = new Date();
            assert.equal(typeof startStop, 'object');
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getTime(), expectedStart.getTime());
            assert.ok(startStop.stop);
            assert.equal(startStop.stop.getFullYear(), expectedStop.getFullYear());
            assert.equal(startStop.stop.getMonth(), expectedStop.getMonth());
            assert.equal(startStop.stop.getDate(), expectedStop.getDate());
            assert.equal(startStop.stop.getHours(), expectedStop.getHours());
            assert.equal(startStop.stop.getMinutes(), 59);
            assert.equal(startStop.stop.getSeconds(), 59);
            assert.equal(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
         });

        test('calculateStartStop(stop=empty, start=empty, slotWidth=60)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            const startStop = calculateStartStop(start, stop, 60);
            const expectedStart = new Date(2001, 0, 1, 0, 0, 0);
            const expectedStop = new Date();
            assert.equal(typeof startStop, 'object');
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getTime(), expectedStart.getTime());
            assert.ok(startStop.stop);
            assert.equal(startStop.stop.getFullYear(), expectedStop.getFullYear());
            assert.equal(startStop.stop.getMonth(), expectedStop.getMonth());
            assert.equal(startStop.stop.getDate(), expectedStop.getDate());
            assert.equal(startStop.stop.getHours(), expectedStop.getHours());
            assert.ok(Math.abs(startStop.stop.getMinutes() - expectedStop.getMinutes()) < 2);
            assert.equal(startStop.stop.getSeconds(), 59);
            assert.equal(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
         });

        test('calculateStartStop(stop=year isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 'twenty-twelve' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/year is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=year < 1970)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 1900;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected year > 1970/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=month isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.month = 'January' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/month is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=month < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.month = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/month is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=month > 11)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.month = 12;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/month is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.day = 'first' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            // console.log(`day is not a number=${startStop.errors[0].message}`);
            assert(/day of month is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day is zero)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.day = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/01/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 0;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/01/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 0;
            stop.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 1;
            stop.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2012/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 1;
            stop.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2012/02/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 1;
            stop.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2000/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2000;
            stop.month = 1;
            stop.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2000/02/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2000;
            stop.month = 1;
            stop.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2100/02/28)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2100;
            stop.month = 1;
            stop.day = 28;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2100/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2100;
            stop.month = 1;
            stop.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/03/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 2;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/03/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 2;
            stop.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/04/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 3;
            stop.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/04/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 3;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/05/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 4;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/05/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 4;
            stop.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/06/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 5;
            stop.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/06/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 5;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/07/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 6;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/07/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 6;
            stop.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/08/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 7;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/08/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 7;
            stop.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/09/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 8;
            stop.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/09/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 8;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/10/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 9;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/10/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 9;
            stop.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/11/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 10;
            stop.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/11/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 10;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=day 2013/12/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 11;
            stop.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=day 2013/12/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2013;
            stop.month = 11;
            stop.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=hours isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.hours = 'Noon' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/hours is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=hours < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.hours = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=hours == 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.hours = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=hours is 24)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.hours = 24;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=hours == 23)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.hours = 23;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=minutes isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.minutes = 'none' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/minutes is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=minutes < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.minutes = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=minutes == 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.minutes = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=minutes is 60)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.minutes = 60;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=minutes == 59)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.minutes = 59;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=seconds isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.seconds = 'zero' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/seconds is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=seconds < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.seconds = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=seconds == 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.seconds = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=seconds is 60)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.seconds = 60;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=seconds == 59)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.seconds = 59;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=timezone isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.timezone = 'UTC' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/timezone is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=timezone <= -24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.timezone = -24 * 60 * 60 * 1000;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/timezone is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=timezone > -24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.timezone = (-24 * 60 * 60 * 1000) + 1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(stop=timezone >= 24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.timezone = 24 * 60 * 60 * 1000;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/timezone is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(stop=timezone < 24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.timezone = (24 * 60 * 60 * 1000) - 1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=year isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 'twenty-twelve' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/year is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=year < 1970)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 1900;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.start, undefined);
            assert.equal(startStop.stop, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected year > 1970/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=month isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.month = 'January' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.start, undefined);
            assert.equal(startStop.stop, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/month is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=month < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.month = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.start, undefined);
            assert.equal(startStop.stop, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/month is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=month > 11)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.month = 12;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.start, undefined);
            assert.equal(startStop.stop, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/month is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.day = 'first' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.start, undefined);
            assert.equal(startStop.stop, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
//            console.log(`day is not a number=${startStop.errors[0].message}`);
            assert(/day of month is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day is zero)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.day = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.start, undefined);
            assert.equal(startStop.stop, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/01/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 0;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.start, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/01/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 0;
            start.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 1;
            start.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2012/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 1;
            start.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2012/02/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 1;
            start.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2000/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2000;
            start.month = 1;
            start.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2000/02/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2000;
            start.month = 1;
            start.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2100/02/28)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2100;
            stop.month = 11;
            stop.day = 31;
            start.year = 2100;
            start.month = 1;
            start.day = 28;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2100/02/29)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2100;
            start.month = 1;
            start.day = 29;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/03/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 2;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/03/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 2;
            start.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/04/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 3;
            start.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/04/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 3;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/05/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 4;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/05/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 4;
            start.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/06/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 5;
            start.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/06/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 5;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/07/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 6;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/07/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 6;
            start.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/08/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 7;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/08/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 7;
            start.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2013/09/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 8;
            start.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2013/09/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 8;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2012/10/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 9;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2012/10/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 9;
            start.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2012/11/30)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 10;
            start.day = 30;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2012/11/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 10;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=day 2012/12/31)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 11;
            start.day = 31;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=day 2012/12/32)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 11;
            start.day = 32;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/day of month/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=hours isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = 'Noon' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/hours is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=hours < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=hours == 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=hours is 24)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = 24;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=hours == 23)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 0;
            start.day = 1;
            start.hours = 23;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=minutes isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.minutes = 'none' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/minutes is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=minutes < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.minutes = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=minutes == 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = 0;
            start.minutes = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=minutes is 60)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.minutes = 60;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=minutes == 59)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = 0;
            start.minutes = 59;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=seconds isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.seconds = 'zero' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/seconds is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=seconds < 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.seconds = -1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=seconds == 0)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = 0;
            start.minutes = 0;
            start.seconds = 0;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=seconds is 60)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.seconds = 60;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=seconds == 59)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.hours = 0;
            start.minutes = 0;
            start.seconds = 59;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=timezone isNaN)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.timezone = 'UTC' as unknown as number;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof Error);
            assert(/timezone is not a number/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=timezone <= -24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.timezone = -24 * 60 * 60 * 1000;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/timezone is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=timezone > -24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 0;
            start.day = 1;
            start.hours = 0;
            start.minutes = 0;
            start.seconds = 0;
            start.timezone = (-24 * 60 * 60 * 1000) + 1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start=timezone >= 24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.timezone = 24 * 60 * 60 * 1000;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.equal(startStop.stop, undefined);
            assert.equal(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/timezone is out of range/.test(startStop.errors[0].message));
        });

        test('calculateStartStop(start=timezone < 24 hours)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2012;
            start.month = 0;
            start.day = 1;
            start.hours = 0;
            start.minutes = 0;
            start.seconds = 0;
            start.timezone = (24 * 60 * 60 * 1000) - 1;
            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
        });

        test('calculateStartStop(start > stop)', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 2013;
            start.month = 0;
            start.day = 1;
            start.hours = 0;
            start.minutes = 0;
            start.seconds = 0;
            start.timezone = 0;
            stop.year = 2012;
            stop.month = 0;
            stop.day = 1;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;
            stop.timezone = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.equal(startStop.errors.length, 1);
            assert(startStop.errors[0] instanceof RangeError);
            assert(/Start time .* is after stop time/.test(startStop.errors[0].message));
        });

        test('calculateStartStop() go back one day', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 0;
            stop.day = 10;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;

            start.hours = 10;
            start.minutes = 0;
            start.seconds = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getFullYear(), 2012);
            assert.equal(startStop.start.getMonth(), 0);
            assert.equal(startStop.start.getDate(), 9);
            assert.equal(startStop.start.getHours(), 10);
            assert.equal(startStop.start.getMinutes(), 0);
            assert.equal(startStop.start.getSeconds(), 0);
        });

        test('calculateStartStop() go back one month - timezone set', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 1;
            stop.day = 10;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;
            stop.timezone = 0;

            start.day = 11;
            start.hours = 10;
            start.minutes = 0;
            start.seconds = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getUTCFullYear(), 2012);
            assert.equal(startStop.start.getUTCMonth(), 0);
            assert.equal(startStop.start.getUTCDate(), 11);
            assert.equal(startStop.start.getUTCHours(), 10);
            assert.equal(startStop.start.getUTCMinutes(), 0);
            assert.equal(startStop.start.getUTCSeconds(), 0);
        });

        test('calculateStartStop() go back one month to december - timezone set', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 0;
            stop.day = 10;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;
            stop.timezone = 0;

            start.day = 11;
            start.hours = 10;
            start.minutes = 0;
            start.seconds = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getUTCFullYear(), 2011);
            assert.equal(startStop.start.getUTCMonth(), 11);
            assert.equal(startStop.start.getUTCDate(), 11);
            assert.equal(startStop.start.getUTCHours(), 10);
            assert.equal(startStop.start.getUTCMinutes(), 0);
            assert.equal(startStop.start.getUTCSeconds(), 0);
        });

        test('calculateStartStop() go back one month - timezone undefined', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 2;
            stop.day = 10;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;

            start.day = 12;
            start.hours = 10;
            start.minutes = 0;
            start.seconds = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getFullYear(), 2012);
            assert.equal(startStop.start.getMonth(), 1);
            assert.equal(startStop.start.getDate(), 12);
            assert.equal(startStop.start.getHours(), 10);
            assert.equal(startStop.start.getMinutes(), 0);
            assert.equal(startStop.start.getSeconds(), 0);
        });

        test('calculateStartStop() go back one month to december - timezone undefined', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 0;
            stop.day = 10;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;

            start.day = 11;
            start.hours = 10;
            start.minutes = 0;
            start.seconds = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getFullYear(), 2011);
            assert.equal(startStop.start.getMonth(), 11);
            assert.equal(startStop.start.getDate(), 11);
            assert.equal(startStop.start.getHours(), 10);
            assert.equal(startStop.start.getMinutes(), 0);
            assert.equal(startStop.start.getSeconds(), 0);
        });

        test('calculateStartStop() go back one year - timezone set', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 2;
            stop.day = 10;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;
            stop.timezone = 0;

            start.month = 10;
            start.day = 11;
            start.hours = 10;
            start.minutes = 0;
            start.seconds = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getUTCFullYear(), 2011);
            assert.equal(startStop.start.getUTCMonth(), 10);
            assert.equal(startStop.start.getUTCDate(), 11);
            assert.equal(startStop.start.getUTCHours(), 10);
            assert.equal(startStop.start.getUTCMinutes(), 0);
            assert.equal(startStop.start.getUTCSeconds(), 0);
        });

        test('calculateStartStop() go back one year - timezone undefined', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 2012;
            stop.month = 2;
            stop.day = 10;
            stop.hours = 0;
            stop.minutes = 0;
            stop.seconds = 0;

            start.month = 10;
            start.day = 11;
            start.hours = 10;
            start.minutes = 0;
            start.seconds = 0;

            const startStop = calculateStartStop(start, stop, 60);
            assert.equal(typeof startStop, 'object');
            assert.notEqual(startStop.stop, undefined);
            assert.notEqual(startStop.start, undefined);
            assert.ok(Array.isArray(startStop.errors));
            assert.ok(startStop.start);
            assert.equal(startStop.start.getFullYear(), 2011);
            assert.equal(startStop.start.getMonth(), 10);
            assert.equal(startStop.start.getDate(), 11);
            assert.equal(startStop.start.getHours(), 10);
            assert.equal(startStop.start.getMinutes(), 0);
            assert.equal(startStop.start.getSeconds(), 0);
        });

    });

});
