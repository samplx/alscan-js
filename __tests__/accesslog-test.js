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

const accesslog = require('../lib/accesslog');

var a = null;

const expectedKeys = [
    'line',
    'host',
    'ident',
    'user',
    'timestamp',
    'time',
    'request',
    'method',
    'uri',
    'protocol',
    'status',
    'size',
    'referer',
    'agent',
    'group',
    'source'
];

describe('AccessLogEntry', () => {
    beforeEach(() => {
        a = new accesslog.AccessLogEntry();
    });

    describe('constructor creates keys', () => {
        //console.info(keys);
        test('all found keys are in the expected set', () => {
            const keys = Object.keys(a);
            for (const key of keys) {
                expect(expectedKeys.includes(key)).toBeTruthy();
            }
        });
        test('all expected keys are in found set', () => {
            const keys = Object.keys(a);
            for (const eKey of expectedKeys) {
                expect(keys.includes(eKey)).toBeTruthy();
            }
        });
    });

    describe('calling contructor function directly returns a new object', () => {
        const obj = accesslog.AccessLogEntry();
        const keys = Object.keys(obj);
        for (const eKey of expectedKeys) {
            expect(keys.includes(eKey)).toBeTruthy();
        }
    });

    describe('parse', () => {
        const checkParse = (a, expectedResult) => {
            a.parse(expectedResult['line']);
            const keys = Object.keys(a);
            for (const key of keys) {
                if (key in expectedResult) {
                    expect(a).toHaveProperty(key, expectedResult[key]);
                } else {
                    expect(a).toHaveProperty(key, undefined);
                }
            }
        };

        test('combined, size="-"', () => {
            const expectedResult = {
                line: '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 304 - "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"',
                host: '180.76.6.26',
                ident: '-',
                user: '-',
                timestamp: '30/Nov/2012:06:17:35 -0600',
                time: 1354277855000,
                request: 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1',
                method: 'GET',
                uri: '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0',
                protocol: 'HTTP/1.1',
                status: '304',
                size: 0,
                referer: '-',
                agent: 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)'
            };

            checkParse(a, expectedResult);
        });

        test('clears previous contents', () => {
            const line = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 304 - "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"';
            a.parse(line);

            a.parse('');
            for (const key of expectedKeys) {
                if (key === 'line') {
                    expect(a).toHaveProperty('line');
                } else {
                    expect(a[key]).toBeUndefined();
                }
            }
        });

        test('combined, size defined', () => {
            const expectedResult = {
                line: '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"',
                host: '180.76.6.26',
                ident: '-',
                user: '-',
                timestamp: '30/Nov/2012:06:17:35 -0600',
                time: 1354277855000,
                request: 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1',
                method: 'GET',
                uri: '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0',
                protocol: 'HTTP/1.1',
                status: '200',
                size: 4000,
                referer: '-',
                agent: 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)'
            };

            checkParse(a, expectedResult);
        });

        test('combined, referer blank', () => {
            const expectedResult = {
                line: '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000 "" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"',
                host: '180.76.6.26',
                ident: '-',
                user: '-',
                timestamp: '30/Nov/2012:06:17:35 -0600',
                time: 1354277855000,
                request: 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1',
                method: 'GET',
                uri: '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0',
                protocol: 'HTTP/1.1',
                status: '200',
                size: 4000,
                referer: '-',
                agent: 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)'
            };

            checkParse(a, expectedResult);
        });

        test('combined, agent blank', () => {
            const expectedResult = {
                line: '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000 "-" ""',
                host: '180.76.6.26',
                ident: '-',
                user: '-',
                timestamp: '30/Nov/2012:06:17:35 -0600',
                time: 1354277855000,
                request: 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1',
                method: 'GET',
                uri: '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0',
                protocol: 'HTTP/1.1',
                status: '200',
                size: 4000,
                referer: '-',
                agent: '-'
            };

            checkParse(a, expectedResult);
        });

        test('common, size="-"', () => {
            const expectedResult = {
                line: '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 304 -',
                host: '180.76.6.26',
                ident: '-',
                user: '-',
                timestamp: '30/Nov/2012:06:17:35 -0600',
                time: 1354277855000,
                request: 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1',
                method: 'GET',
                uri: '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0',
                protocol: 'HTTP/1.1',
                status: '304',
                size: 0,
                referer: '-',
                agent: '-'
            };

            checkParse(a, expectedResult);
        });

        test('common, size defined', () => {
            const expectedResult = {
                line: '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000',
                host: '180.76.6.26',
                ident: '-',
                user: '-',
                timestamp: '30/Nov/2012:06:17:35 -0600',
                time: 1354277855000,
                request: 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1',
                method: 'GET',
                uri: '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0',
                protocol: 'HTTP/1.1',
                status: '200',
                size: 4000,
                referer: '-',
                agent: '-'
            };

            checkParse(a, expectedResult);
        });

        test('combined, cPanel timestamp, size defined', () => {
            const expectedResult = {
                line: '174.202.255.23 - - [09/06/2012:11:53:32 -0000] "POST /login/?login_only=1 HTTP/1.1" 301 0 "https://174.122.54.92:2087/" "Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2"',
                host: '174.202.255.23',
                ident: '-',
                user: '-',
                timestamp: '09/06/2012:11:53:32 -0000',
                time: 1346932412000,
                request: 'POST /login/?login_only=1 HTTP/1.1',
                method: 'POST',
                uri: '/login/?login_only=1',
                protocol: 'HTTP/1.1',
                status: '301',
                size: 0,
                referer: 'https://174.122.54.92:2087/',
                agent: 'Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2'
            };

            checkParse(a, expectedResult);
        });

        test('combined, cPanel timestamp, positive timezone', () => {
            const expectedResult = {
                line: '174.202.255.23 - - [09/06/2012:11:53:32 +0000] "POST /login/?login_only=1 HTTP/1.1" 301 0 "https://174.122.54.92:2087/" "Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2"',
                host: '174.202.255.23',
                ident: '-',
                user: '-',
                timestamp: '09/06/2012:11:53:32 +0000',
                time: 1346932412000,
                request: 'POST /login/?login_only=1 HTTP/1.1',
                method: 'POST',
                uri: '/login/?login_only=1',
                protocol: 'HTTP/1.1',
                status: '301',
                size: 0,
                referer: 'https://174.122.54.92:2087/',
                agent: 'Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2'
            };

            checkParse(a, expectedResult);
        });

        test('common, invalid request', () => {
            const expectedResult = {
                line: '23.20.104.105 - - [10/Sep/2012:20:17:28 -0500] "\\x16\\x03\\x01" 404 -',
                host: '23.20.104.105',
                ident: '-',
                user: '-',
                timestamp: '10/Sep/2012:20:17:28 -0500',
                time: 1347326248000,
                request: '\\x16\\x03\\x01',
                status: '404',
                size: 0,
                referer: '-',
                agent: '-'
            };

            checkParse(a, expectedResult);
        });

        test('common, invalid month', () => {
            const expectedResult = {
                line: '23.20.104.105 - - [10/Bad/2012:20:17:28 -0500] "GET /missing HTTP/1.1" 404 -',
                host: '23.20.104.105',
                ident: '-',
                user: '-',
                timestamp: '10/Bad/2012:20:17:28 -0500',
                request: 'GET /missing HTTP/1.1',
                method: 'GET',
                uri: '/missing',
                protocol: 'HTTP/1.1',
                status: '404',
                size: 0,
                referer: '-',
                agent: '-'
            };

            checkParse(a, expectedResult);
        });

        test('common, invalid timestamp', () => {
            const expectedResult = {
                line: '23.20.104.105 - - [20:17:28 -0500] "GET /what HTTP/1.1" 404 -',
                host: '23.20.104.105',
                ident: '-',
                user: '-',
                timestamp: '20:17:28 -0500',
                request: 'GET /what HTTP/1.1',
                method: 'GET',
                uri: '/what',
                protocol: 'HTTP/1.1',
                status: '404',
                size: 0,
                referer: '-',
                agent: '-'
            };

            checkParse(a, expectedResult);
        });

        test('invalid request', () => {
            const expectedResult = {
                line: '23.20.104.105 - -',
            };

            checkParse(a, expectedResult);
        });
    });
});
