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

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { getRootPathname, setRootDirectory, ScanFile } from "../lib/scanfile.ts";
import { PanelAccess } from "../lib/panel-access.ts";
import { getDataDirectory } from "../test/testData.ts";

interface ExpectedRow {
    filename: string;
    domain: string;
    found?: boolean;
}

let c: PanelAccess;

describe('defaultPanel', () => {
    beforeEach(() => {
        setRootDirectory(getDataDirectory());

        c = new PanelAccess();
    });


    test('interface id', () => {
        assert.equal(c.id, 'default');
    });

    test('hasAccounts is false', () => {
        assert.ok(!c.hasAccounts);
    });

    test('hasArchives is false', () => {
        assert.ok(!c.hasArchives);
    });

    test('hasDomains is false', () => {
        assert.ok(!c.hasDomains);
    });

    test('hasPanelLog is false', () => {
        assert.ok(!c.hasPanelLog);
    });

    test('hasMainLog is false', () => {
        assert.ok(!c.hasMainLog);
    });

    test('isActive is true', async () => {
        const active = await c.isActive();
        assert.ok(active);
    });

    function checkPromise(actual: Array<ScanFile>, expected: Array<ExpectedRow>): void {
        assert.ok(Array.isArray(actual));
        for (let n=0; n < expected.length; n++) {
            expected[n]!.found = false;
        }
        for (const row of actual) {
            assert.ok(row instanceof ScanFile);
            for (let n=0; n < expected.length; n++) {
                if (expected[n]!.filename === row.filename) {
                    expected[n]!.found = true;
                    assert.equal(row.domain, expected[n]!.domain);
                }
            }
        }
        for (let n=0; n < expected.length; n++) {
            if (!expected[n]!.found) {
                console.log(`checkPromise: missing filename ${expected[n]!.filename}, domain ${expected[n]!.domain}`);
            }
            assert.ok(expected[n]!.found);
        }
    }

    test('findDomainLogFiles("druiddesigns.com")', async () => {
        const actual = await c.findDomainLogFiles('druiddesigns.com');
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findMainLogFiles()', async () => {
        const actual = await c.findMainLogFiles();
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findAccountLogFiles("samplx")', async () => {
        const actual = await c.findAccountLogFiles('samplx');
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findAllLogFiles()', async () => {
        const actual = await c.findAllLogFiles();
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findPanelArchiveFiles()', async () => {
        const start = new Date(2001, 0, 1);
        const stop = new Date();
        const actual = await c.findPanelArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findMainArchiveFiles(start, stop)', async () => {
        const start = new Date(2001, 0, 1);
        const stop = new Date();
        const actual = await c.findMainArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findDomainArchiveFiles("druiddesigns.com", start, stop)', async () => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        const actual = await c.findDomainArchiveFiles('druiddesigns.com', start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findAccountArchiveFiles("druid", "2013/09/12", "2013/09/21")', async () => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        const actual = await c.findAccountArchiveFiles('druid', start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findAllArchiveFiles("2013/09/12", "2013/09/21")', async () => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        const actual = await c.findAllArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findLogFile("/logs/samplx.org")', async () => {
        const actual = await c.findLogFile('/logs/samplx.org');
        const expected: Array<ExpectedRow> = [
            { filename: '/logs/samplx.org', domain: 'file' }
        ];
        checkPromise(actual, expected);
    });

    test('findLogFile(ROOT+"/logs/samplx.org")', async () => {
        const pathname = getRootPathname('/logs/samplx.org');
        const actual = await c.findLogFile(pathname);
        const expected: Array<ExpectedRow> = [
            { filename: pathname, domain: 'file' }
        ];
        checkPromise(actual, expected);
    });

    test('findLogFile("-")', async () => {
        const actual = await c.findLogFile('-');
        const expected: Array<ExpectedRow> = [
            { filename: '-', domain: 'file' }
        ];
        checkPromise(actual, expected);
    });

    test('findLogFile("nonesuch")', async () => {
        const actual = await c.findLogFile('nonesuch');
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findLogFilesInDirectory("/logs")', async () => {
        const actual = await c.findLogFilesInDirectory('/logs');
        const expected: Array<ExpectedRow> = [
            { filename: '/logs/alscan.info', domain : 'directory' },
            { filename: '/logs/alscan-org.druiddesigns.com', domain : 'directory' },
            { filename: '/logs/cpanel-access_log', domain : 'directory' },
            { filename: '/logs/ddinfo.druiddesigns.com', domain : 'directory' },
            { filename: '/logs/ddnet.druiddesigns.com', domain : 'directory' },
            { filename: '/logs/ddorg.druiddesigns.com', domain : 'directory' },
            { filename: '/logs/druiddesigns.com', domain : 'directory' },
            { filename: '/logs/druiddesigns.com-ssl_log', domain : 'directory' },
            { filename: '/logs/ftp.druiddesigns.com-ftp_log', domain : 'directory' },
            { filename: '/logs/isinfo.druiddesigns.com', domain : 'directory' },
            { filename: '/logs/isorg.druiddesigns.com', domain : 'directory' },
            { filename: '/logs/main-access_log', domain : 'directory' },
            { filename: '/logs/pub.samplx.org', domain : 'directory' },
            { filename: '/logs/redmine.druiddesigns.com', domain : 'directory' },
            { filename: '/logs/samplx.org', domain : 'directory' },
            { filename: '/logs/z80cim.druiddesigns.com', domain : 'directory' },
        ];
        checkPromise(actual, expected);
    });

    test('findLogFilesInDirectory("/nonesuch")', async () => {
        const actual = await c.findLogFilesInDirectory('/nonesuch');
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('fundPanelLogFiles', async () => {
        const actual = await c.findPanelLogFiles();
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });
});
