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

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ScanFile, getRootPathname } from "./scanfile.ts";


export class PanelAccess {
    /** Identifier of the panel interface. */
    id : string = 'default';

    /** Does this panel support --accounts option. */
    hasAccounts : boolean = false;

    /** Does this panel support --archives option. */
    hasArchives : boolean = false;

    /** Does this panel support --domains option. */
    hasDomains : boolean = false;

    /** Does this panel support --panel option. */
    hasPanelLog : boolean = false;

    /** Does this panel support --main option. */
    hasMainLog : boolean = false;

    /**
      * Determine if the panel is installed.
      */
    async isActive(): Promise<boolean> {
        return true;
    }

    /**
     *  Find all available log files.
     */
    async findAllLogFiles(): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all log files associated with an account.
     *  @arg account name.
     */
    async findAccountLogFiles(_account: string): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find log files associated with a single domain.
     *  @arg domain name.
     */
    async findDomainLogFiles(_domain: string): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find the main (no vhost) log files.
     */
    async findMainLogFiles(): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find the log files associated with the panel itself.
     */
    async findPanelLogFiles(): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived log files between the start and stop Date's.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    async findAllArchiveFiles(_start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived log files for an account.
     *  @arg account name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    async findAccountArchiveFiles(_account: string, _start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived log files for a domain.
     *  @arg domain name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    async findDomainArchiveFiles(_domain: string, _start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived main log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    async findMainArchiveFiles(_start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived panel log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    async findPanelArchiveFiles(_start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find a single log file.
     *  @arg filename - name of the log file.
     */
    async findLogFile(filename: string): Promise<Array<ScanFile>> {
        const pathname = getRootPathname(filename);
        if (pathname === '/dev/fd/0') {  // special case /dev/fd/0
            return [ new ScanFile(filename, pathname, 'file') ];
        }
        try {
            const stats = await fs.stat(pathname);
            if (stats.isFile()) {
                return [ new ScanFile(filename, pathname, 'file') ];
            }
        } catch {
            // ignore
        }
        try {
            const stats = await fs.stat(filename);
            if (stats.isFile()) {
                return [ new ScanFile(filename, filename, 'file') ];
            }
        } catch {
            // ignore
        }
        return [];
    }

    /**
     *  Find all log files in a directory.
     *  @arg dir directory name.
     */
    async findLogFilesInDirectory(dir: string): Promise<Array<ScanFile>> {
        const dirpath = getRootPathname(dir);

        try {
            const files = await fs.readdir(dirpath);
            const result: Array<ScanFile> = [];
            for (const name of files) {
                try {
                    const pathname = path.join(dirpath, name);
                    const filename = path.join(dir, name);
                    const stats = await fs.stat(pathname);
                    if (stats.isFile()) {
                        result.push(new ScanFile(filename, pathname, 'directory'));
                    }
                } catch {
                    // ignore
                }
            }
            return result;
        } catch {
            return [];
        }
    }
}
