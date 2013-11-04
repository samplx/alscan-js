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
var yaml = require("js-yaml");
var scanfile = require("../scanfile.js");

// Constants

/** Main (non-vhost) access log. */
var CPANEL_MAIN_LOG = '/usr/local/apache/logs/access_log';

/** Panel access log pathname. */
var CPANEL_PANEL_LOG = '/usr/local/cpanel/logs/access_log';

/** Prefix to most access log files. */
var CPANEL_PREFIX = '/usr/local/apache/domlogs';

/** Pathname of the cPanel userdata directory. */
var CPANEL_USERDATA_DIR = '/var/cpanel/userdata';

/** Pathname of user domains configuration file. */
var CPANEL_USERDOMAINS = '/etc/userdomains';

/** Pathname of the cPanel version file. */
var CPANEL_VERSION_FILE = '/usr/local/cpanel/version';

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
var archivePattern = new RegExp(/^(.*)(-ssl_log)?-(...-\d\d\d\d)\.gz/);

/** promise of contents of the /etc/userdomains file */
var userdomains = null;

/** promises of the contents of the /var/cpanel/userdata/<account>/main */
var mains = { };

/**
 *  Load the contents of the /var/cpanel/userdata/<account>/main file
 *  @arg account name.
 */
function loadAccountMain(account) {
    if (!mains[account]) {
        var d = when.defer();
        mains[account] = d.promise;
        
        var pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, account, 'main'));
        fs.readFile(pathname, {encoding: 'utf8', flag: 'r'}, function (err, data) {
            if (err) {
                d.resolve('');
            } else {
                d.resolve(data);
            }
        });
    }
}

/**
 *  Determine an account's home directory.
 *  @arg account name.
 *  @rtype promise for a pathname of the account's home directory.
 */
function getAccountHomeDirectory(account) {
    var d = when.defer();
    var pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, account, 'main'));

    loadAccountMain(account);
    mains[account].then(function (data) {
        var contents = null;
        var e;
        try {
            contents = yaml.safeLoad(data, { filename: pathname });
        } catch (e) {
        }
        if (contents && contents.main_domain) {
            pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, account, contents.main_domain));
            var domain = fs.readFileSync(pathname, {encoding: 'utf8', flag: 'r'});
            contents = null;
            try {
                contents = yaml.safeLoad(domain, { filename: pathname });
            } catch (e) {
            }
        }
        if (contents && contents.homedir) {
            d.resolve(scanfile.getRootPathname(contents.homedir));
        } else {
            d.resolve(scanfile.getRootPathname('/home/' + account));
        }
    });
    
    return d.promise;
}

/**
 *  Determine all account names.
 *  @rtype Array of String.
 */
