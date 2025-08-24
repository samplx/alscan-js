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
import { PanelAccess } from "../panel-access.ts";
import { ScanFile, getRootPathname } from "../scanfile.ts";
import yaml from "js-yaml";

// Constants

/** Main (non-vhost) access log. */
const CPANEL_MAIN_LOG = '/usr/local/apache/logs/access_log';

/** Panel access log pathname. */
const CPANEL_PANEL_LOG = '/usr/local/cpanel/logs/access_log';

/** Prefix to most access log files. */
const CPANEL_PREFIX = '/usr/local/apache/domlogs';

/** Pathname of the cPanel userdata directory. */
const CPANEL_USERDATA_DIR = '/var/cpanel/userdata';

/** Pathname of user domains configuration file. */
const CPANEL_USERDOMAINS = '/etc/userdomains';

/** Pathname of the cPanel version file. */
const CPANEL_VERSION_FILE = '/usr/local/cpanel/version';

/** Name of months used in Archive file names. */
const MONTH_NAMES =
    [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

/** Pattern used to recognize an archived log file. */
// var archivePattern = new RegExp(/^(.*)(-ssl_log)?-(...-\d\d\d\d)\.gz/);

/**
 * key is account name.
 * value is the contents of the `/var/cpanel/userdata/${account}/main` file.
 */
const mains: Record<string, Record<string, unknown>> = { };

/**
 *  Load the contents of the /var/cpanel/userdata/<account>/main file
 *  @arg account name.
 */
async function loadAccountMain(account: string): Promise<void> {
    if (!mains[account]) {
        const pathname = getRootPathname(path.join(CPANEL_USERDATA_DIR, account, 'main'));
        try {
            const source = await fs.readFile(pathname, {encoding: 'utf8', flag: 'r'});
            const contents = yaml.load(source, { filename: pathname });;
            if (contents) {
                mains[account]= contents as Record<string, unknown>;
            }
        } catch (_) {
            // ignore any errors, same as missing file.
        }
    }
}

/**
 *  Determine an account's home directory.
 *  @arg account name.
 *  @rtype promise for a pathname of the account's home directory.
 */
async function getAccountHomeDirectory(account: string): Promise<string | undefined> {
    await loadAccountMain(account);
    if (mains[account]) {
        const main = mains[account];
        let contents;
        if (main &&
            (typeof main === 'object') &&
            ('main_domain' in main) &&
            (main['main_domain']) &&
            (typeof main['main_domain']) === 'string') {
            const pathname = getRootPathname(path.join(CPANEL_USERDATA_DIR, account, main['main_domain']));
            const domain = await fs.readFile(pathname, {encoding: 'utf8', flag: 'r'});
            contents = null;
            try {
                contents = yaml.load(domain, { filename: pathname });
            } catch (e) {
                // ignore
            }
        }
        if (contents &&
            (typeof contents === 'object') &&
            ('homedir' in contents) &&
            (contents.homedir) &&
            (typeof contents.homedir) === 'string') {
            return getRootPathname(contents.homedir);
        } else {
            return getRootPathname('/home/' + account);
        }
    };

    return undefined;
}

/**
 *  Determine all account names.
 *  @rtype Array of String.
 */
async function getAllAccounts(): Promise<Array<string>> {
    const dir = getRootPathname(CPANEL_USERDATA_DIR);

    const dirs = await fs.readdir(dir);
    const accounts: Array<string> = [];
    for(const name of dirs) {
        if (name != 'nobody') {
            accounts.push(name);
        }
    }

    return accounts;
}

interface DomainAndSubdomain {
    domain: string;
    subdomain: string;
}

/**
 *  Find all log files associated with an account.
 *  @arg account name.
 *  @rtype promise for an Array of ScanFile.
 */
async function getAccountLogFiles(account: string): Promise<Array<ScanFile>> {
    const files: Array<ScanFile> = [];
    const domains: Array<DomainAndSubdomain> = [];

    await loadAccountMain(account);
    if (mains[account]) {
        const contents = mains[account];
        if (contents && (typeof contents === 'object')) {
            if (('main_domain' in contents) &&
                (contents["main_domain"]) &&
                (typeof contents["main_domain"] === 'string')) {
                domains.push({ 'domain': contents["main_domain"], 'subdomain': contents["main_domain"] });
            }
            if (('addon_domains' in contents) &&
                contents["addon_domains"] &&
                (typeof contents["addon_domains"] === 'object')) {
                const addon_domains = contents["addon_domains"] as Record<string, string>;
                for (const domain in contents["addon_domains"]) {
                    const addon = addon_domains[domain] ?? domain;
                    domains.push({ 'domain': domain, 'subdomain': addon });
                }
            }
            if (('sub_domains' in contents) &&
                contents["sub_domains"] &&
                Array.isArray(contents["sub_domains"])) {
                contents["sub_domains"].forEach((name) => {
                    const found = domains.some((domain) => domain.subdomain == name);
                    if (!found) {
                        domains.push({ 'domain': name, 'subdomain': name });
                    }
                });
            }

            for (const entry of domains) {
                const filename = path.join(CPANEL_PREFIX, entry.subdomain);
                const pathname = getRootPathname(filename);
                try {
                    const stats = await fs.stat(pathname);
                    if (stats.isFile()) {
                        files.push(new ScanFile(filename, pathname, entry.domain));
                        const sslFilename = filename + '-ssl_log';
                        const sslPathname = pathname + '-ssl_log';
                        const ssl = await fs.stat(sslPathname);
                        if (ssl.isFile()) {
                            files.push(new ScanFile(sslFilename, sslPathname, entry.domain));
                        }
                    }
                } catch {
                    // ignore
                }
            }
        }
    }

    return files;
}

/**
 *  Get a list of month-year strings used to access archived log files.
 *  @arg start : starting Date.
 *  @arg stop : ending Date.
 *  @rtype Array of String.
 */
function getArchiveMonths(start: Date, stop: Date): Array<string> {
    var months = [];
    var month, year;
    year = start.getFullYear();

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
 *  Find all archived log files for an account.
 *  @arg account name.
 *  @arg months Array of String values of Month-Years to check.
 *  @rtype promise for an Array of ScanFile.
 */
async function getAccountArchiveFiles(account: string, months: Array<string>): Promise<Array<ScanFile>> {
    const files: Array<ScanFile> = [];

    const homedir = await getAccountHomeDirectory(account);
    if (homedir) {
        const logsdir = path.join(homedir, 'logs');

        await loadAccountMain(account);
        if (mains[account]) {
            const contents = mains[account];
            let domains: Array<DomainAndSubdomain> = [];
            if (contents &&
                (typeof contents === 'object') &&
                ('main_domain' in contents) &&
                (typeof contents["main_domain"] == 'string')) {
                domains.push({ 'domain': contents["main_domain"], 'subdomain': contents["main_domain"] });
            }
            if (contents &&
                (typeof contents === 'object') &&
                ('addon_domains' in contents) &&
                contents["addon_domains"] &&
                (typeof contents["addon_domains"] === 'object')) {
                const addon_domains = contents["addon_domains"] as Record<string, unknown>;
                for (const domain in addon_domains) {
                    if ((typeof domain === 'string') &&
                        (domain in addon_domains) &&
                        (typeof addon_domains[domain] === 'string')
                    ) {
                        domains.push({ 'domain': domain, 'subdomain': addon_domains[domain] });
                    }
                }
            }
            if (contents &&
                (typeof contents === 'object') &&
                ('sub_domains' in contents) &&
                contents["sub_domains"] &&
                Array.isArray(contents["sub_domains"])) {
                contents["sub_domains"].forEach((name) => {
                    const found = domains.some((domain) => domain.subdomain == name);
                    if (!found) {
                        domains.push({ 'domain': name, 'subdomain': name });
                    }
                });
            }

            try {
                const logfiles = await fs.readdir(logsdir);

                domains.forEach(function (entry) {
                    months.forEach(function (month) {
                        const filename = entry.subdomain + '-' + month + '.gz';
                        if (logfiles.indexOf(filename) >= 0) {
                            const pathname = path.join(logsdir, filename);
                            files.push(new ScanFile(undefined, pathname, entry.domain));
                        }
                        const sslFilename = entry.subdomain + '-ssl_log-' + month + '.gz';
                        if (logfiles.indexOf(sslFilename) >= 0) {
                            const pathname = path.join(logsdir, sslFilename);
                            files.push(new ScanFile(undefined, pathname, entry.domain));
                        }
                    });
                });
            } catch {
                // ignore
            }
        }
    }

    return files;
}

/**
 *  Determine Domain log files.
 *  @arg domain name used for filename.
 *  @arg canonical domain name used for grouping.
 *  @rtype promise for an Array of ScanFile.
 */
async function getDomainLogFiles(domain: string, canonical: string): Promise<Array<ScanFile>> {
    const files: Array<ScanFile> = [];

    // check for standard log
    const filename = path.join(CPANEL_PREFIX, domain);
    const pathname = getRootPathname(filename);
    try {
        const stats = await fs.stat(pathname);
        if (stats.isFile()) {
            files.push(new ScanFile(filename, pathname, canonical));

            // check for secure log
            const sslFilename = filename + '-ssl_log';
            const sslPathname = pathname + '-ssl_log';
            const ssl = await fs.stat(sslPathname);
            if (ssl.isFile()) {
                files.push(new ScanFile(sslFilename, sslPathname, canonical));
            }
        }
    } catch {
        // ignore
    }

    return files;
}

let userDomains: string = '';

async function getUserDomains(): Promise<string> {
    if (userDomains === '') {
        try {
            userDomains = await fs.readFile(getRootPathname(CPANEL_USERDOMAINS), { encoding: 'utf8'});
        } catch (_) {
            userDomains = '';
        }
    }
    return userDomains;
}

/**
 *  Determine the owner of a domain.
 *  @arg domain name.
 *  @rtype promise to a String account name (undefined if not found.)
 */
async function getDomainOwner(domain: string): Promise<string | undefined> {
    const contents = await getUserDomains();
    const pattern = new RegExp('^' + domain + ': (.*)$', 'im');
    const find = pattern.exec(contents);
    if (find) {
        return find[1];
    }
    return undefined;
}


/**
 *  Determine the subdomain version of an addon domain name.
 *  @arg domain name.
 *  @rtype promise to a String subdomain version of an addon domain name.
 */
async function getSubdomainName(domain: string): Promise<string | undefined> {
    const owner = await getDomainOwner(domain);
    if (!owner) {
        return undefined;
    }

    await loadAccountMain(owner);

    if (mains[owner]) {
        const contents=mains[owner];
        if (contents &&
            (typeof contents === 'object') &&
            ('addon_domains' in contents) &&
            contents["addon_domains"] &&
            (typeof contents["addon_domains"] === 'object')) {
            const addon_domains = contents["addon_domains"] as Record<string, string>;
            if (domain in addon_domains) {
                return addon_domains[domain];
            }
        }
    }
    return undefined;
}


/**
 *  Interface to use when cPanel is found for root.
 */
export class CPanelAccess extends PanelAccess {
    constructor() {
        super();
        this.id = 'cPanel';
        this.hasAccounts = true;
        this.hasArchives = true;
        this.hasDomains = true;
        this.hasMainLog = true;
        this.hasPanelLog = true;
    }

    /**
      * Determine if the panel is installed.
      * @return Use cPanel version file to check installation.
      */
    override async isActive(): Promise<boolean> {
        const pathname = getRootPathname(CPANEL_VERSION_FILE);
        try {
            const stats = await fs.stat(pathname);
            if (stats.isFile()) {
                return true;
            }
        } catch {
            // ignore
        }
        return false;
    }

    /**
     *  Find all available log files for accounts and domains.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findAllLogFiles(): Promise<Array<ScanFile>> {
        const files: Array<ScanFile> = [];
        const accounts = await getAllAccounts();
        for (const account of accounts) {
            const each = await getAccountLogFiles(account);
            files.push(...each);
        }
        return files;
    }

    /**
     *  Find all log files associated with an account.
     *  @arg account name.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findAccountLogFiles(account: string): Promise<Array<ScanFile>> {
        return await getAccountLogFiles(account);
    }

    /**
     *  Find log files associated with a single domain.
     *  @arg domain name.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findDomainLogFiles(domain: string): Promise<Array<ScanFile>> {
        const files: Array<ScanFile> = [];
        const subdomain = await getSubdomainName(domain);
        if (subdomain) {
            const perSubdomain = await getDomainLogFiles(subdomain, domain);
            files.push(...perSubdomain);
        }
        const perDomain = await getDomainLogFiles(domain, domain);
        files.push(...perDomain);
        return files;
    }

    /**
     *  Find the main (no vhost) log files.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findMainLogFiles(): Promise<Array<ScanFile>> {
        const pathname = getRootPathname(CPANEL_MAIN_LOG);

        try {
            const stats = await fs.stat(pathname);
            if (stats.isFile()) {
                return [ new ScanFile(CPANEL_MAIN_LOG, pathname, 'main') ];
            }
        } catch {
            // ignore
        }
        return [];
    }

    /**
     *  Find the log files associated with the panel itself.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findPanelLogFiles(): Promise<Array<ScanFile>> {
        const pathname = getRootPathname(CPANEL_PANEL_LOG);

        try {
            const stats = await fs.stat(pathname);
            if (stats.isFile()) {
                return [ new ScanFile(CPANEL_PANEL_LOG, pathname, 'panel') ];
            }
        } catch {
            // ignore
        }
        return [];
    }

    /**
     *  Find all archived log files between the start and stop Date's.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findAllArchiveFiles(start: Date, stop: Date): Promise<Array<ScanFile>> {
        const months = getArchiveMonths(start, stop);
        const accounts = await getAllAccounts();
        const files: Array<ScanFile> = [];

        for (const account of accounts) {
            const perAccount = await getAccountArchiveFiles(account, months);
            files.push(...perAccount);
        }

        return files;
    }

    /**
     *  Find all archived log files for an account.
     *  @arg account name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findAccountArchiveFiles(account: string, start: Date, stop: Date): Promise<Array<ScanFile>> {
        const months = getArchiveMonths(start, stop);

        return await getAccountArchiveFiles(account, months);
    }

    /**
     *  Find all archived log files for a domain.
     *  @arg domain name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an Array of ScanFile.
     */
    override async findDomainArchiveFiles(domain: string, start: Date, stop: Date): Promise<Array<ScanFile>> {
        const account = await getDomainOwner(domain);
        if (!account) {
            return [];
        }

        const subdomain = await getSubdomainName(domain);
        const homedir = await getAccountHomeDirectory(account);
        if (!homedir) {
            return [];
        }

        const logsdir = path.join(homedir, 'logs');
        const months = getArchiveMonths(start, stop);
        const files: Array<ScanFile> = [];

        try {
            const logfiles = await fs.readdir(logsdir);

            for (const month of months) {
                const filename = `${domain}-${month}.gz`;
                if (logfiles.includes(filename)) {
                    const pathname = path.join(logsdir, filename);
                    files.push(new ScanFile(undefined, pathname, domain));
                } else if (subdomain) {
                    const filename = `${subdomain}-${month}.gz`;
                    if (logfiles.includes(filename)) {
                        const pathname = path.join(logsdir, filename);
                        files.push(new ScanFile(undefined, pathname, domain));
                    }
                }
                const sslFilename = `${domain}-ssl_log-${month}.gz`;
                if (logfiles.includes(sslFilename)) {
                    const pathname = path.join(logsdir, sslFilename);
                    files.push(new ScanFile(undefined, pathname, domain));
                } else if (subdomain) {
                    const sslFilename = `${subdomain}-ssl_log-${month}.gz`;
                    if (logfiles.includes(sslFilename)) {
                        const pathname = path.join(logsdir, sslFilename);
                        files.push(new ScanFile(undefined, pathname, domain));
                    }
                }
            }
        } catch {
            return [];
        }
        return files;
    }

    /**
     *  Find all archived main log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    override async findMainArchiveFiles(_start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }

    /**
     *  Find all archived panel log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    override async findPanelArchiveFiles(_start: Date, _stop: Date): Promise<Array<ScanFile>> {
        return [];
    }
}

