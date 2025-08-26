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

import { AccessLogEntry } from "../lib/accesslog.ts";
import { addIP, addPattern, addValue, addValueNC, clearRecognizer, matches, Recognizer } from "../lib/recognizer.ts";

const sample = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000 "-" ""';
const record: AccessLogEntry = new AccessLogEntry();

function setup(): void {
    clearRecognizer();
    record.parse(sample);
}

describe('recognizer', () => {
    test('test empty recognizer',  () => {
        setup();
        assert.ok(matches(record));
    });

    test('test matches method=POST', () => {
        setup();
        addValueNC('method', 'post');
        assert.equal(matches(record), false);
    });

    test('test matches method=GET', () => {
        setup();
        addValueNC('method', 'get');
        assert.ok(matches(record));
    });

    test('test matches method=GET|POST', () => {
        setup();
        addValueNC('method', 'get');
        addValueNC('method', 'post');
        assert.ok(matches(record));
    });

    test('test matches method=GET|PUT|POST', () => {
        setup();
        addValueNC('method', 'get');
        addValueNC('method', 'put');
        addValueNC('method', 'post');
        assert.ok(matches(record));
    });

    test('test match fails method=POST|PUT', () => {
        setup();
        addValueNC('method', 'post');
        addValueNC('method', 'put');
        assert.equal(matches(record), false);
    });

    test('test matches uri pattern /pub.*',  () => {
        setup();
        addPattern('uri', '/pub.*');
        assert.ok(matches(record));
    });

    test('test matches uri pattern regex /pub.*',  () => {
        setup();
        addPattern('uri', new RegExp('/pub.*'));
        assert.ok(matches(record));
    });

    test('test matches IP 180.0.0.0/8', () => {
        setup();
        addIP('180.0.0.0/8');
        assert.ok(matches(record));
    });

    test('test matches IP 180.76.6.26',  () => {
        setup();
        addIP('180.76.6.26');
        assert.ok(matches(record));
    });

    test('test matches IP 180.76.6.26/24',  () => {
        setup();
        addIP('180.76.6.26/24');
        assert.ok(matches(record));
    });

    test('test matches IP 174.202.255.0/32',  () => {
        setup();
        addIP('174.202.255.0/32');
        assert.equal(matches(record), false);
    });

    test('test matches IP and method=GET',  () => {
        setup();
        addIP('180.76.6.0/24');
        addValueNC('method', 'get');
        assert.ok(matches(record));
    });

    test('test matches value', () => {
        setup();
        addValue('status', '200');
        assert.ok(matches(record));
    });

    test('test matches value ignoring case', () => {
        setup();
        addValueNC('protocol', 'http/1.1');
        assert.ok(matches(record));
    });

    test('isCollection on non-op', () => {
        setup();
        const simple = new Recognizer('ident', () => { return true; });
        assert.equal(simple.isCollection(), false);
    });

    test('isCollection on collection', () => {
        setup();
        const c = new Recognizer('ident', undefined, 'and');
        assert.ok(c.isCollection());
    });

    test('addItem on non-op throws', () => {
        setup();
        const simple = new Recognizer('ident', () => { return true; });
        assert.throws(() => {
            simple.addItem('field' as unknown as keyof AccessLogEntry, 'value');
        });
    });

    test('factory must set op or func', () => {
        setup();
        assert.throws(() => {
            new Recognizer('ident', undefined, undefined);
        });
    });

});
