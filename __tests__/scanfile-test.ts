/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2025 James Burlingame
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
import * as path from "node:path";

import { ScanFile, getRootPathname, setRootDirectory } from "../lib/scanfile.ts";
import { getDataDirectory } from "../test/testData.ts";

describe('scanfile', () => {
    describe('getRootPathname', () => {
        describe('default root directory', () => {
            test('-', () => {
                setRootDirectory('');
                assert.equal(getRootPathname('-'), '/dev/fd/0');
            });
            test('/dev/null', () => {
                setRootDirectory('');
                assert.equal(getRootPathname('/dev/null'), '/dev/null');
            });
            test('/etc/passwd', () => {
                setRootDirectory('');
                assert.equal(getRootPathname('/etc/passwd'), '/etc/passwd');
            });
            test('filename', () => {
                setRootDirectory('');
                assert.equal(getRootPathname('filename'), 'filename');
            });
        });
        describe('test root directory', () => {
            test('-', () => {
                setRootDirectory(getDataDirectory());
                assert.equal(getRootPathname('-'), '/dev/fd/0');
            });
            test('filename', () => {
                setRootDirectory(getDataDirectory());
                assert.equal(getRootPathname('filename'), 'filename');
            });
            test('/logs/samplx.org', () => {
                setRootDirectory(getDataDirectory());
                const pathname = getRootPathname('/logs/samplx.org');
                const expected = path.join(getDataDirectory(), 'logs', 'samplx.org');
                assert.equal(pathname, expected);
            });
        });
    });

    describe('ScanFile class', () => {
        test('ScanFile(undefined, pathname, domain)', () => {
            setRootDirectory('');

            const file = new ScanFile(undefined, '/usr/local/apache/domlogs/samplx.org', 'samplx.org');

            assert.equal(file.filename, '/usr/local/apache/domlogs/samplx.org');
            assert.equal(file.pathname, '/usr/local/apache/domlogs/samplx.org');
            assert.equal(file.domain, 'samplx.org');
        });

        test('ScanFile(filename, undefined, domain)', () => {
            setRootDirectory(getDataDirectory());

            const file = new ScanFile('/usr/local/apache/domlogs/samplx.org', undefined, 'samplx.org');

            assert.equal(file.filename, '/usr/local/apache/domlogs/samplx.org');
            const pathname = path.join(getDataDirectory(), 'usr', 'local', 'apache', 'domlogs', 'samplx.org');
            assert.equal(file.pathname, pathname);
            assert.equal(file.domain, 'samplx.org');
        });

        test('ScanFile(undefined, undefined, domain)', () => {
            setRootDirectory(getDataDirectory());

            assert.throws(() => {
                const _file = new ScanFile(undefined, undefined, 'samplx.org');
            });
        });

        test('ScanFile("-", undefined, "file")', () => {
            setRootDirectory('');

            const file = new ScanFile('-', undefined, 'file');

            assert.equal(file.filename, '-');
            assert.equal(file.pathname, '/dev/fd/0');
            assert.equal(file.domain, 'file');
        });

        test('ScanFile(undefined, "/dev/fd/0", "file")', () => {
            setRootDirectory('');

            const file = new ScanFile(undefined, '/dev/fd/0', 'file');

            assert.equal(file.filename, '-');
            assert.equal(file.pathname, '/dev/fd/0');
            assert.equal(file.domain, 'file');
        });

        describe('isCompressed', () => {
            test('isCompressed("/dev/fd/0")', () => {
                setRootDirectory('');

                const file = new ScanFile(undefined, '/dev/fd/0', 'file');
                assert.equal(file.isCompressed(), false);
            });

            test('isCompressed("samplx.org-Apr-2012.gz")', () => {
                setRootDirectory('');

                const file = new ScanFile(undefined, 'samplx.org-Apr-2012.gz', 'file');
                assert.ok(file.isCompressed());
            });
        });
    });
});

