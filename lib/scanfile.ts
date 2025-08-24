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

import * as path from "node:path";
import * as process from "node:process";

/**
 *  Set the root directory prefix (for testing.)
 *  @param dir new root directory.
 */
export function setRootDirectory(dir: string): void {
    process.env['ALSCAN_TESTING_ROOTDIR'] = dir;
}

/**
 *  Return a pathname prefixed with the rootDir (used for testing).
 *  @param filename to resolve.
 */
export function getRootPathname(filename: string): string {
    if (filename == '-') {
        return '/dev/fd/0';
    }
    if ((filename[0] == path.sep) && process.env['ALSCAN_TESTING_ROOTDIR']) {
        return path.normalize(path.join(process.env['ALSCAN_TESTING_ROOTDIR'], filename));
    }
    return path.normalize(filename);
}

/**
 *  @ctor ScanFile constructor.
 *  Either filename or pathname must be defined.
 *  @param filename of file.
 *  @param pathname rootDir based full pathname.
 *  @param domain associated with the file.
 */
export class ScanFile {
    filename: string;
    pathname: string;
    domain?: string | undefined;

    constructor(filename?: string, pathname?: string, domain?: string) {
        if (filename) {
            this.filename = filename;
            if (pathname) {
                this.pathname = pathname;
            } else {
                this.pathname = getRootPathname(filename);
            }
        } else if (pathname) {
            this.pathname = pathname;
            if (process.env['ALSCAN_TESTING_ROOTDIR'] &&
                (pathname.substring(0, process.env['ALSCAN_TESTING_ROOTDIR'].length) == process.env['ALSCAN_TESTING_ROOTDIR'])) {
                this.filename = pathname.slice(process.env['ALSCAN_TESTING_ROOTDIR'].length);
            } else if (pathname == '/dev/fd/0') {
                this.filename = '-';
            } else {
                this.filename = pathname;
            }
        } else {
            throw new Error('Either filename or pathname must be defined.');
        }
        this.domain  = domain;
    }

    /**
     *  @returns true if the file is compressed.
     */
    isCompressed(): boolean {
        return (this.pathname.substring(this.pathname.length - 3) == '.gz');
    }
}
