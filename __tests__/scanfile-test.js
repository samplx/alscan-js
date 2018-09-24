/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013 James Burlingame
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

const testData = require('../test/testData.js');

const scanfile = require('../lib/scanfile.js');
const ScanFile = scanfile.ScanFile;

var s = null;

describe('scanfile', () => {
    beforeEach(() => {
        s = scanfile;
    });

    describe('getRootPathname', () => {
        describe('default root directory', () => {
            beforeEach(() => s.setRootDirectory(''));
            test('-', () => expect(s.getRootPathname('-')).toEqual('/dev/fd/0'));
            test('/dev/null', () => expect(s.getRootPathname('/dev/null')).toEqual('/dev/null'));
            test('/etc/passwd', () => expect(s.getRootPathname('/etc/passwd')).toEqual('/etc/passwd'));
            test('filename', () => expect(s.getRootPathname('filename')).toEqual('filename'));
        });
        describe('test root directory', () => {
            beforeEach(() => s.setRootDirectory(testData.getDataDirectory()));
            test('-', () => expect(s.getRootPathname('-')).toEqual('/dev/fd/0'));
            test('filename', () => expect(s.getRootPathname('filename')).toEqual('filename'));
            test('/logs/samplx.org', () => {
                const pathname = s.getRootPathname('/logs/samplx.org');
                const expected = path.join(testData.getDataDirectory(), 'logs', 'samplx.org');
                expect(pathname).toEqual(expected);
            });
        });
    });

    describe('ScanFile class', () => {
        test('ScanFile(undefined, pathname, domain)', () => {
            s.setRootDirectory('');

            const file = new ScanFile(undefined, '/usr/local/apache/domlogs/samplx.org', 'samplx.org');

            expect(file.filename).toEqual('/usr/local/apache/domlogs/samplx.org');
            expect(file.pathname).toEqual('/usr/local/apache/domlogs/samplx.org');
            expect(file.domain).toEqual('samplx.org');
        });

        test('call constructor function directly with ScanFile(undefined, pathname, domain)', () => {
            s.setRootDirectory('');

            const file = ScanFile(undefined, '/usr/local/apache/domlogs/samplx.org', 'samplx.org');

            expect(file.filename).toEqual('/usr/local/apache/domlogs/samplx.org');
            expect(file.pathname).toEqual('/usr/local/apache/domlogs/samplx.org');
            expect(file.domain).toEqual('samplx.org');
        });

        test('ScanFile(filename, undefined, domain)', () => {
            s.setRootDirectory(testData.getDataDirectory());

            const file = new ScanFile('/usr/local/apache/domlogs/samplx.org', undefined, 'samplx.org');

            expect(file.filename).toEqual('/usr/local/apache/domlogs/samplx.org');
            const pathname = path.join(testData.getDataDirectory(), 'usr', 'local', 'apache', 'domlogs', 'samplx.org');
            expect(file.pathname).toEqual(pathname);
            expect(file.domain).toEqual('samplx.org');
        });

        test('ScanFile(undefined, undefined, domain)', () => {
            s.setRootDirectory(testData.getDataDirectory());

            const attempt = () => {
                return new ScanFile(undefined, undefined, 'samplx.org');
            };
            expect(attempt).toThrow();
        });

        test('ScanFile("-", undefined, "file")', () => {
            s.setRootDirectory('');

            const file = new ScanFile('-', undefined, 'file');

            expect(file.filename).toEqual('-');
            expect(file.pathname).toEqual('/dev/fd/0');
            expect(file.domain).toEqual('file');
        });

        test('ScanFile(undefined, "/dev/fd/0", "file")', () => {
            s.setRootDirectory('');

            const file = new ScanFile(undefined, '/dev/fd/0', 'file');

            expect(file.filename).toEqual('-');
            expect(file.pathname).toEqual('/dev/fd/0');
            expect(file.domain).toEqual('file');
        });

        describe('isCompressed', () => {
            test('isCompressed("/dev/fd/0")', () => {
                s.setRootDirectory('');

                const file = new ScanFile(undefined, '/dev/fd/0', 'file');
                expect(file.isCompressed()).toBeFalsy();
            });

            test('isCompressed("samplx.org-Apr-2012.gz")', () => {
                s.setRootDirectory('');

                const file = new ScanFile(undefined, 'samplx.org-Apr-2012.gz', 'file');
                expect(file.isCompressed()).toBeTruthy();
            });
        });
    });
});

