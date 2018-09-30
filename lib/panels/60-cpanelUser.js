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

// module imports
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const when = require('when');
const scanfile = require('../scanfile.js');
const ScanFile = scanfile.ScanFile;

// Constants

/** Directory used to determine that cPanel in installed. */
const CPANEL_DIRECTORY = '.cpanel';

/** Prefix to most access log files. */
//var CPANEL_PREFIX = '/usr/local/apache/domlogs';

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

/** Pattern used to recognize an archived log file. */
const archivePattern = new RegExp(/^(.*?)(-ssl_log)?-(...-\d\d\d\d)\.gz/);

/** Pattern used to extract domain name from filename. */
const domainPattern = new RegExp(/^(.*?)(-ssl_log)?$/);

/**
 *  Determine an account's home directory.
 *  @rtype String pathname of the account's home directory.
 */
function getHomeDirectory() {
    if (process.env.ALSCAN_TESTING_HOME) {
        return scanfile.getRootPathname(process.env.ALSCAN_TESTING_HOME);
    }
    return scanfile.getRootPathname(process.env.HOME);
}

/**
 *  Get a list of month-year strings used to access archived log files.
 *  @arg start : starting Date.
 *  @arg stop : ending Date.
 *  @rtype Array of String.
 */
function getArchiveMonths(start, stop) {
    const months = [];
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
 *  Determine Domain log files.
 *  @arg domain name used for filename.
 *  @rtype promise for an Array of ScanFile.
 */
function getDomainLogFiles(domain) {
    const deferred = when.defer();
    const files = [];

    // check for standard log
    const pathname = path.join(getHomeDirectory(), 'access-logs', domain);
    fs.exists(pathname, (yes) => {
        if (yes) {
            files.push(new ScanFile(undefined, pathname, domain));
        }

        // check for secure log
        const sslPathname = pathname + '-ssl_log';
        fs.exists(sslPathname, (yes) => {
            if (yes) {
                files.push(new ScanFile(undefined, sslPathname, domain));
            }
            deferred.resolve(files);
        });
    });

    return deferred.promise;
}

function isIgnoredFilename(filename) {
    return (IGNORED_FILENAME.indexOf(filename) >= 0);
}

function isIgnoredSuffix(filename) {
    return IGNORED_SUFFIX.some((suffix) => (suffix.length < filename.length) && (suffix == filename.substr(-suffix.length)));
}

function isIgnoredPattern(filename) {
    return IGNORED_PATTERN.some((pattern) => pattern.test(filename));
}

/**
 *  Check if file should not be included in results.
 *  @arg filename to check.
 *  @rtype Boolean - true to ignore file, false to include file.
 */
function isIgnoredFile(filename) {
    return isIgnoredFilename(filename) || isIgnoredSuffix(filename) || isIgnoredPattern(filename);
}

/**
 *  Interface to use when cPanel is found for a non-root user.
 */
var cPanelUser = {
    /** Identifier of the panel interface. */
    id : 'cPanelUser',

    /** Does this panel support --accounts option. */
    hasAccounts : false,

    /** Does this panel support --archives option. */
    hasArchives : true,

    /** Does this panel support --domains and --domlogs options. */
    hasDomains : true,

    /** Does this panel support --panel option. */
    hasPanelLog : false,

    /** Does this panel support --main option. */
    hasMainLog : false,

    /**
      * Deterine if the panel is installed.
      * @rtype Boolean. Use cPanel version file to check installation.
      */
    isActive : function() {
        const pathname = path.join(getHomeDirectory(), CPANEL_DIRECTORY);
        return fs.existsSync(pathname);
    },

    /**
     *  Find all available log files for accounts and domains.
     *  @rtype promise for an Array of ScanFile.
     */
    findAllLogFiles : function () {
        const deferred = when.defer();
        const logdir = path.join(getHomeDirectory(), 'access-logs');
        const files = [];

        fs.readdir(logdir, (err, logfiles) => {
            if (!err) {
                logfiles.forEach((file) => {
                    if (!isIgnoredFile(file)) {
                        const check = domainPattern.exec(file);
                        if (check) {
                            files.push(new ScanFile(undefined, path.join(logdir, file), check[1]));
                        }
                    }
                });
            }
            deferred.resolve(files);
        });

        return deferred.promise;
    },

    /**
     *  Find all log files associated with an account.
     *  @arg account name.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findAccountLogFiles : function (account) {      // eslint-disable-line no-unused-vars
        return when([]);
    },

    /**
     *  Find log files associated with a single domain.
     *  @arg domain name.
     *  @rtype promise for an Array of ScanFile.
     */
    findDomainLogFiles : function (domain) {
        return getDomainLogFiles(domain);
    },

    /**
     *  Find the main (no vhost) log files.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findMainLogFiles : function () {
        return when([]);
    },

    /**
     *  Find the log files associated with the panel itself.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findPanelLogFiles : function () {
        return when([]);
    },

    /**
     *  Find all archived log files between the start and stop Date's.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an Array of ScanFile.
     */
    findAllArchiveFiles : function (start, stop) {
        const d = when.defer();
        const logdir = path.join(getHomeDirectory(), 'logs');
        const months = getArchiveMonths(start, stop);
        const files = [];

        fs.readdir(logdir, (err, logfiles) => {
            if (!err) {
                logfiles.forEach((file) => {
                    const check = archivePattern.exec(file);
                    if (check && (months.indexOf(check[3]) >= 0) && !isIgnoredFile(file)) {
                        files.push(new ScanFile(undefined, path.join(logdir, file), check[1]));
                    }
                });
            }
            d.resolve(files);
        });

        return d.promise;
    },

    /**
     *  Find all archived log files for an account.
     *  @arg account name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findAccountArchiveFiles : function (account, start, stop) {     // eslint-disable-line no-unused-vars
        return when([]);
    },

    /**
     *  Find all archived log files for a domain.
     *  @arg domain name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an Array of ScanFile.
     */
    findDomainArchiveFiles : function (domain, start, stop) {
        const d = when.defer();
        const logdir = path.join(getHomeDirectory(), 'logs');
        const months = getArchiveMonths(start, stop);
        const files = [];

        fs.readdir(logdir, (err, logfiles) => {
            if (!err) {
                logfiles.forEach((file) => {
                    months.forEach((month) => {
                        if ((file == (domain + '-' + month + '.gz')) ||
                            (file == (domain + '-ssl_log-' + month + '.gz')) ) {
                            files.push(new ScanFile(undefined, path.join(logdir, file), domain));
                        }
                    });
                });
            }
            d.resolve(files);
        });

        return d.promise;
    },

    /**
     *  Find all archived main log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findMainArchiveFiles : function (start, stop) {     // eslint-disable-line no-unused-vars
        return when([]);
    },

    /**
     *  Find all archived panel log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findPanelArchiveFiles : function (start, stop) {     // eslint-disable-line no-unused-vars
        return when([]);
    },

    /**
     *  Find a single log file.
     *  @arg filename - name of the log file.
     *  @rtype promise to array of ScanFile.
     */
    findLogFile : function (filename) {
        const pathname = scanfile.getRootPathname(filename);
        const d = when.defer();
        fs.exists(pathname, (yes) => {
            if (yes) {
                d.resolve([ new ScanFile(filename, pathname, 'file') ]);
            } else {
                fs.exists(filename, (yes) => {
                    if (yes) {
                        d.resolve([ new ScanFile(filename, filename, 'file') ]);
                    } else if (filename == '-') {
                        d.resolve([ new ScanFile('-', undefined, 'file') ]);
                    } else {
                        d.resolve([]);
                    }
                });
            }
        });
        return d.promise;
    },

    /**
     *  Find all log files in a directory.
     *  @arg dir directory name.
     *  @rtype promise to Array of ScanFile.
     */
    findLogFilesInDirectory : function (dir) {
        const dirpath = scanfile.getRootPathname(dir);
        const deferred = when.defer();
        const promises = [];

        fs.readdir(dirpath, (err, files) => {
            if (err) {
                deferred.resolve([]);
            } else {
                files.forEach((file) => {
                    const d = when.defer();
                    promises.push(d.promise);
                    const pathname= path.join(dirpath, file);
                    const filename= path.join(dir, file);
                    if (isIgnoredFile(file)) {
                        d.resolve([]);
                    } else {
                        fs.stat(pathname, (err, stats) => {
                            if (!err && stats.isFile()) {
                                d.resolve([ new ScanFile(filename, pathname, 'directory') ]);
                            } else {
                                d.resolve([]);
                            }
                        });
                    }
                });
                when.all(promises).then((array) => {
                    deferred.resolve(_.flatten(array));
                });
            }
        });

        return deferred.promise;
    }

};

module.exports = cPanelUser;


