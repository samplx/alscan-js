#!/usr/bin/env node
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
"use strict";

// module imports
var util = require("util");
var fs = require("fs");
var path = require("path");
var underscore = require("underscore");
var when = require("when");
var scanfile = require("../scanfile.js");
var ScanFile = scanfile.ScanFile;

// Constants

/** Directory used to determine that cPanel in installed. */
var CPANEL_DIRECTORY = ".cpanel";

/** Names of files to ignore. */
var IGNORED_FILENAME = [
                "ftpxferlog",
                "ftpxferlog.offset",
                "ftpxferlog.offsetftpsep"
    ];

/** Suffixes of ignored files. */
var IGNORED_SUFFIX = [
                "-bytes_log",
                "-bytes_log.offset",
                "-ftp_log",
                "-ftp_log.offsetftpbytes",
                "-ftp_log.offset",
                ".bkup",
                ".bkup2"
    ];
    
/** Patterns for ignored files. */
var IGNORED_PATTERN = [
                new RegExp(/-ftp_log-...-\d\d\d\d\.gz$/)
    ];
    
/** Name of months used in Archive file names. */
var MONTH_NAMES = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

/** Pattern used to recognize an archived log file. */
var archivePattern = new RegExp(/^(.*?)(-ssl_log)?-(...-\d\d\d\d)\.gz/);

/** Pattern used to extract domain name from filename. */
var domainPattern = new RegExp(/^(.*?)(-ssl_log)?$/);

/**
 *  Determine an account's home directory.
 *  @rtype String pathname of the account's home directory.
 */
function getHomeDirectory() {
    var homedir;
    if (process.env.ALSCAN_TESTING_HOME) {
        homedir = process.env.ALSCAN_TESTING_HOME;
    } else {
        homedir = process.env.HOME;
    }
    return scanfile.getRootPathname(homedir);
}

/**
 *  Find all log files associated with an account.
 *  @arg account name.
 *  @rtype promise for an Array of ScanFile.
 */
function getAccountLogFiles(account) {
    var promises = [];
    var domains = [];
    var deferred = when.defer();
    
    loadAccountMain(account);
    mains[account].then(function (data) {
        var e;
        var contents = null;
        try {
            contents = yaml.safeLoad(data);
        } catch (e) {
            console.error(e.message);
        }
        if (contents) {
//            console.log("getAccountLogFiles: contents=" + util.inspect(contents));
            if (contents.main_domain) {
                domains.push({ "domain": contents.main_domain, "subdomain": contents.main_domain });
            }
            if (contents.addon_domains) {
                for (var domain in contents.addon_domains) {
                    domains.push({ "domain": domain, "subdomain": contents.addon_domains[domain] });
                }
            }
            if (contents.sub_domains) {
                contents.sub_domains.forEach(function (name) {
                    var found = false;
                    for (var n=0, length= domains.length; n < length; n++) {
                        if (domains[n].subdomain == name) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        domains.push({ "domain": name, "subdomain": name });
                    }
                });
            }
//            console.log("getAccountLogFiles: domains=" + util.inspect(domains));
            domains.forEach(function (entry) {
                var filename = path.join(CPANEL_PREFIX, entry.subdomain);
                var pathname = scanfile.getRootPathname(filename);
                var d = when.defer();
                var files = [];
                promises.push(d.promise);
                fs.exists(pathname, function (yes) {
                    if (yes) {
                        files.push(new ScanFile(filename, pathname, entry.domain));
                    }
                    filename += '-ssl_log';
                    pathname += '-ssl_log';
                    fs.exists(pathname, function (yes) {
                        if (yes) {
                            files.push(new ScanFile(filename, pathname, entry.domain));
                        }
                        d.resolve(files);
                    });
                });
            });
        }
    }).then(function() {
//        console.log("getAccountLogFiles: promises=" + util.inspect(promises));
        when.all(promises).then(function (array) {
//            console.log("getAccountLogFiles: when.all, array=" + util.inspect(array));
            deferred.resolve(underscore.flatten(array));
        });
    });
    
    return deferred.promise;
}

/**
 *  Get a list of month-year strings used to access archived log files.
 *  @arg start : starting Date.
 *  @arg stop : ending Date.
 *  @rtype Array of String.
 */
