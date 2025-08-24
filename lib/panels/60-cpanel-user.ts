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

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";
import { PanelAccess } from "../panel-access.ts";
import { ScanFile, getRootPathname } from "../scanfile.ts";

/** Directory used to determine that cPanel in installed. */
const CPANEL_DIRECTORY = '.cpanel';

/**
 *  Determine an account's home directory.
 */
function getHomeDirectory(): string {
    if (process.env.ALSCAN_TESTING_HOME) {
        return getRootPathname(process.env.ALSCAN_TESTING_HOME);
    }
    if (process.env.HOME) {
        return getRootPathname(process.env.HOME);
    }
    return '.';
}

/** Names of files to ignore. */
const IGNORED_FILENAME =
    [
        'ftpxferlog',
        'ftpxferlog.offset',
        'ftpxferlog.offsetftpsep'
    ];

/** Suffixes of ignored files. */
const IGNORED_SUFFIX =
    [
        '-bytes_log',
        '-bytes_log.offset',
        '-ftp_log',
        '-ftp_log.offsetftpbytes',
        '-ftp_log.offset',
        '.bkup',
        '.bkup2'
    ];

/** Patterns for ignored files. */
const IGNORED_PATTERN =
    [
        new RegExp(/-ftp_log-...-\d\d\d\d\.gz$/)
    ];

/** Name of months used in Archive file names. */
const MONTH_NAMES =
    [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];


/**
 *  Get a list of month-year strings used to access archived log files.
 *  @arg start : starting Date.
 *  @arg stop : ending Date.
 */
function getArchiveMonths(start: Date, stop: Date): Array<string> {
    const months: Array<string> = [];
    let month: number;
    let year: number = start.getFullYear();

    if (year == stop.getFullYear()) {   // less than a full year
        month = start.getMonth();
    } else {    // more than one year
        // first partial year
        for (month = start.getMonth(); month < 12; month++) {
            months.push(MONTH_NAMES[month] + '-' + year);
        }
        // full years
        for (year += 1; year < stop.getFullYear(); year++) {
            for (month= 0; month < 12; month++) {
                months.push(MONTH_NAMES[month] + '-' + year);
            }
        }
        year = stop.getFullYear();
        month = 0;
    }
    // last partial year
    for (; month <= stop.getMonth(); month++) {
        months.push(MONTH_NAMES[month] + '-' + year);
    }
    return months;
}

/**
 *  Determine Domain log files.
 *  @arg domain name used for filename.
 */
async function getDomainLogFiles(domain: string): Promise<Array<ScanFile>> {
    const files: Array<ScanFile> = [];

    // check for standard log
    const pathname = path.join(getHomeDirectory(), 'access-logs', domain);
    try {
        const stats = await fs.stat(pathname);
        if (stats.isFile()) {
            files.push(new ScanFile(undefined, pathname, domain));
        }
    } catch (_) {
        // ignore
    }
    // check for secure log
    const sslPathname = pathname + '-ssl_log';
    try {
        const stats = await fs.stat(sslPathname);
        if (stats.isFile()) {
            files.push(new ScanFile(undefined, sslPathname, domain));
        }
    } catch (_) {
        // ignore
    }

    return files;
}

function isIgnoredFilename(filename: string): boolean {
    return (IGNORED_FILENAME.indexOf(filename) >= 0);
}

function isIgnoredSuffix(filename: string): boolean {
    return IGNORED_SUFFIX.some((suffix) => (suffix.length < filename.length) && (suffix == filename.substring(filename.length-suffix.length)));
}

function isIgnoredPattern(filename: string): boolean {
    return IGNORED_PATTERN.some((pattern) => pattern.test(filename));
}

/**
 *  Check if file should not be included in results.
 *  @arg filename to check.
 */
function isIgnoredFile(filename: string): boolean {
    return isIgnoredFilename(filename) || isIgnoredSuffix(filename) || isIgnoredPattern(filename);
}


/**
 *  Interface to use when cPanel is found for root.
 */
