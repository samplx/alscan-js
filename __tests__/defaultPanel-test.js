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

const when = require('when');

const testData = require('../test/testData.js');

const scanfile = require('../lib/scanfile.js');
const ScanFile = scanfile.ScanFile;

const defaultPanel = require('../lib/panels/99-default.js');

var c = null;

describe('defaultPanel', () => {
    beforeEach(() => {
        scanfile.setRootDirectory(testData.getDataDirectory());

        c = defaultPanel;
    });

    test('interface id', () => {
        expect(c.id).toEqual('default');
    });

    test('hasAccounts is falsy', () => {
        expect(c.hasAccounts).toBeFalsy();
    });

    test('hasArchives is falsy', () => {
        expect(c.hasArchives).toBeFalsy();
    });

    test('hasDomains is falsy', () => {
        expect(c.hasDomains).toBeFalsy();
    });

    test('hasPanelLog is falsy', () => {
        expect(c.hasPanelLog).toBeFalsy();
    });

    test('hasMainLog is falsy', () => {
        expect(c.hasMainLog).toBeFalsy();
    });

    test('isActive() is truthy', () => {
        expect(c.isActive()).toBeTruthy();
    });

    const checkPromise = (promise, expected, done) => {
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

    test('findDomainLogFiles("druiddesigns.com")', (done) => {
        const promise = c.findDomainLogFiles('druiddesigns.com');
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findMainLogFiles()', (done) => {
        const promise = c.findMainLogFiles();
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findAccountLogFiles("samplx")', (done) => {
        const promise = c.findAccountLogFiles('samplx');
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findAllLogFiles()', (done) => {
        const promise = c.findAllLogFiles();
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findPanelArchiveFiles()', (done) => {
        const start = new Date(2001, 0, 1);
        const stop = new Date();
        const promise = c.findPanelArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findMainArchiveFiles(start, stop)', (done) => {
        const start = new Date(2001, 0, 1);
        const stop = new Date();
        const promise = c.findMainArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findDomainArchiveFiles("druiddesigns.com", start, stop)', (done) => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        const promise = c.findDomainArchiveFiles('druiddesigns.com', start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findAccountArchiveFiles("druid", "2013/09/12", "2013/09/21")', (done) => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        const promise = c.findAccountArchiveFiles('druid', start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findAllArchiveFiles("2013/09/12", "2013/09/21")', (done) => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        const promise = c.findAllArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFile("/logs/samplx.org")', (done) => {
        const promise = c.findLogFile('/logs/samplx.org');
        const expected = [
            { file : '/logs/samplx.org', domain: 'file' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFile(ROOT+"/logs/samplx.org")', (done) => {
        const pathname = scanfile.getRootPathname('/logs/samplx.org');
        const promise = c.findLogFile(pathname);
        const expected = [
            { file: pathname, domain: 'file' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFile("-")', (done) => {
        const promise = c.findLogFile('-');
        const expected = [
            { file : '-', domain: 'file' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFile("nonesuch")', (done) => {
        const promise = c.findLogFile('nonesuch');
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFilesInDirectory("/logs")', (done) => {
        const promise = c.findLogFilesInDirectory('/logs');
        const expected = [
            { file : '/logs/alscan.info', domain : 'directory' },
            { file : '/logs/alscan-org.druiddesigns.com', domain : 'directory' },
            { file : '/logs/cpanel-access_log', domain : 'directory' },
            { file : '/logs/ddinfo.druiddesigns.com', domain : 'directory' },
            { file : '/logs/ddnet.druiddesigns.com', domain : 'directory' },
            { file : '/logs/ddorg.druiddesigns.com', domain : 'directory' },
            { file : '/logs/druiddesigns.com', domain : 'directory' },
            { file : '/logs/druiddesigns.com-ssl_log', domain : 'directory' },
            { file : '/logs/ftp.druiddesigns.com-ftp_log', domain : 'directory' },
            { file : '/logs/isinfo.druiddesigns.com', domain : 'directory' },
            { file : '/logs/isorg.druiddesigns.com', domain : 'directory' },
            { file : '/logs/main-access_log', domain : 'directory' },
            { file : '/logs/pub.samplx.org', domain : 'directory' },
            { file : '/logs/redmine.druiddesigns.com', domain : 'directory' },
            { file : '/logs/samplx.org', domain : 'directory' },
            { file : '/logs/z80cim.druiddesigns.com', domain : 'directory' },
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFilesInDirectory("/nonesuch")', (done) => {
        const promise = c.findLogFilesInDirectory('/nonesuch');
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('fundPanelLogFiles', (done) => {
        const promise = c.findPanelLogFiles();
        const expected = [];
        checkPromise(promise, expected, done);
    });
});
