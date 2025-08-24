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
import * as path from "node:path";

import { setRootDirectory, ScanFile } from "../lib/scanfile.ts";
import { Panels } from "../lib/panels.ts";
import { getDataDirectory } from "../test/testData.ts";
import type { AlscanOptions } from "../lib/options.ts";

interface ExpectedRow {
    filename: string;
    domain: string;
    found?: boolean;
}

describe('panels', () => {
    describe('empty', () => {
        let p: Panels;
        beforeEach(() => {
            setRootDirectory(getDataDirectory());
            p = new Panels();
        });

        test('hasArchives() result is falsy', () => {
            assert.equal(p.hasArchives(), false);
        });

        test('hasAccounts() result is falsy', () => {
            assert.equal(p.hasAccounts(), false);
        });

        test('hasDomains() result is falsy', () => {
            assert.equal(p.hasDomains(), false);
        });

        test('hasPanelLog() result is falsy', () => {
            assert.equal(p.hasPanelLog(), false);
        });

        test('hasMainLog() result is falsy', () => {
            assert.equal(p.hasMainLog(), false);
        });

        test('findScanFiles({domlogs:true})', async () => {
            const options: AlscanOptions = {
                domlogs: true
            };
            const list = await p.findScanFiles(options);
            assert.ok(Array.isArray(list));
            assert.equal(list.length, 0);
        });

        test('findScanFiles({files:["/logs/samplx.org"]})', async () => {
            const options: AlscanOptions = {
                file: [ '/logs/samplx.org' ]
            };
            const list = await p.findScanFiles(options);
            assert.ok(Array.isArray(list));
            assert.equal(list.length, 0);
        });

        test('findScanFiles({directories:["/logs"]})', async () => {
            const options: AlscanOptions = {
                directory: [ '/logs' ]
            };
            const list = await p.findScanFiles(options);
            assert.ok(Array.isArray(list));
            assert.equal(list.length, 0);
        });

    });

    describe('cPanel', async () => {
        let p: Panels;
        async function checkScanFiles(
            options: AlscanOptions,
            expected: Array<ExpectedRow>
        ): Promise<void> {
            if (!expected || !Array.isArray(expected)) {
                return;
            }
            const list = await p.findScanFiles(options);
            // console.log({list});
            for (let n=0; n < expected.length; n++) {
                if (expected[n]) {
                    expected[n]!.found = false;

                }
            }
            for (let n=0; n < list.length; n++) {
                assert.ok(list[n] instanceof ScanFile);
                let found = false;
                for (let i=0; i < expected.length; i++) {
                    if (expected[i]!.filename === list[n]!.filename) {
                        assert.equal(expected[i]!.domain, list[n]!.domain);
                        expected[i]!.found = true;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.error(`not found ${list[n]!.filename}`);
                }
                assert.ok(found);
            }
            for (let n=0; n < expected.length; n++) {
                if (!expected[n]!.found) {
                    console.error(`missing ${expected[n]!.filename}`);
                }
                assert.ok(expected[n]!.found);
            }
        }

        beforeEach(async () => {
            setRootDirectory(path.join(getDataDirectory(), 'cpanel'));
            p = new Panels();
            await p.load();
        });

        test('hasArchives() result is truthy', () => {
            assert.ok(p.hasArchives());
        });

        test('hasAccounts() result is truthy', () => {
            assert.ok(p.hasAccounts());
        });

        test('hasDomains() result is truthy', () => {
            assert.ok(p.hasDomains());
        });

        test('hasPanelLog() result is truthy', () => {
            assert.ok(p.hasPanelLog());
        });

        test('hasMainLog() result is truthy', () => {
            assert.ok(p.hasMainLog());
        });

        test('findScanFiles({domlogs:true})', async () => {
            const options = {
                domlogs: true
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
                { filename: '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'alscan.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'druiddesigns.info' },
                { filename: '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'druiddesigns.net' },
                { filename: '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'druiddesigns.org' },
                { filename: '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'issnap.info' },
                { filename: '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'issnap.org' },
                { filename: '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'z80cim.org' },
                { filename: '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'redmine.samplx.org' },
                { filename: '/usr/local/apache/domlogs/alscan.info', domain: 'alscan.info' },
                { filename: '/usr/local/apache/domlogs/dst.alscan.info', domain: 'dst.alscan.info' },
                { filename: '/usr/local/apache/domlogs/addon.alscan.info', domain: 'addon.us' },
                { filename: '/usr/local/apache/domlogs/bandwidth.alscan.info', domain: 'bandwidth.net' },
                { filename: '/usr/local/apache/domlogs/days.alscan.info', domain: 'days.info' },
                { filename: '/usr/local/apache/domlogs/minutes.alscan.info', domain: 'minutes.info' },
                { filename: '/usr/local/apache/domlogs/seconds.alscan.info', domain: 'seconds.info' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({accounts})', async () => {
            const options = {
                accounts : ['samplx', 'druid']
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
                { filename: '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'alscan.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'druiddesigns.info' },
                { filename: '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'druiddesigns.net' },
                { filename: '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'druiddesigns.org' },
                { filename: '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'issnap.info' },
                { filename: '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'issnap.org' },
                { filename: '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'z80cim.org' },
                { filename: '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'redmine.samplx.org' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({domains})', async () => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com']
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({domains+main})', async () => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                main : true
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/logs/access_log', domain: 'main' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({domains+main+archive})', async () => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                main : true,
                archive: true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/logs/access_log', domain: 'main' },
                { filename: '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-Oct-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz', domain: 'druiddesigns.com' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({domains+panel})', async () => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                panel : true
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { filename: '/usr/local/cpanel/logs/access_log', domain: 'panel' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({domains+archives})', async () => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                archive : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-Oct-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz', domain: 'druiddesigns.com' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({account+archives})', async () => {
            const options = {
                accounts : ['samplx'],
                archive : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({domlogs+archives})', async () => {
            const options = {
                domlogs : true,
                archive : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 8, 21, 23, 59, 59, 0)
            };
            const expected = [
                { filename: '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { filename: '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
                { filename: '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'alscan.org' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { filename: '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'druiddesigns.info' },
                { filename: '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'druiddesigns.net' },
                { filename: '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'druiddesigns.org' },
                { filename: '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'issnap.info' },
                { filename: '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'issnap.org' },
                { filename: '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'z80cim.org' },
                { filename: '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'redmine.samplx.org' },
                { filename: '/usr/local/apache/domlogs/alscan.info', domain: 'alscan.info' },
                { filename: '/usr/local/apache/domlogs/dst.alscan.info', domain: 'dst.alscan.info' },
                { filename: '/usr/local/apache/domlogs/addon.alscan.info', domain: 'addon.us' },
                { filename: '/usr/local/apache/domlogs/bandwidth.alscan.info', domain: 'bandwidth.net' },
                { filename: '/usr/local/apache/domlogs/days.alscan.info', domain: 'days.info' },
                { filename: '/usr/local/apache/domlogs/minutes.alscan.info', domain: 'minutes.info' },
                { filename: '/usr/local/apache/domlogs/seconds.alscan.info', domain: 'seconds.info' },
                { filename: '/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz', domain: 'alscan.org' },
                { filename: '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
                { filename: '/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.info' },
                { filename: '/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.net' },
                { filename: '/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.org' },
                { filename: '/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz', domain: 'issnap.info' },
                { filename: '/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz', domain: 'issnap.org' },
                { filename: '/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz', domain: 'z80cim.org' },
                { filename: '/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz', domain: 'redmine.samplx.org' }
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({file: ["/logs/samplx.org"]})', async () => {
            const options = {
                file : [ '/logs/samplx.org' ]
            };
            const expected: Array<ExpectedRow> = [
            ];
            await checkScanFiles(options, expected);
        });

        test('findScanFiles({directory: ["/logs"]})', async () => {
            const options = {
                directory : [ '/logs' ]
            };
            const expected: Array<ExpectedRow> = [
            ];
            await checkScanFiles(options, expected);
        });
    });

});
