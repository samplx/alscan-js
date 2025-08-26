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

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";

import { getRootPathname, setRootDirectory, ScanFile } from "../lib/scanfile.ts";
import { CPanelUserAccess } from "../lib/panels/60-cpanel-user.ts";
import { getDataDirectory } from "../test/testData.ts";

interface ExpectedRow {
    filename: string;
    domain: string;
    found?: boolean;
}

let c: CPanelUserAccess;

describe('cPanelUser', () => {
    beforeEach(() => {
        const pathname = path.join(getDataDirectory(), 'cpanel');
        setRootDirectory(pathname);
        process.env['ALSCAN_TESTING_HOME'] = '/home1/druid';
        c = new CPanelUserAccess();
    });

    test('interface id', () => {
        assert.equal(c.id, 'cPanelUser');
    });

    test('hasAccounts is falsy', () => {
        assert.ok(!c.hasAccounts);
    });

    test('hasArchives is truthy', () => {
        assert.ok(c.hasArchives);
    });

    test('hasDomains is truthy', () => {
        assert.ok(c.hasDomains);
    });

    test('hasPanelLog is falsy', () => {
        assert.ok(!c.hasPanelLog);
    });

    test('hasMainLog is falsy', () => {
        assert.ok(!c.hasMainLog);
    });

    test('isActive is truthy', async () => {
        const active = await c.isActive();
        assert.ok(active);
    });

    test('isActive is falsy when missing /usr/local/cpanel/version file', async () => {
        setRootDirectory(getDataDirectory());
        const active = await c.isActive();
        assert.ok(!active);
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

    test('findDomainLogFiles, primary domain, with SSL', async () => {
        const actual = await c.findDomainLogFiles('druiddesigns.com');
        const expected: Array<ExpectedRow> = [
            { filename: '/home1/druid/access-logs/druiddesigns.com', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/access-logs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' }
        ];
        checkPromise(actual, expected);
    });

    test('findDomainLogFiles, addon domain', async () => {
        const actual = await c.findDomainLogFiles('alscan-org.druiddesigns.com');
        const expected: Array<ExpectedRow> = [
            { filename: '/home1/druid/access-logs/alscan-org.druiddesigns.com', domain: 'alscan-org.druiddesigns.com' }
        ];
        checkPromise(actual, expected);
    });

    test('findDomainLogFiles, subdomain', async () => {
        const actual = await c.findDomainLogFiles('redmine.druiddesigns.com');
        const expected: Array<ExpectedRow> = [
            { filename: '/home1/druid/access-logs/redmine.druiddesigns.com', domain: 'redmine.druiddesigns.com' }
        ];
        checkPromise(actual, expected);
    });

    test('findDomainLogFiles, nonexistant domain', async () => {
        const actual = await c.findDomainLogFiles('nonesuch.info');
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findPanelLogFiles', async () => {
        const actual = await c.findPanelLogFiles();
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findMainLogFiles', async () => {
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
            { filename: '/home1/druid/access-logs/alscan-org.druiddesigns.com', domain: 'alscan-org.druiddesigns.com' },
            { filename: '/home1/druid/access-logs/druiddesigns.com', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/access-logs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/access-logs/ddinfo.druiddesigns.com', domain: 'ddinfo.druiddesigns.com' },
            { filename: '/home1/druid/access-logs/ddnet.druiddesigns.com', domain: 'ddnet.druiddesigns.com' },
            { filename: '/home1/druid/access-logs/ddorg.druiddesigns.com', domain: 'ddorg.druiddesigns.com' },
            { filename: '/home1/druid/access-logs/isinfo.druiddesigns.com', domain: 'isinfo.druiddesigns.com' },
            { filename: '/home1/druid/access-logs/isorg.druiddesigns.com', domain: 'isorg.druiddesigns.com' },
            { filename: '/home1/druid/access-logs/z80cim.druiddesigns.com', domain: 'z80cim.druiddesigns.com' },
            { filename: '/home1/druid/access-logs/redmine.druiddesigns.com', domain: 'redmine.druiddesigns.com' },
        ];
        checkPromise(actual, expected);
    });

    test('findPanelArchiveFiles()', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const actual = await c.findPanelArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findMainArchiveFiles()', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const actual = await c.findMainArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });
    test('findPanelArchiveFiles()', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const actual = await c.findPanelArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findMainArchiveFiles()', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const actual = await c.findMainArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });
    test('findPanelArchiveFiles()', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const actual = await c.findPanelArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findMainArchiveFiles()', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const actual = await c.findMainArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findDomainArchiveFiles("druiddesigns.com", "2013/08/12", "2013/09/21")', async () => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        const actual = await c.findDomainArchiveFiles('druiddesigns.com', start, stop);

        const expected: Array<ExpectedRow> = [
            { filename: '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/logs/druiddesigns.com-Oct-2013.gz', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz', domain: 'druiddesigns.com' }
        ];
        checkPromise(actual, expected);
    });

    test('findDomainArchiveFiles("nonesuch.info")', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const actual = await c.findDomainArchiveFiles('nonesuch.info', start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findDomainArchiveFiles("druiddesigns.com", "2001/01/01", "2001/12/31")', async () => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date(2001, 11, 31);
        const actual = await c.findDomainArchiveFiles('druiddesigns.com', start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findAccountArchiveFiles("druid", "2013/09/12", "2013/09/21")', async () => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 8, 21, 23, 59, 59, 0);
        const actual = await c.findAccountArchiveFiles('druid', start, stop);
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

    test('findAllArchiveFiles("2013/09/12", "2013/09/21")', async () => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 8, 21, 23, 59, 59, 0);
        const actual = await c.findAllArchiveFiles(start, stop);
        const expected: Array<ExpectedRow> = [
            { filename: '/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz', domain: 'alscan-org.druiddesigns.com' },
            { filename: '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
            { filename: '/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz', domain: 'ddinfo.druiddesigns.com' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz', domain: 'ddnet.druiddesigns.com' },
            { filename: '/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz', domain: 'ddorg.druiddesigns.com' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz', domain: 'isinfo.druiddesigns.com' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz', domain: 'isorg.druiddesigns.com' },
            { filename: '/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz', domain: 'z80cim.druiddesigns.com' },
            { filename: '/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz', domain: 'redmine.druiddesigns.com' }
        ];
        checkPromise(actual, expected);
    });

    test('findLogFile("/usr/local/apache/domlogs/samplx.org")', async () => {
        const actual = await c.findLogFile('/usr/local/apache/domlogs/samplx.org');
        const expected: Array<ExpectedRow> = [
            { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'file' }
        ];
        checkPromise(actual, expected);
    });

    test('findLogFile(ROOT+"/usr/local/apache/domlogs/samplx.org")', async () => {
        const pathname = getRootPathname('/usr/local/apache/domlogs/samplx.org');
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

    test('findLogFilesInDirectory("/usr/local/apache/domlogs")', async () => {
        const actual = await c.findLogFilesInDirectory('/usr/local/apache/domlogs');
        const expected: Array<ExpectedRow> = [
            { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/pub.samplx.org', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/alscan.info', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/dst.alscan.info', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/addon.alscan.info', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/bandwidth.alscan.info', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/days.alscan.info', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/minutes.alscan.info', domain: 'directory' },
            { filename: '/usr/local/apache/domlogs/seconds.alscan.info', domain: 'directory' },
        ];
        checkPromise(actual, expected);
    });

    test('findLogFilesInDirectory("/home1/druid/logs")', async () => {
        const actual = await c.findLogFilesInDirectory('/home1/druid/logs');
        const expected: Array<ExpectedRow> = [
            { filename: '/home1/druid/logs/alscan-org.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddinfo.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddinfo.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddinfo.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddinfo.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-May-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddorg.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddorg.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddorg.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddorg.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-May-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Apr-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Aug-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Feb-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Jan-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Jul-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Jun-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Mar-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-May-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-May-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-May-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/redmine.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/z80cim.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { filename: '/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz', domain: 'directory' }
        ];
        checkPromise(actual, expected);
    });

    test('findLogFilesInDirectory("nonesuch")', async () => {
        const actual = await c.findLogFilesInDirectory('nonesuch');
        const expected: Array<ExpectedRow> = [
        ];
        checkPromise(actual, expected);
    });

});
