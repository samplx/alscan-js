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

const path = require('path');
const when = require('when');

const testData = require('../test/testData.js');

const scanfile = require('../lib/scanfile.js');
const ScanFile = scanfile.ScanFile;

const panels = require('../lib/panels.js');

var p = null;

describe('panels', () => {
    describe('empty', () => {
        beforeEach(() => {
            scanfile.setRootDirectory(testData.getDataDirectory());
            panels.clear();
            p = panels;
        });

        test('hasArchives() result is falsy', () => {
            expect(p.hasArchives()).toBeFalsy();
        });

        test('hasAccounts() result is falsy', () => {
            expect(p.hasAccounts()).toBeFalsy();
        });

        test('hasDomains() result is falsy', () => {
            expect(p.hasDomains()).toBeFalsy();
        });

        test('hasPanelLog() result is falsy', () => {
            expect(p.hasPanelLog()).toBeFalsy();
        });

        test('hasMainLog() result is falsy', () => {
            expect(p.hasMainLog()).toBeFalsy();
        });

        test('findScanFiles({domlogs:true})', done => {
            const options = {
                domlogs: true
            };
            const promise = p.findScanFiles(options);
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then((results) => {
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(0);
                done();
            });
        });

        test('findScanFiles({files:["/logs/samplx.org"]})', done => {
            const options = {
                files: [ '/logs/samplx.org' ]
            };
            const promise = p.findScanFiles(options);
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then((results) => {
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(0);
                done();
            });
        });

        test('findScanFiles({directories:["/logs"]})', done => {
            const options = {
                directories: [ '/logs' ]
            };
            const promise = p.findScanFiles(options);
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then((results) => {
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(0);
                done();
            });
        });
    });

    describe('cPanel', () => {
        const checkScanFiles = (options, expected, done) => {
            const promise = p.findScanFiles(options);
            expect(when.isPromiseLike(promise)).toBeTruthy();
            promise.then(function (results) {
                expect(Array.isArray(results)).toBeTruthy();
                results.forEach(function (file) {
                    expect(file).toBeInstanceOf(ScanFile);
                    var index = -1;
                    for (var n=0; n < expected.length; n++) {
                        if (expected[n].file == file.filename) {
                            index = n;
                            expected[n].found = true;
                            break;
                        }
                    }
                    expect(index).toBeGreaterThan(-1);
                    expect(file.domain).toEqual(expected[index].domain);
                });
                for (var n=0; n < expected.length; n++) {
                    expect(expected[n].found).toBeTruthy();
                }
                done();
            });
        };

        beforeEach(() => {
            scanfile.setRootDirectory(path.join(testData.getDataDirectory(), 'cpanel'));
            panels.clear();
            panels.load();
            p = panels;
        });

        test('hasArchives() result is truthy', () => {
            expect(p.hasArchives()).toBeTruthy();
        });

        test('hasAccounts() result is truthy', () => {
            expect(p.hasAccounts()).toBeTruthy();
        });

        test('hasDomains() result is truthy', () => {
            expect(p.hasDomains()).toBeTruthy();
        });

        test('hasPanelLog() result is truthy', () => {
            expect(p.hasPanelLog()).toBeTruthy();
        });

        test('hasMainLog() result is truthy', () => {
            expect(p.hasMainLog()).toBeTruthy();
        });

        test('findScanFiles({domlogs:true})', done => {
            const options = {
                domlogs: true
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
                { file : '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'alscan.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'druiddesigns.info' },
                { file : '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'druiddesigns.net' },
                { file : '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'druiddesigns.org' },
                { file : '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'issnap.info' },
                { file : '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'issnap.org' },
                { file : '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'z80cim.org' },
                { file : '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'redmine.samplx.org' },
                { file : '/usr/local/apache/domlogs/alscan.info', domain: 'alscan.info' },
                { file : '/usr/local/apache/domlogs/dst.alscan.info', domain: 'dst.alscan.info' },
                { file : '/usr/local/apache/domlogs/addon.alscan.info', domain: 'addon.us' },
                { file : '/usr/local/apache/domlogs/bandwidth.alscan.info', domain: 'bandwidth.net' },
                { file : '/usr/local/apache/domlogs/days.alscan.info', domain: 'days.info' },
                { file : '/usr/local/apache/domlogs/minutes.alscan.info', domain: 'minutes.info' },
                { file : '/usr/local/apache/domlogs/seconds.alscan.info', domain: 'seconds.info' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({accounts})', done => {
            const options = {
                accounts : ['samplx', 'druid']
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
                { file : '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'alscan.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'druiddesigns.info' },
                { file : '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'druiddesigns.net' },
                { file : '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'druiddesigns.org' },
                { file : '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'issnap.info' },
                { file : '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'issnap.org' },
                { file : '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'z80cim.org' },
                { file : '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'redmine.samplx.org' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({domains})', done => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com']
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({domains+main})', done => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                main : true
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/logs/access_log', domain: 'main' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({domains+main+archive})', done => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                main : true,
                archive: true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/logs/access_log', domain: 'main' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({domains+panel})', done => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                panel : true
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { file : '/usr/local/cpanel/logs/access_log', domain: 'panel' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({domains+archives})', done => {
            const options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                archives : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { file : '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
                { file : '/home1/druid/logs/druiddesigns.com-Oct-2013.gz', domain: 'druiddesigns.com' },
                { file : '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
                { file : '/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz', domain: 'druiddesigns.com' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({account+archives})', done => {
            const options = {
                accounts : ['samplx'],
                archives : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({domlogs+archives})', done => {
            const options = {
                domlogs : true,
                archives : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 8, 21, 23, 59, 59, 0)
            };
            const expected = [
                { file : '/usr/local/apache/domlogs/samplx.org', domain: 'samplx.org' },
                { file : '/usr/local/apache/domlogs/pub.samplx.org', domain: 'pub.samplx.org' },
                { file : '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'alscan.org' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
                { file : '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'druiddesigns.info' },
                { file : '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'druiddesigns.net' },
                { file : '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'druiddesigns.org' },
                { file : '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'issnap.info' },
                { file : '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'issnap.org' },
                { file : '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'z80cim.org' },
                { file : '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'redmine.samplx.org' },
                { file : '/usr/local/apache/domlogs/alscan.info', domain: 'alscan.info' },
                { file : '/usr/local/apache/domlogs/dst.alscan.info', domain: 'dst.alscan.info' },
                { file : '/usr/local/apache/domlogs/addon.alscan.info', domain: 'addon.us' },
                { file : '/usr/local/apache/domlogs/bandwidth.alscan.info', domain: 'bandwidth.net' },
                { file : '/usr/local/apache/domlogs/days.alscan.info', domain: 'days.info' },
                { file : '/usr/local/apache/domlogs/minutes.alscan.info', domain: 'minutes.info' },
                { file : '/usr/local/apache/domlogs/seconds.alscan.info', domain: 'seconds.info' },
                { file : '/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz', domain: 'alscan.org' },
                { file : '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
                { file : '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
                { file : '/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.info' },
                { file : '/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.net' },
                { file : '/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.org' },
                { file : '/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz', domain: 'issnap.info' },
                { file : '/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz', domain: 'issnap.org' },
                { file : '/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz', domain: 'z80cim.org' },
                { file : '/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz', domain: 'redmine.samplx.org' }
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({files: ["/logs/samplx.org"]})', done => {
            const options = {
                files : [ '/logs/samplx.org' ]
            };
            const expected = [
            ];
            checkScanFiles(options, expected, done);
        });

        test('findScanFiles({directories: ["/logs"]})', done => {
            const options = {
                directories : [ '/logs' ]
            };
            const expected = [
            ];
            checkScanFiles(options, expected, done);
        });

    });

});