function getAllAccounts() {
    var d = when.defer();
    var dir = scanfile.getRootPathname(CPANEL_USERDATA_DIR);
    
    fs.readdir(dir, function (err, contents) {
        var accounts = [];
        if (!err) {
            contents.forEach(function (name) {
                if (name != 'nobody') {
                    accounts.push(name);
                }
            });
        }
//        console.log("getAllAccounts= " + util.inspect(accounts));
        d.resolve(accounts);
    });
    
    return d.promise;
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
                        files.push(new scanfile.ScanFile(filename, pathname, entry.domain));
                    }
                    filename += '-ssl_log';
                    pathname += '-ssl_log';
                    fs.exists(pathname, function (yes) {
                        if (yes) {
                            files.push(new scanfile.ScanFile(filename, pathname, entry.domain));
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
function getAccountArchiveFiles(account, months) {
    var deferred = when.defer();
    var files = [];
    
    getAccountHomeDirectory(account).then(function (homedir) {
        var logsdir = path.join(homedir, 'logs');

        loadAccountMain(account);
        mains[account].then(function (data) {
            var e;
            var contents = null;
            var domains = [];
            try {
                contents = yaml.safeLoad(data);
            } catch (e) {
            }
            if (!contents) {
                deferred.resolve([]);
                return;
            }
    //      console.log("getAccountLogFiles: contents=" + util.inspect(contents));
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
    //      console.log("getAccountLogFiles: domains=" + util.inspect(domains));

            fs.readdir(logsdir, function (err, logfiles) {
                var filename, pathname;
                if (!err) {
                    domains.forEach(function (entry) {
                        months.forEach(function (month) {
                            filename = entry.subdomain + '-' + month + '.gz';
                            if (logfiles.indexOf(filename) >= 0) {
                                pathname = path.join(logsdir, filename);
                                files.push(new scanfile.ScanFile(undefined, pathname, entry.domain));
                            }
                            filename = entry.subdomain + '-ssl_log-' + month + '.gz';
                            if (logfiles.indexOf(filename) >= 0) {
                                pathname = path.join(logsdir, filename);
                                files.push(new scanfile.ScanFile(undefined, pathname, entry.domain));
                            }
                        });
                    });
                }
                deferred.resolve(files);
            });
        });
    });
    
    return deferred.promise;
}

/**
 *  Determine Domain log files.
 *  @arg domain name used for filename.
 *  @arg cannoincal domain name used for grouping.
 *  @rtype promise for an Array of ScanFile.
 */
function getDomainLogFiles(domain, cannonical) {
    var deferred = when.defer();
    var files = [];
    var filename, pathname;
    
//    console.log("getDomainLogFiles("+domain+", "+cannonical+")");
    // check for standard log
    filename = path.join(CPANEL_PREFIX, domain);
    pathname = scanfile.getRootPathname(filename);
    fs.exists(pathname, function (yes) {
//        console.log("checking: '"+pathname+"'");
        if (yes) {
//            console.log("found: '"+pathname+"'");
            files.push(new scanfile.ScanFile(filename, pathname, cannonical));
        }
        
        // check for secure log
        filename += "-ssl_log";
        pathname += "-ssl_log";
        fs.exists(pathname, function (yes) {
//            console.log("checking: '"+pathname+"'");
            if (yes) {
//                console.log("found: '"+pathname+"'");
                files.push(new scanfile.ScanFile(filename, pathname, cannonical));
            }
            deferred.resolve(files);
        });
    });
    
    return deferred.promise;
}

/**
 *  Determine the owner of a domain.
 *  @arg domain name.
 *  @rtype promise to a String account name (null if not found.)
 */
function getDomainOwner(domain) {
//    console.log("getDomainOwner("+domain+") start");
    if (userdomains == null) {
//        console.log("userdomains is null");
        var d = when.defer();
        userdomains = d.promise;
        var pathname = scanfile.getRootPathname(CPANEL_USERDOMAINS);
        fs.readFile(pathname, { encoding: "utf8" }, function (err, contents) {
            if (err) {
                d.resolve('');
            } else {
                d.resolve(contents);
            }
        });
    }
    var deferred= when.defer();
    userdomains.then(function (contents) {
//        console.log("userdomains=>");
//        console.log(contents);
        var pattern = RegExp("^" + domain + ": (.*)$", "im");
//        console.log("pattern = " + pattern);
        var find = pattern.exec(contents);
        if (find) {
//            console.log("find[1]=" + util.inspect(find[1]));
//            console.log('getDomainOwner('+domain+') resolves as '+find[1]);
            deferred.resolve(find[1]);
        } else {
//            console.log('getDomainOwner('+domain+') resolves as null.');
            deferred.resolve(null);
        }
    });
    return deferred.promise;
}


/**
 *  Deterine the subdomain version of an addon domain name.
 *  @arg domain name.
 *  @rtype promise to a String subdomain version of an addon domain name.
 */
function getSubdomainName(domain) {
    var subdomain = null;
    var d = when.defer();
    
    getDomainOwner(domain).then(function (username) {
//        console.log("getDomainOwner("+domain+")=" + username);
        if (username) {
            var pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, username, 'main'));
                        
            loadAccountMain(username);
            
            mains[username].then(
                function (data) {
                    var contents=null;
                    var e;
                    try {
                        contents = yaml.safeLoad(data, { filename: pathname });
                    } catch (e) {
                        d.reject(e);
                    }
                    if (contents && contents.addon_domains && contents.addon_domains[domain]) {
                        d.resolve(contents.addon_domains[domain]);
                    } else {
                        d.resolve(null);
                    }
                }
            );
        }
    });
    return d.promise;
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
 *  Interface to use when cPanel is found for root.
 */
var cPanel = {
    /** Identifier of the panel interface. */
    id : 'cPanel',
    
    /** Does this panel support --accounts option. */
    hasAccounts : true,
    
    /** Does this panel support --archives option. */
    hasArchives : true,
    
    /** Does this panel support --domains and --domlogs options. */
    hasDomains : true,
    
    /** Does this panel support --panel option. */
    hasPanelLog : true,
    
    /** Does this panel support --main option. */
    hasMainLog : true,

    /**
      * Deterine if the panel is installed.
      * @rtype Boolean. Use cPanel version file to check installation.
      */
    isActive : function() {
        var pathname = scanfile.getRootPathname(CPANEL_VERSION_FILE);
//        console.log('version file=' + pathname);
        return fs.existsSync(pathname);
    },
    
    /**
     *  Find all available log files for accounts and domains.
     *  @rtype promise for an Array of ScanFile.
     */
    findAllLogFiles : function () {
        var deferred = when.defer();
        var promises = [];
        var accounts = getAllAccounts();
        
        accounts.then(function (list) {
            list.forEach(function (account) {
//                console.log("getAccountLogFiles(" + account + ")");
                promises.push(getAccountLogFiles(account));
            });
            when.all(promises).then(function (array) {
                deferred.resolve(underscore.flatten(array));
            });
        });

        return deferred.promise;
    },
    
    /**
     *  Find all log files associated with an account.
     *  @arg account name.
     *  @rtype promise for an Array of ScanFile.
     */
    findAccountLogFiles : function (account) {
        return getAccountLogFiles(account);
    },
    
    /**
     *  Find log files associated with a single domain.
     *  @arg domain name.
     *  @rtype promise for an Array of ScanFile.
     */
    findDomainLogFiles : function (domain) {
        var promises = [];
        var deferred = when.defer();
        
        getSubdomainName(domain).then(function (subdomain) {
//            console.log("getSubdomainName("+domain+")="+subdomain);
            if (subdomain) {
                promises.push(getDomainLogFiles(subdomain, domain));
            }
            promises.push(getDomainLogFiles(domain, domain));
            
            when.all(promises).then(function (array) {
                deferred.resolve(underscore.flatten(array));
            });
        });
        
        return deferred.promise;
    },
    
    /**
     *  Find the main (no vhost) log files.
     *  @rtype promise for an Array of ScanFile.
     */
    findMainLogFiles : function () {
        var pathname = scanfile.getRootPathname(CPANEL_MAIN_LOG);
        var d = when.defer();
        
        fs.exists(pathname, function (yes) {
            if (yes) {
                d.resolve([ new scanfile.ScanFile(CPANEL_MAIN_LOG, pathname, 'main') ]);
            } else {
                d.resolve([]);
            }
        });
        
        return d.promise;
    },
    
    /**
     *  Find the log files associated with the panel itself.
     *  @rtype promise for an Array of ScanFile.
     */
    findPanelLogFiles : function () {
        var pathname = scanfile.getRootPathname(CPANEL_PANEL_LOG);
        var d = when.defer();
        
        fs.exists(pathname, function (yes) {
            if (yes) {
                d.resolve([ new scanfile.ScanFile(CPANEL_PANEL_LOG, pathname, 'panel') ]);
            } else {
                d.resolve([]);
            }
        });
        return d.promise;
    },
    
    /**
     *  Find all archived log files between the start and stop Date's.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an Array of ScanFile.
     */
    findAllArchiveFiles : function (start, stop) {
        var months = getArchiveMonths(start, stop);
        var promises = [];
        var accounts = getAllAccounts();
        var deferred = when.defer();
        
        accounts.then(function (list) {
//            console.log("getAllAccounts() resolves to " + list);
            list.forEach(function (account) {
                promises.push(getAccountArchiveFiles(account, months));
            });
            
            when.all(promises).then(function (array) {
                deferred.resolve(underscore.flatten(array));
            });
        });

        return deferred.promise;
    },
    
    /**
     *  Find all archived log files for an account.
     *  @arg account name.
     *  @arg start first Date of archives.
     *  @arg stop last Date of archives.
     *  @rtype promise for an Array of ScanFile.
     */
    findAccountArchiveFiles : function (account, start, stop) {
        var months = getArchiveMonths(start, stop);

        return getAccountArchiveFiles(account, months);
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

        getDomainOwner(domain).then(function (account) {
//            console.log("getDomainOwner("+domain+")=" + account);
            if (!account) {
//                console.log("getDomainOwner == null");
                d.resolve([]);
                return;
            }
            getSubdomainName(domain).then(function (subdomain) {
                getAccountHomeDirectory(account).then(function (homedir) {
                    var logsdir = path.join(homedir, 'logs');
//                    console.log("logsdir=" + logsdir);
                    var months = getArchiveMonths(start, stop);
//                    console.log("months=" + months);
                    var files = [];
                    fs.readdir(logsdir, function (err, logfiles) {
                        if (err) {
//                            console.error(err);
                            d.resolve([]);
                            return;
                        }
//                        console.log("logfiles=" + util.inspect(logfiles));
                        var filename, pathname;
                        months.forEach(function (month) {
                            filename = domain + '-' + month + '.gz';
                            if (logfiles.indexOf(filename) >= 0) {
                                pathname = path.join(logsdir, filename);
                                files.push(new scanfile.ScanFile(undefined, pathname, domain));
                            } else if (subdomain) {
                                filename = subdomain + '-' + month + '.gz';
                                if (logfiles.indexOf(filename) >= 0) {
                                    pathname = path.join(logsdir, filename);
                                    files.push(new scanfile.ScanFile(undefined, pathname, domain));
                                }
                            }
                            filename = domain + '-ssl_log-' + month + '.gz';
                            if (logfiles.indexOf(filename) >= 0) {
                                pathname = path.join(logsdir, filename);
                                files.push(new scanfile.ScanFile(undefined, pathname, domain));
                            } else if (subdomain) {
                                filename = subdomain + '-ssl_log-' + month + '.gz';
                                if (logfiles.indexOf(filename) >= 0) {
                                    pathname = path.join(logsdir, filename);
                                    files.push(new scanfile.ScanFile(undefined, pathname, domain));
                                }
                            }
                        });
                        d.resolve(files);
                    });
                });
            });
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
                d.resolve([ new scanfile.ScanFile(filename, pathname, 'file') ]);
            } else {
                fs.exists(filename, function (yes) {
                    if (yes) {
                        d.resolve([ new scanfile.ScanFile(filename, filename, 'file') ]);
                    } else if (filename == '-') {
                        d.resolve([ new scanfile.ScanFile('-', undefined, 'file') ]);
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
                                d.resolve([ new scanfile.ScanFile(filename, pathname, 'directory') ]);
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

module.exports = cPanel;