function getArchiveMonths(start, stop) {
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
function getAccountArchiveFiles(months) {
    var deferred = when.defer();
    var files = [];

    var homedir = getHomeDirectory();    
    var logsdir = path.join(homedir, 'logs');

    fs.readdir(logsdir, function (err, logfiles) {
        if (!err) {
            logfiles.forEach(function (name) {
            });
        }
        deferred.resolve(files);
    });
    
    return deferred.promise;
}

/**
 *  Determine Domain log files.
 *  @arg domain name used for filename.
 *  @rtype promise for an Array of ScanFile.
 */
function getDomainLogFiles(domain) {
    var deferred = when.defer();
    var files = [];
    var filename, pathname;
    
//    console.log("getDomainLogFiles("+domain+")");
    // check for standard log
    pathname = path.join(getHomeDirectory(), 'access-logs', domain);
    fs.exists(pathname, function (yes) {
//        console.log("checking: '"+pathname+"'");
        if (yes) {
//            console.log("found: '"+pathname+"'");
            files.push(new ScanFile(undefined, pathname, domain));
        }
        
        // check for secure log
        pathname += "-ssl_log";
        fs.exists(pathname, function (yes) {
//            console.log("checking: '"+pathname+"'");
            if (yes) {
//                console.log("found: '"+pathname+"'");
                files.push(new ScanFile(undefined, pathname, domain));
            }
            deferred.resolve(files);
        });
    });
    
    return deferred.promise;
}

/**
 *  Check if file should not be included in results.
 *  @arg filename to check.
 *  @rtype Boolean - true to ignore file, false to include file.
 */
function isIgnoredFile(filename) {
    if (IGNORED_FILENAME.indexOf(filename) >= 0) {
        return true;
    }
    var fnlength = filename.length;
    var suffixlen;
    for (var n=0, length= IGNORED_SUFFIX.length; n < length; n++) {
        suffixlen = IGNORED_SUFFIX[n].length;
        if (suffixlen < fnlength) {
            if (filename.substr(-suffixlen) == IGNORED_SUFFIX[n]) {
                return true;
            }
        }
    }
    for (var n=0, length = IGNORED_PATTERN.length; n < length; n++) {
        if (IGNORED_PATTERN[n].test(filename)) {
            return true;
        }
    }
    return false;
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
        var pathname = path.join(getHomeDirectory(), CPANEL_DIRECTORY);
//        console.log('version file=' + pathname);
        return fs.existsSync(pathname);
    },
    
    /**
     *  Find all available log files for accounts and domains.
     *  @rtype promise for an Array of ScanFile.
     */
    findAllLogFiles : function () {
        var deferred = when.defer();
        var logdir = path.join(getHomeDirectory(), 'access-logs');
        var files = [];
        
        fs.readdir(logdir, function (err, logfiles) {
            if (!err) {
                logfiles.forEach(function (file) {
                    if (!isIgnoredFile(file)) {
                        var check = domainPattern.exec(file);
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
    findAccountLogFiles : function (account) {
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
        var d = when.defer();
        var logdir = path.join(getHomeDirectory(), 'logs');
        var months = getArchiveMonths(start, stop);
        var files = [];
        
        fs.readdir(logdir, function (err, logfiles) {
            if (!err) {
                logfiles.forEach(function (file) {
                    var check = archivePattern.exec(file);
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
    findAccountArchiveFiles : function (account, start, stop) {
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
        var d = when.defer();
        var logdir = path.join(getHomeDirectory(), 'logs');
        var months = getArchiveMonths(start, stop);
        var files = [];
        
        fs.readdir(logdir, function (err, logfiles) {
            if (!err) {
                logfiles.forEach(function (file) {
                    months.forEach(function (month) {
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
    findMainArchiveFiles : function (start, stop) {
        return when([]);
    },
    
    /**
     *  Find all archived panel log files.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findPanelArchiveFiles : function (start, stop) {
        return when([]);
    },

    /**
     *  Find a single log file.
     *  @arg filename - name of the log file.
     *  @rtype promise to array of ScanFile.
     */
    findLogFile : function (filename) {
        var pathname = scanfile.getRootPathname(filename);
        var d = when.defer();
        fs.exists(pathname, function (yes) {
            if (yes) {
                d.resolve([ new ScanFile(filename, pathname, 'file') ]);
            } else {
                fs.exists(filename, function (yes) {
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
        var dirpath = scanfile.getRootPathname(dir);
        var deferred = when.defer();
        var promises = [];

        fs.readdir(dirpath, function (err, files) {
            if (err) {
                deferred.resolve([]);
            } else {
//                console.log("contents of " + dirpath); console.dir(files);
                files.forEach(function (file) {
                    var d = when.defer();
                    promises.push(d.promise);
                    var pathname= path.join(dirpath, file);
                    var filename= path.join(dir, file);
                    if (isIgnoredFile(file)) {
//                        console.log('isIgnoredFile('+file+')=true');
                        d.resolve([]);
                    } else {
//                        console.log('fs.stat('+pathname+'), file='+file);
                        fs.stat(pathname, function (err, stats) {
                            if (!err && stats.isFile()) {
//                                console.log('adding file: ' + pathname);
                                d.resolve([ new ScanFile(filename, pathname, 'directory') ]);
                            } else {
                                d.resolve([]);
                            }
                        });
                    }
                });
                when.all(promises).then(function (array) {
                    deferred.resolve(underscore.flatten(array));
                });
            }
        });

        return deferred.promise;
    }
    
};

module.exports = cPanelUser;


