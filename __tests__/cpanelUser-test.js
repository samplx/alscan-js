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

const testData = require('../test/testData.js');

const scanfile = require('../lib/scanfile.js');
const ScanFile = scanfile.ScanFile;

const cpanelUser = require('../lib/panels/60-cpanelUser.js');

var c = null;

describe('cPanelUser', () => {
    beforeEach(() => {
        const pathname = path.join(testData.getDataDirectory(), 'cpanel');
        scanfile.setRootDirectory(pathname);
        process.env.ALSCAN_TESTING_HOME = '/home1/druid';
        c = cpanelUser;
    });

    test('interface id', () => {
        expect(c.id).toEqual('cPanelUser');
    });

    test('hasAccounts is falsy', () => {
        expect(c.hasAccounts).toBeFalsy();
    });

    test('hasArchives is truthy', () => {
        expect(c.hasArchives).toBeTruthy();
    });

    test('hasDomains is truthy', () => {
        expect(c.hasDomains).toBeTruthy();
    });

    test('hasPanelLog is falsy', () => {
        expect(c.hasPanelLog).toBeFalsy();
    });

    test('hasMainLog is falsy', () => {
        expect(c.hasMainLog).toBeFalsy();
    });

    test('isActive is truthy', () => {
        expect(c.isActive()).toBeTruthy();
    });

    test('isActive is falsy when missing /usr/local/cpanel/version file', () => {
        scanfile.setRootDirectory(testData.getDataDirectory());
        expect(c.isActive()).toBeFalsy();
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

    test('findDomainLogFiles, primary domain, with SSL', (done) => {
        const promise = c.findDomainLogFiles('druiddesigns.com');
        const expected = [
            { file: '/home1/druid/access-logs/druiddesigns.com', domain: 'druiddesigns.com' },
            { file: '/home1/druid/access-logs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findDomainLogFiles, addon domain', (done) => {
        const promise = c.findDomainLogFiles('alscan-org.druiddesigns.com');
        const expected = [
            { file: '/home1/druid/access-logs/alscan-org.druiddesigns.com', domain: 'alscan-org.druiddesigns.com' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findDomainLogFiles, subdomain', (done) => {
        const promise = c.findDomainLogFiles('redmine.druiddesigns.com');
        const expected = [
            { file: '/home1/druid/access-logs/redmine.druiddesigns.com', domain: 'redmine.druiddesigns.com' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findDomainLogFiles, nonexistant domain', (done) => {
        const promise = c.findDomainLogFiles('nonesuch.info');
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findPanelLogFiles', (done) => {
        const promise = c.findPanelLogFiles();
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findMainLogFiles', (done) => {
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
            { file : '/home1/druid/access-logs/alscan-org.druiddesigns.com', domain: 'alscan-org.druiddesigns.com' },
            { file : '/home1/druid/access-logs/druiddesigns.com', domain: 'druiddesigns.com' },
            { file : '/home1/druid/access-logs/druiddesigns.com-ssl_log', domain: 'druiddesigns.com' },
            { file : '/home1/druid/access-logs/ddinfo.druiddesigns.com', domain: 'ddinfo.druiddesigns.com' },
            { file : '/home1/druid/access-logs/ddnet.druiddesigns.com', domain: 'ddnet.druiddesigns.com' },
            { file : '/home1/druid/access-logs/ddorg.druiddesigns.com', domain: 'ddorg.druiddesigns.com' },
            { file : '/home1/druid/access-logs/isinfo.druiddesigns.com', domain: 'isinfo.druiddesigns.com' },
            { file : '/home1/druid/access-logs/isorg.druiddesigns.com', domain: 'isorg.druiddesigns.com' },
            { file : '/home1/druid/access-logs/z80cim.druiddesigns.com', domain: 'z80cim.druiddesigns.com' },
            { file : '/home1/druid/access-logs/redmine.druiddesigns.com', domain: 'redmine.druiddesigns.com' },
        ];
        checkPromise(promise, expected, done);
    });

    test('findPanelArchiveFiles()', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const promise = c.findPanelArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findMainArchiveFiles()', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const promise = c.findMainArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });
    test('findPanelArchiveFiles()', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const promise = c.findPanelArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findMainArchiveFiles()', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const promise = c.findMainArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });
    test('findPanelArchiveFiles()', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const promise = c.findPanelArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findMainArchiveFiles()', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const promise = c.findMainArchiveFiles(start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findDomainArchiveFiles("druiddesigns.com", "2013/08/12", "2013/09/21")', (done) => {
        var start = new Date(2013, 8, 12, 0, 0, 0, 0);
        var stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        var promise = c.findDomainArchiveFiles('druiddesigns.com', start, stop);

        const expected = [
            { file : '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
            { file : '/home1/druid/logs/druiddesigns.com-Oct-2013.gz', domain: 'druiddesigns.com' },
            { file : '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
            { file : '/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz', domain: 'druiddesigns.com' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findDomainArchiveFiles("nonesuch.info")', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date();
        const promise = c.findDomainArchiveFiles('nonesuch.info', start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findDomainArchiveFiles("druiddesigns.com", "2001/01/01", "2001/12/31")', (done) => {
        const start = new Date(2001, 0, 1);
        const stop  = new Date(2001, 11, 31);
        const promise = c.findDomainArchiveFiles('druiddesigns.com', start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findAccountArchiveFiles("druid", "2013/09/12", "2013/09/21")', (done) => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 8, 21, 23, 59, 59, 0);
        const promise = c.findAccountArchiveFiles('druid', start, stop);
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

    test('findAllArchiveFiles("2013/09/12", "2013/09/21")', (done) => {
        const start = new Date(2013, 8, 12, 0, 0, 0, 0);
        const stop = new Date(2013, 8, 21, 23, 59, 59, 0);
        const promise = c.findAllArchiveFiles(start, stop);
        const expected = [
            { file : '/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz', domain: 'alscan-org.druiddesigns.com' },
            { file : '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'druiddesigns.com' },
            { file : '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'druiddesigns.com' },
            { file : '/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz', domain: 'ddinfo.druiddesigns.com' },
            { file : '/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz', domain: 'ddnet.druiddesigns.com' },
            { file : '/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz', domain: 'ddorg.druiddesigns.com' },
            { file : '/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz', domain: 'isinfo.druiddesigns.com' },
            { file : '/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz', domain: 'isorg.druiddesigns.com' },
            { file : '/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz', domain: 'z80cim.druiddesigns.com' },
            { file : '/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz', domain: 'redmine.druiddesigns.com' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFile("/usr/local/apache/domlogs/samplx.org")', (done) => {
        const promise = c.findLogFile('/usr/local/apache/domlogs/samplx.org');
        const expected = [
            { file : '/usr/local/apache/domlogs/samplx.org', domain: 'file' }
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFile(ROOT+"/usr/local/apache/domlogs/samplx.org")', (done) => {
        const pathname = scanfile.getRootPathname('/usr/local/apache/domlogs/samplx.org');
        const promise = c.findLogFile(pathname);
        const expected = [ 
            { file : pathname, domain: 'file' }
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

    test('findLogFilesInDirectory("/usr/local/apache/domlogs")', (done) => {
        const promise = c.findLogFilesInDirectory('/usr/local/apache/domlogs');
        const expected = [
            { file : '/usr/local/apache/domlogs/samplx.org', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/pub.samplx.org', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/alscan-org.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/druiddesigns.com-ssl_log', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/ddinfo.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/ddnet.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/ddorg.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/isinfo.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/isorg.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/z80cim.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/redmine.druiddesigns.com', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/alscan.info', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/dst.alscan.info', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/addon.alscan.info', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/bandwidth.alscan.info', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/days.alscan.info', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/minutes.alscan.info', domain: 'directory' },
            { file : '/usr/local/apache/domlogs/seconds.alscan.info', domain: 'directory' },
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFilesInDirectory("/home1/druid/logs")', (done) => {
        const promise = c.findLogFilesInDirectory('/home1/druid/logs');
        const expected = [
            { file: '/home1/druid/logs/alscan-org.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddinfo.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddinfo.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddinfo.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddinfo.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-May-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddorg.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddorg.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddorg.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddorg.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-May-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Apr-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Aug-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Feb-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Jan-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Jul-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Jun-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Mar-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-May-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-May-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Apr-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Aug-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Feb-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Jan-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Jul-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Jun-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Mar-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-May-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/redmine.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/z80cim.druiddesigns.com-Oct-2013.gz', domain: 'directory' },
            { file: '/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz', domain: 'directory' }        
        ];
        checkPromise(promise, expected, done);
    });

    test('findLogFilesInDirectory("nonesuch")', (done) => {
        const promise = c.findLogFilesInDirectory('nonesuch');
        const expected = [
        ];
        checkPromise(promise, expected, done);
    });

});