export class CPanelUserAccess extends PanelAccess {
    constructor() {
        super();
        this.id = 'cPanelUser';
        this.hasAccounts = false;
        this.hasArchives = true;
        this.hasDomains = true;
        this.hasMainLog = false;
        this.hasPanelLog = false;
    }

    /** Pattern used to recognize an archived log file. */
    static archivePattern: RegExp = new RegExp(/^(.*?)(-ssl_log)?-(...-\d\d\d\d)\.gz/);

    /** Pattern used to extract domain name from filename. */
    static domainPattern: RegExp = new RegExp(/^(.*?)(-ssl_log)?$/);

    /**
      * Determine if the panel is installed.
      * @return Use cPanel version file to check installation.
      */
    override async isActive(): Promise<boolean> {
        const pathname = path.join(getHomeDirectory(), CPANEL_DIRECTORY);
//        console.log(`isActive, pathname=${pathname}`);
        try {
            const stats = await fs.stat(pathname);
            if (stats.isFile()) {
                return true;
            }
        } catch (_) {
            // ignore
        }
        return false;
    }

    /**
     *  Find all available log files for accounts and domains.
     */
    override async findAllLogFiles(): Promise<Array<ScanFile>> {
        const logdir = path.join(getHomeDirectory(), 'access-logs');
        const files: Array<ScanFile> = [];

        try {
            const list = await fs.readdir(logdir);
            for (const name of list) {
                if (!isIgnoredFile(name)) {
                    const check = CPanelUserAccess.domainPattern.exec(name);
                    if (check) {
                        const pathname = path.join(logdir, name);
                        files.push(new ScanFile(undefined, pathname, check[1]));
                    }
                }
            }
        } catch {
            // ignore
        }
        return files;
    }

    /**
     *  Find all log files associated with an account.
     *  @arg account name.
     */
    override async findAccountLogFiles(account: string): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find log files associated with a single domain.
     *  @arg domain name.
     */
    override async findDomainLogFiles(domain: string): Promise<Array<ScanFile>> {
        return getDomainLogFiles(domain);
    }

    /**
     *  Find the main (no vhost) log files.
     */
    override async findMainLogFiles(): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find the log files associated with the panel itself.
     */
    override async findPanelLogFiles(): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived log files between the start and stop Date's.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    override async findAllArchiveFiles(start: Date, stop: Date): Promise<Array<ScanFile>> {
        const logdir = path.join(getHomeDirectory(), 'logs');
        const months = getArchiveMonths(start, stop);
        const files: Array<ScanFile> = [];

        try {
            const list = await fs.readdir(logdir);
            for (const name of list) {
                const check = CPanelUserAccess.archivePattern.exec(name);
                if (check && (months.indexOf(check[3]) >= 0) && !isIgnoredFile(name)) {
                    const pathname = path.join(logdir, name);
                    files.push(new ScanFile(undefined, pathname, check[1]));
                }
            }
        } catch {
            // ignore
        }
        return files;
    }

    /**
     *  Find all archived log files for an account.
     *  @arg account name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    override async findAccountArchiveFiles(_account: string, _start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived log files for a domain.
     *  @arg domain name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    override async findDomainArchiveFiles(domain: string, start: Date, stop: Date): Promise<Array<ScanFile>> {
        const logdir = path.join(getHomeDirectory(), 'logs');
        const months = getArchiveMonths(start, stop);
        const files: Array<ScanFile> = [];

        try {
            const list = await fs.readdir(logdir);
            for (const name of list) {
                for (const month of months) {
                    if ((name == `${domain}-${month}.gz`) ||
                        (name == `${domain}-ssl_log-${month}.gz`)) {
                        const pathname = path.join(logdir, name);
                        files.push(new ScanFile(undefined, pathname, domain));
                    }
                }
            }
        } catch {
            // ignore
        }
        return files;
    }

    /**
     *  Find all archived main log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    override async findMainArchiveFiles(_start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived panel log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     */
    override async findPanelArchiveFiles(_start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

}
