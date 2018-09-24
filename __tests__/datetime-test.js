/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018 James Burlingame
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

const when = require('when');
const path = require('path');
const os = require('os');

const testData = require('../test/testData.js');

const scanfile = require('../lib/scanfile.js');

const d = require('./../lib/datetime.js');
const PartialDate = d.PartialDate;

describe('datetime', () => {
    const checkStopFunc = (func, stop, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone) => {
        func(stop);
        expect(stop.year).toBe(xyear);
        expect(stop.month).toBe(xmonth);
        expect(stop.day).toBe(xday);
        expect(stop.hours).toBe(xhours);
        expect(stop.minutes).toBe(xminutes);
        expect(stop.seconds).toBe(xseconds);
        expect(stop.timezone).toBe(xtimezone);
    };
    const checkStopParse = (timestamp, roundDown, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone) => {
        const stop = new PartialDate();
        const func = (stop) => {
            stop.parse(timestamp, roundDown);
        };
        checkStopFunc(func, stop, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone);
    };

    test.each(['year', 'month', 'day', 'hours', 'minutes', 'seconds', 'timezone'])('empty field %s are undefined', (prop) => {
        const empty = new PartialDate();
        expect(empty).toHaveProperty(prop, undefined);
    });

    test.each([
        [
            'setTime(1383136415000)=Wed, 30 Oct 2013 12:33:35 +0000',
            (stop) => stop.setTime(1383136415000),
            2013,
            9,
            30,
            12,
            33,
            35,
            0
        ],
        [
            'parse("@1383136415")',
            (stop) => stop.parse('@1383136415'),
            2013,
            9,
            30,
            12,
            33,
            35,
            0
        ]
    ])('%s', (name, func, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone) => {
        const stop = new PartialDate();
        checkStopFunc(func, stop, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone);
    });

    test.each([
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
    ] )('PartialDate.isValidFormat(%s) is truthy', (fmt) => {
        expect(PartialDate.isValidFormat(fmt)).toBeTruthy();
    });

    test.each([
        '@none',
        '9999999999',
    ] )('PartialDate.isValidFormat(%s) is falsy', (fmt) => {
        expect(PartialDate.isValidFormat(fmt)).toBeFalsy();
    });

    describe('parse', () => {
        test.each([
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
        ])('stop.parse(%s, %s)', (timestamp, roundDown, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone) => {
            checkStopParse(timestamp, roundDown, xyear, xmonth, xday, xhours, xminutes, xseconds, xtimezone);
        });

        test('invalid date throws', () => {
            const checkParse = () => {
                const stop = new PartialDate();
                stop.parse('invalid-date');
            };

            expect(checkParse).toThrow();
        });
    });

    const checkUtmp = () => {
        var exists = os.type().toLowerCase() == 'linux';
        try {
            const utmp = require('samplx-utmp');   // eslint-disable-line no-unused-vars
        } catch (e) {
            console.log('No utmp module');
            exists = false;
        }
        return exists;
    };

    const haveUtmp = checkUtmp();

    describe('lastReboot', () => {
        test('lastReboot valid time', done => {
            const pathname = path.join(testData.getDataDirectory(), 'datetime', 'valid');
            scanfile.setRootDirectory(pathname);
            const promise = d.lastReboot();
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then((reboot) => {
                if (haveUtmp) {
                    expect(reboot.year).toBe(2013);
                    expect(reboot.month).toBe(9);
                    expect(reboot.day).toBe(28);
                    expect(reboot.hours).toBe(10);
                    expect(reboot.minutes).toBe(9);
                    expect(reboot.seconds).toBe(52);
                    expect(reboot.timezone).toBe(0);
                } else {
                    expect(reboot.year).toBeUndefined();
                    expect(reboot.month).toBeUndefined();
                    expect(reboot.day).toBeUndefined();
                    expect(reboot.hours).toBeUndefined();
                    expect(reboot.minutes).toBeUndefined();
                    expect(reboot.seconds).toBeUndefined();
                    expect(reboot.timezone).toBeUndefined();
                }
                done();
            });
        });

        test('lastReboot missing wtmp', done => {
            const pathname = path.join(testData.getDataDirectory(), 'datetime', 'missing');
            scanfile.setRootDirectory(pathname);
            const promise = d.lastReboot();
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then((reboot) => {
                expect(reboot.year).toBeUndefined();
                expect(reboot.month).toBeUndefined();
                expect(reboot.day).toBeUndefined();
                expect(reboot.hours).toBeUndefined();
                expect(reboot.minutes).toBeUndefined();
                expect(reboot.seconds).toBeUndefined();
                expect(reboot.timezone).toBeUndefined();
                done();
            });
        });
    });

    describe('parsePartialDate("reboot"...', () => {
        test('valid wtmp', done => {
            const pathname = path.join(testData.getDataDirectory(), 'datetime', 'valid');
            scanfile.setRootDirectory(pathname);
            const promise = d.parsePartialDate('reboot', false);
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then((reboot) => {
                if (haveUtmp) {
                    expect(reboot.year).toBe(2013);
                    expect(reboot.month).toBe(9);
                    expect(reboot.day).toBe(28);
                    expect(reboot.hours).toBe(10);
                    expect(reboot.minutes).toBe(9);
                    expect(reboot.seconds).toBe(52);
                    expect(reboot.timezone).toBe(0);
                } else {
                    expect(reboot.year).toBeUndefined();
                    expect(reboot.month).toBeUndefined();
                    expect(reboot.day).toBeUndefined();
                    expect(reboot.hours).toBeUndefined();
                    expect(reboot.minutes).toBeUndefined();
                    expect(reboot.seconds).toBeUndefined();
                    expect(reboot.timezone).toBeUndefined();
                }
                done();
            });
        });
    });


    describe('parsePartialDate("non-reboot"...', () => {
        test('01/Feb', done => {
            const promise = d.parsePartialDate('01/Feb', false);
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then((timestamp) => {
                expect(timestamp.year).toBeUndefined();
                expect(timestamp.month).toBe(1);
                expect(timestamp.day).toBe(1);
                expect(timestamp.hours).toBe(23);
                expect(timestamp.minutes).toBe(59);
                expect(timestamp.seconds).toBe(59);
                expect(timestamp.timezone).toBeUndefined();
                done();
            });
        });
    });

    describe('calcTimezone', () => {
        const cases = [
            { startTimezone: undefined, stopTimezone: undefined, expected: [ false, undefined, undefined ] },
            { startTimezone: undefined, stopTimezone: 8 * 60,    expected: [ true,  8 * 60,    8 * 60 ] },
            { startTimezone: 6 * 60,    stopTimezone: undefined, expected: [ true,  6 * 60,    6 * 60 ] },
            { startTimezone: 6 * 60,    stopTimezone: 8 * 60,    expected: [ true,  6 * 60,    8 * 60 ] }
        ];
        cases.forEach((row) => {
            test('calcTimezone: ' + row.startTimezone + ', ' + row.stopTimezone, () => {
                const results = d.calcTimezone(row.startTimezone, row.stopTimezone);
                expect(results).toEqual(row.expected);
            });
        });
    });

    describe('calcYear', () => {
        const cases = [
            { stopYear: undefined, useUTC: false, now: new Date(2010, 0, 1), expected: 2010 },
            { stopYear: undefined, useUTC: true,  now: new Date(2010, 0, 1), expected: 2010 },
            { stopYear: 2018,      useUTC: false, now: new Date(2010, 0, 1), expected: 2018 },
            { stopYear: 2018,      useUTC: true,  now: new Date(2010, 0, 1), expected: 2018 },
        ];
        cases.forEach((row) => {
            test('calcYear: ' + row.stopYear + ', ' + row.useUTC + ', ' + row.now.toUTCString(), () => {
                const results = d.calcYear(row.stopYear, row.useUTC, row.now);
                expect(results).toEqual(row.expected);
            });
        });
    });

    describe('calcMonth', () => {
        const cases = [
            { stopMonth: undefined, useUTC: false, now: new Date(2010, 0, 1), expected: 0 },
            { stopMonth: undefined, useUTC: true,  now: new Date(2010, 0, 1), expected: 0 },
            { stopMonth: 2,         useUTC: false, now: new Date(2010, 0, 1), expected: 2 },
            { stopMonth: 3,         useUTC: true,  now: new Date(2010, 0, 1), expected: 3 },
        ];
        cases.forEach((row) => {
            test('calcMonth: ' + row.stopMonth + ', ' + row.useUTC + ', ' + row.now.toUTCString(), () => {
                const results = d.calcMonth(row.stopMonth, row.useUTC, row.now);
                expect(results).toEqual(row.expected);
            });
        });
    });

    describe('calcDay', () => {
        const cases = [
            { stopDay: undefined, useUTC: false, now: new Date(2010, 0, 1), expected: 1 },
            { stopDay: undefined, useUTC: true,  now: new Date(2010, 0, 1), expected: 1 },
            { stopDay: 2,         useUTC: false, now: new Date(2010, 0, 1), expected: 2 },
            { stopDay: 3,         useUTC: true,  now: new Date(2010, 0, 1), expected: 3 },
        ];
        cases.forEach((row) => {
            test('calcDay: ' + row.stopDay + ', ' + row.useUTC + ', ' + row.now.toUTCString(), () => {
                const results = d.calcDay(row.stopDay, row.useUTC, row.now);
                expect(results).toEqual(row.expected);
            });
        });
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
        cases.forEach((row) => {
            test('calcHours: ' + row.stopHours + ', ' + row.slotWidth +', ' + row.useUTC + ', ' + row.now.toUTCString(), () => {
                const results = d.calcHours(row.stopHours, row.slotWidth, row.useUTC, row.now);
                expect(results).toEqual(row.expected);
            });
        });
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
        cases.forEach((row) => {
            test('calcMinutes: ' + row.stopMinutes + ', ' + row.slotWidth +', ' + row.useUTC + ', ' + row.now.toUTCString(), () => {
                const results = d.calcMinutes(row.stopMinutes, row.slotWidth, row.useUTC, row.now);
                expect(results).toEqual(row.expected);
            });
        });
    });

    describe('calcSeconds', () => {
        const cases = [
            { stopSeconds: undefined, expected: 59 },
            { stopSeconds: 30, expected: 30 },
        ];
        cases.forEach((row) => {
            test('calcSeconds: ' + row.stopSeconds, () => {
                const results = d.calcSeconds(row.stopSeconds);
                expect(results).toEqual(row.expected);
            });
        });
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
        cases.forEach((row) => {
            test('dateFactory: ' + row.timezone + ', ' + row.useUTC + ', ' + row.inputDate, () => {
                const results = d.dateFactory(2018, 1, 2, 3, 4, 5, row.timezone, row.useUTC);
                expect(results).toEqual(row.expected);
            });
        });
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
        cases.forEach((row) => {
            const title = 'validateDateSettings(' + row.year + ', ' + row.month + ', ' + row.day + ', ' + row.hours + ', ' + row.minutes + ', ' + row.seconds + ', ' + row.timezone + ')';
            test(title, () => {
                const actual = d.validateDateSettings(timestamp, row.year, row.month, row.day, row.hours, row.minutes, row.seconds, row.timezone);
                expect(Array.isArray(actual)).toBeTruthy();
                expect(actual.length).toBe(row.xlength);
                if (actual.length > 0) {
                    expect(actual[0].message).toBe(row.xmessage);
                }
            });
        });
    });

    describe('calcStartDate', () => {
        test('start = stop, useUTC=false', () => {
            const now = new Date();
            const start = new PartialDate();
            const expected = new Date(2001, 0, 1, 0, 0, 0, 0);
            const actual = d.calcStartDate(start, now, now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), undefined, false);
            expect(actual).toEqual(expected);
        });

        test('start = stop, useUTC=true', () => {
            const now = new Date();
            const start = new PartialDate();
            const expected = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            const actual = d.calcStartDate(start, now, now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), 0, true);
            expect(actual).toEqual(expected);
        });

        test('start > stop, start.day == undefined, back one day, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 1, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            const expected = new Date(Date.UTC(2015, 1, 3, 12, 0, 0, 0));
            const actual = d.calcStartDate(start, stop, 2015, 1, 4, 12, 0, 0, 0, true);
            expect(actual).toEqual(expected);
        });

        test('start > stop, start.day == defined, month = 1, start.month == undefined, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 1, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            start.day = 5;
            const expected = new Date(Date.UTC(2015, 0, 5, 12, 0, 0));
            const actual = d.calcStartDate(start, stop, 2015, 1, 5, 12, 0, 0, 0, true);
            expect(actual).toEqual(expected);
        });

        test('start > stop, start.day == defined, month = 0, start.month == undefined, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 0, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            start.day = 5;
            const expected = new Date(Date.UTC(2014, 11, 5, 12, 0, 0));
            const actual = d.calcStartDate(start, stop, 2015, 0, 5, 12, 0, 0, 0, true);
            expect(actual).toEqual(expected);
        });

        test('start > stop, start.day == defined, month = 0, start.month == defined, useUTC=true', () => {
            const stop = new Date(Date.UTC(2015, 0, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            start.day = 5;
            start.month = 11;
            const expected = new Date(Date.UTC(2014, 11, 5, 12, 0, 0));
            const actual = d.calcStartDate(start, stop, 2015, 11, 5, 12, 0, 0, 0, true);
            expect(actual).toEqual(expected);
        });

        test('start < stop, useUTC=true', () => {
            const now = new Date(Date.UTC(2015, 1, 4, 0, 0, 0, 0));
            const start = new PartialDate();
            const expected = new Date(Date.UTC(2015, 1, 3, 12, 0, 0));
            const actual = d.calcStartDate(start, now, 2015, 1, 3, 12, 0, 0, 0, true);
            expect(actual).toEqual(expected);
        });
    });

    describe('calculateStartStopNow', () => {
        test('stop has errors', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            stop.year = 'invalid';
            const now = new Date(Date.UTC(2015, 0, 1, 12, 0, 0, 0));
            const actual = d.calculateStartStopNow(start, stop, 3600, now);
            expect(actual).toBeDefined();
            expect(actual.start).toBeUndefined();
            expect(actual.stop).toBeUndefined();
            expect(actual.errors).toBeDefined();
            expect(Array.isArray(actual.errors)).toBeTruthy();
            expect(actual.errors.length).toBe(1);
        });

        test('start has errors', () => {
            const start = new PartialDate();
            const stop = new PartialDate();
            start.year = 'invalid';
            const now = new Date(Date.UTC(2015, 0, 1, 12, 0, 0, 0));
            const actual = d.calculateStartStopNow(start, stop, 3600, now);
            expect(actual).toBeDefined();
            expect(actual.start).toBeUndefined();
            expect(actual.stop).toBeUndefined();
            expect(actual.errors).toBeDefined();
            expect(Array.isArray(actual.errors)).toBeTruthy();
            expect(actual.errors.length).toBe(1);
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
            const actual = d.calculateStartStopNow(start, stop, 3600, now);

            expect(actual).toBeDefined();
            expect(actual.start).toBeDefined();
            expect(actual.stop).toBeDefined();
            expect(actual.errors).toBeDefined();
            expect(Array.isArray(actual.errors)).toBeTruthy();
            expect(actual.errors.length).toBe(0);
        });

        test('start > stop', () => {
            const stop = new PartialDate();
            stop.parse('2010/01/01:12:00:00 Z');
            const start = new PartialDate();
            start.parse('2018/01/01:12:00:00 Z');
            const now = new Date(Date.UTC(2015, 0, 1, 12, 0, 0, 0));
            const actual = d.calculateStartStopNow(start, stop, 3600, now);

            expect(actual).toBeDefined();
            expect(actual.start).toBeDefined();
            expect(actual.stop).toBeDefined();
            expect(actual.errors).toBeDefined();
            expect(Array.isArray(actual.errors)).toBeTruthy();
            expect(actual.errors.length).toBe(1);
        });

    });

    describe('calculateStartStop', () => {
        test('happy path', () => {
            const stop = new PartialDate();
            stop.parse('2010/01/02:12:00:00 Z');
            const start = new PartialDate();
            start.parse('2010/01/01:12:00:00 Z');
            const actual = d.calculateStartStop(start, stop, 3600);

            expect(actual).toBeDefined();
            expect(actual.start).toBeDefined();
            expect(actual.stop).toBeDefined();
            expect(actual.errors).toBeDefined();
            expect(Array.isArray(actual.errors)).toBeTruthy();
            expect(actual.errors.length).toBe(0);
        });

        test('start > stop', () => {
            const stop = new PartialDate();
            stop.parse('2010/01/01:12:00:00 Z');
            const start = new PartialDate();
            start.parse('2018/01/01:12:00:00 Z');
            const actual = d.calculateStartStop(start, stop, 3600);

            expect(actual).toBeDefined();
            expect(actual.start).toBeDefined();
            expect(actual.stop).toBeDefined();
            expect(actual.errors).toBeDefined();
            expect(Array.isArray(actual.errors)).toBeTruthy();
            expect(actual.errors.length).toBe(1);
        });
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

    //     "test calculateStartStop(stop=empty, start=empty, slotWidth=Infinity)": function () {
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, Infinity);
    //         var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
    //         var expectedStop = new Date();
    //         assert.isObject(startStop);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start, expectedStart);
    //         assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
    //         assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
    //         assert.equals(startStop.stop.getDate(), expectedStop.getDate());
    //         assert.equals(startStop.stop.getHours(), 23);
    //         assert.equals(startStop.stop.getMinutes(), 59);
    //         assert.equals(startStop.stop.getSeconds(), 59);
    //         assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    //     },

    //     "test calculateStartStop(stop=empty, start=empty, slotWidth=86400)": function () {
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 86400);
    //         var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
    //         var expectedStop = new Date();
    //         assert.isObject(startStop);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start, expectedStart);
    //         assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
    //         assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
    //         assert.equals(startStop.stop.getDate(), expectedStop.getDate());
    //         assert.equals(startStop.stop.getHours(), 23);
    //         assert.equals(startStop.stop.getMinutes(), 59);
    //         assert.equals(startStop.stop.getSeconds(), 59);
    //         assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    //     },

    //     "test calculateStartStop(stop=empty, start=empty, slotWidth=3600)": function () {
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 3600);
    //         var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
    //         var expectedStop = new Date();
    //         assert.isObject(startStop);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start, expectedStart);
    //         assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
    //         assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
    //         assert.equals(startStop.stop.getDate(), expectedStop.getDate());
    //         assert.equals(startStop.stop.getHours(), expectedStop.getHours());
    //         assert.equals(startStop.stop.getMinutes(), 59);
    //         assert.equals(startStop.stop.getSeconds(), 59);
    //         assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    //     },

    //     "test calculateStartStop(stop=empty, start=empty, slotWidth=60)": function () {
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
    //         var expectedStop = new Date();
    //         assert.isObject(startStop);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start, expectedStart);
    //         assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
    //         assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
    //         assert.equals(startStop.stop.getDate(), expectedStop.getDate());
    //         assert.equals(startStop.stop.getHours(), expectedStop.getHours());
    //         assert.near(startStop.stop.getMinutes(), expectedStop.getMinutes(), 1);
    //         assert.equals(startStop.stop.getSeconds(), 59);
    //         assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    //     },

    //     "test calculateStartStop(stop=year isNaN)": function () {
    //         this.stop.year = 'twenty-twelve';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/year is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=year < 1970)": function () {
    //         this.stop.year = 1900;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected year > 1970/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=month isNaN)": function () {
    //         this.stop.month = 'January';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/month is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=month < 0)": function () {
    //         this.stop.month = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/month is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=month > 11)": function () {
    //         this.stop.month = 12;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/month is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day isNaN)": function () {
    //         this.stop.day = 'first';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/day is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day is zero)": function () {
    //         this.stop.day = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/01/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 0;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/01/32)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 0;
    //         this.stop.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/02/29)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 1;
    //         this.stop.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2012/02/29)": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 1;
    //         this.stop.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2012/02/30)": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 1;
    //         this.stop.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2000/02/29)": function () {
    //         this.stop.year = 2000;
    //         this.stop.month = 1;
    //         this.stop.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2000/02/30)": function () {
    //         this.stop.year = 2000;
    //         this.stop.month = 1;
    //         this.stop.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2100/02/28)": function () {
    //         this.stop.year = 2100;
    //         this.stop.month = 1;
    //         this.stop.day = 28;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2100/02/29)": function () {
    //         this.stop.year = 2100;
    //         this.stop.month = 1;
    //         this.stop.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/03/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 2;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/03/32)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 2;
    //         this.stop.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/04/30)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 3;
    //         this.stop.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/04/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 3;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/05/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 4;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/05/32)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 4;
    //         this.stop.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/06/30)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 5;
    //         this.stop.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/06/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 5;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/07/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 6;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/07/32)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 6;
    //         this.stop.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/08/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 7;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/08/32)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 7;
    //         this.stop.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/09/30)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 8;
    //         this.stop.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/09/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 8;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/10/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 9;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/10/32)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 9;
    //         this.stop.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/11/30)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 10;
    //         this.stop.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/11/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 10;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=day 2013/12/31)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 11;
    //         this.stop.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=day 2013/12/32)": function () {
    //         this.stop.year = 2013;
    //         this.stop.month = 11;
    //         this.stop.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=hours isNaN)": function () {
    //         this.stop.hours = 'Noon';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/hours is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=hours < 0)": function () {
    //         this.stop.hours = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=hours == 0)": function () {
    //         this.stop.hours = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=hours is 24)": function () {
    //         this.stop.hours = 24;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=hours == 23)": function () {
    //         this.stop.hours = 23;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=minutes isNaN)": function () {
    //         this.stop.minutes = 'none';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/minutes is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=minutes < 0)": function () {
    //         this.stop.minutes = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=minutes == 0)": function () {
    //         this.stop.minutes = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=minutes is 60)": function () {
    //         this.stop.minutes = 60;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=minutes == 59)": function () {
    //         this.stop.minutes = 59;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=seconds isNaN)": function () {
    //         this.stop.seconds = 'zero';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/seconds is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=seconds < 0)": function () {
    //         this.stop.seconds = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=seconds == 0)": function () {
    //         this.stop.seconds = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=seconds is 60)": function () {
    //         this.stop.seconds = 60;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=seconds == 59)": function () {
    //         this.stop.seconds = 59;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=timezone isNaN)": function () {
    //         this.stop.timezone = 'UTC';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/timezone is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=timezone <= -24 hours)": function () {
    //         this.stop.timezone = -24 * 60 * 60 * 1000;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/timezone is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=timezone > -24 hours)": function () {
    //         this.stop.timezone = (-24 * 60 * 60 * 1000) + 1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(stop=timezone >= 24 hours)": function () {
    //         this.stop.timezone = 24 * 60 * 60 * 1000;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/timezone is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(stop=timezone < 24 hours)": function () {
    //         this.stop.timezone = (24 * 60 * 60 * 1000) - 1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=year isNaN)": function () {
    //         this.start.year = 'twenty-twelve';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/year is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=year < 1970)": function () {
    //         this.start.year = 1900;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.start, undefined);
    //         assert.equals(startStop.stop, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected year > 1970/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=month isNaN)": function () {
    //         this.start.month = 'January';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.start, undefined);
    //         assert.equals(startStop.stop, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/month is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=month < 0)": function () {
    //         this.start.month = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.start, undefined);
    //         assert.equals(startStop.stop, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/month is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=month > 11)": function () {
    //         this.start.month = 12;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.start, undefined);
    //         assert.equals(startStop.stop, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/month is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day isNaN)": function () {
    //         this.start.day = 'first';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.start, undefined);
    //         assert.equals(startStop.stop, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/day is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day is zero)": function () {
    //         this.start.day = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.start, undefined);
    //         assert.equals(startStop.stop, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/01/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 0;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.start, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/01/32)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 0;
    //         this.start.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/02/29)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 1;
    //         this.start.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2012/02/29)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 1;
    //         this.start.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2012/02/30)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 1;
    //         this.start.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2000/02/29)": function () {
    //         this.start.year = 2000;
    //         this.start.month = 1;
    //         this.start.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2000/02/30)": function () {
    //         this.start.year = 2000;
    //         this.start.month = 1;
    //         this.start.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2100/02/28)": function () {
    //         this.stop.year = 2100;
    //         this.stop.month = 11;
    //         this.stop.day = 31;
    //         this.start.year = 2100;
    //         this.start.month = 1;
    //         this.start.day = 28;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2100/02/29)": function () {
    //         this.start.year = 2100;
    //         this.start.month = 1;
    //         this.start.day = 29;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/03/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 2;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/03/32)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 2;
    //         this.start.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/04/30)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 3;
    //         this.start.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/04/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 3;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/05/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 4;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/05/32)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 4;
    //         this.start.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/06/30)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 5;
    //         this.start.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/06/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 5;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/07/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 6;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/07/32)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 6;
    //         this.start.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/08/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 7;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/08/32)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 7;
    //         this.start.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2013/09/30)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 8;
    //         this.start.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2013/09/31)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 8;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2012/10/31)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 9;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2012/10/32)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 9;
    //         this.start.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2012/11/30)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 10;
    //         this.start.day = 30;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2012/11/31)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 10;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=day 2012/12/31)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 11;
    //         this.start.day = 31;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=day 2012/12/32)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 11;
    //         this.start.day = 32;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/day of month/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=hours isNaN)": function () {
    //         this.start.hours = 'Noon';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/hours is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=hours < 0)": function () {
    //         this.start.hours = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=hours == 0)": function () {
    //         this.start.hours = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=hours is 24)": function () {
    //         this.start.hours = 24;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=hours == 23)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 0;
    //         this.start.day = 1;
    //         this.start.hours = 23;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=minutes isNaN)": function () {
    //         this.start.minutes = 'none';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/minutes is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=minutes < 0)": function () {
    //         this.start.minutes = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=minutes == 0)": function () {
    //         this.start.hours = 0;
    //         this.start.minutes = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=minutes is 60)": function () {
    //         this.start.minutes = 60;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=minutes == 59)": function () {
    //         this.start.hours = 0;
    //         this.start.minutes = 59;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=seconds isNaN)": function () {
    //         this.start.seconds = 'zero';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/seconds is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=seconds < 0)": function () {
    //         this.start.seconds = -1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=seconds == 0)": function () {
    //         this.start.hours = 0;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=seconds is 60)": function () {
    //         this.start.seconds = 60;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=seconds == 59)": function () {
    //         this.start.hours = 0;
    //         this.start.minutes = 0;
    //         this.start.seconds = 59;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=timezone isNaN)": function () {
    //         this.start.timezone = 'UTC';
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof Error);
    //         assert(/timezone is not a number/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=timezone <= -24 hours)": function () {
    //         this.start.timezone = -24 * 60 * 60 * 1000;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/timezone is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=timezone > -24 hours)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 0;
    //         this.start.day = 1;
    //         this.start.hours = 0;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;
    //         this.start.timezone = (-24 * 60 * 60 * 1000) + 1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start=timezone >= 24 hours)": function () {
    //         this.start.timezone = 24 * 60 * 60 * 1000;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/timezone is out of range/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop(start=timezone < 24 hours)": function () {
    //         this.start.year = 2012;
    //         this.start.month = 0;
    //         this.start.day = 1;
    //         this.start.hours = 0;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;
    //         this.start.timezone = (24 * 60 * 60 * 1000) - 1;
    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //     },

    //     "test calculateStartStop(start > stop)": function () {
    //         this.start.year = 2013;
    //         this.start.month = 0;
    //         this.start.day = 1;
    //         this.start.hours = 0;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;
    //         this.start.timezone = 0;
    //         this.stop.year = 2012;
    //         this.stop.month = 0;
    //         this.stop.day = 1;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;
    //         this.stop.timezone = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         assert.equals(startStop.stop, undefined);
    //         assert.equals(startStop.start, undefined);
    //         assert.isArray(startStop.errors);
    //         assert.equals(startStop.errors.length, 1);
    //         assert(startStop.errors[0] instanceof RangeError);
    //         assert(/Start time .* is after stop time/.test(startStop.errors[0].message));
    //     },

    //     "test calculateStartStop() go back one day": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 0;
    //         this.stop.day = 10;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;

    //         this.start.hours = 10;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start.getFullYear(), 2012);
    //         assert.equals(startStop.start.getMonth(), 0);
    //         assert.equals(startStop.start.getDate(), 9);
    //         assert.equals(startStop.start.getHours(), 10);
    //         assert.equals(startStop.start.getMinutes(), 0);
    //         assert.equals(startStop.start.getSeconds(), 0);
    //     },

    //     "test calcualteStartStop() go back one month - timezone set": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 1;
    //         this.stop.day = 10;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;
    //         this.stop.timezone = 0;

    //         this.start.day = 11;
    //         this.start.hours = 10;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start.getUTCFullYear(), 2012);
    //         assert.equals(startStop.start.getUTCMonth(), 0);
    //         assert.equals(startStop.start.getUTCDate(), 11);
    //         assert.equals(startStop.start.getUTCHours(), 10);
    //         assert.equals(startStop.start.getUTCMinutes(), 0);
    //         assert.equals(startStop.start.getUTCSeconds(), 0);
    //     },

    //     "test calculateStartStop() go back one month to december - timezone set": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 0;
    //         this.stop.day = 10;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;
    //         this.stop.timezone = 0;

    //         this.start.day = 11;
    //         this.start.hours = 10;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start.getUTCFullYear(), 2011);
    //         assert.equals(startStop.start.getUTCMonth(), 11);
    //         assert.equals(startStop.start.getUTCDate(), 11);
    //         assert.equals(startStop.start.getUTCHours(), 10);
    //         assert.equals(startStop.start.getUTCMinutes(), 0);
    //         assert.equals(startStop.start.getUTCSeconds(), 0);
    //     },

    //     "test calcualteStartStop() go back one month - timezone undefined": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 2;
    //         this.stop.day = 10;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;

    //         this.start.day = 12;
    //         this.start.hours = 10;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start.getFullYear(), 2012);
    //         assert.equals(startStop.start.getMonth(), 1);
    //         assert.equals(startStop.start.getDate(), 12);
    //         assert.equals(startStop.start.getHours(), 10);
    //         assert.equals(startStop.start.getMinutes(), 0);
    //         assert.equals(startStop.start.getSeconds(), 0);
    //     },

    //     "test calculateStartStop() go back one month to december - timezone undefined": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 0;
    //         this.stop.day = 10;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;

    //         this.start.day = 11;
    //         this.start.hours = 10;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start.getFullYear(), 2011);
    //         assert.equals(startStop.start.getMonth(), 11);
    //         assert.equals(startStop.start.getDate(), 11);
    //         assert.equals(startStop.start.getHours(), 10);
    //         assert.equals(startStop.start.getMinutes(), 0);
    //         assert.equals(startStop.start.getSeconds(), 0);
    //     },

    //     "test calculateStartStop() go back one year - timezone set": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 2;
    //         this.stop.day = 10;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;
    //         this.stop.timezone = 0;

    //         this.start.month = 10;
    //         this.start.day = 11;
    //         this.start.hours = 10;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start.getUTCFullYear(), 2011);
    //         assert.equals(startStop.start.getUTCMonth(), 10);
    //         assert.equals(startStop.start.getUTCDate(), 11);
    //         assert.equals(startStop.start.getUTCHours(), 10);
    //         assert.equals(startStop.start.getUTCMinutes(), 0);
    //         assert.equals(startStop.start.getUTCSeconds(), 0);
    //     },

    //     "test calculateStartStop() go back one year - timezone undefined": function () {
    //         this.stop.year = 2012;
    //         this.stop.month = 2;
    //         this.stop.day = 10;
    //         this.stop.hours = 0;
    //         this.stop.minutes = 0;
    //         this.stop.seconds = 0;

    //         this.start.month = 10;
    //         this.start.day = 11;
    //         this.start.hours = 10;
    //         this.start.minutes = 0;
    //         this.start.seconds = 0;

    //         var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
    //         assert.isObject(startStop);
    //         refute.equals(startStop.stop, undefined);
    //         refute.equals(startStop.start, undefined);
    //         assert.equals(startStop.errors, undefined);
    //         assert.equals(startStop.start.getFullYear(), 2011);
    //         assert.equals(startStop.start.getMonth(), 10);
    //         assert.equals(startStop.start.getDate(), 11);
    //         assert.equals(startStop.start.getHours(), 10);
    //         assert.equals(startStop.start.getMinutes(), 0);
    //         assert.equals(startStop.start.getSeconds(), 0);
    //     },

    // });


});
