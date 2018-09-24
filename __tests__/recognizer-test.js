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

const recognizer = require('../lib/recognizer.js');

var r = null;
var record = {};

describe('recognizer', () => {
    beforeEach(() => {
        r = recognizer;
        r.clear();

        record = {
            host : '174.202.255.23',
            ident : '-',
            user : '-',
            timestamp: '09/06/2012:11:53:32 -0000',
            time: 1346932412000,
            request: 'POST /login/?login_only=1 HTTP/1.1',
            method: 'POST',
            uri: '/login/?login_only=1',
            protocol: 'HTTP/1.1',
            status: '200',
            size: 1024,
            referer: 'https://174.122.54.92:2087/',
            agent: 'Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2'
        };
    });


    test('test empty recognizer',  () => {
        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches method=POST', () => {
        r.addValueNC('method', 'post');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches method=GET', () => {
        r.addValueNC('method', 'get');

        expect(r.matches(record)).toBeFalsy();
    });

    test('test matches method=GET|POST', () => {
        r.addValueNC('method', 'get');
        r.addValueNC('method', 'post');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches method=GET|PUT|POST', () => {
        r.addValueNC('method', 'get');
        r.addValueNC('method', 'put');
        r.addValueNC('method', 'post');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test match fails method=GET|PUT', () => {
        r.addValueNC('method', 'get');
        r.addValueNC('method', 'put');

        expect(r.matches(record)).toBeFalsy();
    });

    test('test matches uri pattern /login.*',  () => {
        r.addPattern('uri', '/login.*');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches uri pattern regex /login.*',  () => {
        r.addPattern('uri', new RegExp('/login.*'));

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches IP 10.0.0.0/8', () => {
        r.addIP('10.0.0.0/8');

        expect(r.matches(record)).toBeFalsy();
    });

    test('test matches IP 174.202.255.23',  () => {
        r.addIP('174.202.255.23');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches IP samplx.org',  () => {
        r.addIP('174.202.255.23');
        record.host = 'samplx.org';

        expect(r.matches(record)).toBeFalsy();
    });

    test('test matches IP 174.202.255.0/24',  () => {
        r.addIP('174.202.255.0/24');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches IP 174.202.255.0/32',  () => {
        r.addIP('174.202.255.0/32');

        expect(r.matches(record)).toBeFalsy();
    });

    test('test matches IP and method=POST',  () => {
        r.addIP('174.202.255.0/24');
        r.addValueNC('method', 'post');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches value', () => {
        r.addValue('status', '200');

        expect(r.matches(record)).toBeTruthy();
    });

    test('test matches value ignoring case', () => {
        r.addValueNC('protocol', 'http/1.1');

        expect(r.matches(record)).toBeTruthy();
    });

    test('isCollection on non-op', () => {
        const simple = r.factory('name', () => { return true; });
        expect(simple.isCollection()).toBeFalsy();
    });

    test('isCollection on collection', () => {
        const c = r.factory('name', undefined, r.AND_OP);
        expect(c.isCollection()).toBeTruthy();
    });

    test('addItem on non-op throws', () => {
        const simple = r.factory('name', () => { return true; });
        const func = () => simple.addItem('field', 'value');
        expect(func).toThrow();
    });

    test('factory must set op or func', () => {
        const func = () => r.factory('field', undefined, undefined);
        expect(func).toThrow();
    });

    test('dump returns string', () => {
        const dump = r.dump();
        expect(typeof dump).toBe('string');
    });

    test('unrecognized op is not matched', () => {
        const unrecognized = r.factory('protocol', undefined, 'nand');
        expect(unrecognized.matches(record)).toBeFalsy();
    });
});
