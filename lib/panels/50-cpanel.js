#!/usr/bin/env node
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
const yaml = require('js-yaml');
const scanfile = require('../scanfile.js');

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
// var archivePattern = new RegExp(/^(.*)(-ssl_log)?-(...-\d\d\d\d)\.gz/);

/** promise of contents of the /etc/userdomains file */
var userdomains = null;

/** promises of the contents of the /var/cpanel/userdata/<account>/main */
const mains = { };

/**
 *  Load the contents of the /var/cpanel/userdata/<account>/main file
 *  @arg account name.
 */
function loadAccountMain(account) {
    if (!mains[account]) {
        const d = when.defer();
        mains[account] = d.promise;

        const pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, account, 'main'));
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
    const d = when.defer();
    const pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, account, 'main'));

    loadAccountMain(account);
    mains[account].then((data) => {
        var contents = null;
        try {
            contents = yaml.safeLoad(data, { filename: pathname });
        } catch (e) {
            // ignore
        }
        if (contents && contents.main_domain) {
            const pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, account, contents.main_domain));
            const domain = fs.readFileSync(pathname, {encoding: 'utf8', flag: 'r'});
            contents = null;
            try {
                contents = yaml.safeLoad(domain, { filename: pathname });
            } catch (e) {
                // ignore
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
    const d = when.defer();
    const dir = scanfile.getRootPathname(CPANEL_USERDATA_DIR);

    fs.readdir(dir, function (err, contents) {
        const accounts = [];
        if (!err) {
            contents.forEach((name) => {
                if (name != 'nobody') {
                    accounts.push(name);
                }
            });
        }
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
    const promises = [];
    const domains = [];
    const deferred = when.defer();

    loadAccountMain(account);
    mains[account].then(function (data) {
        var contents = null;
        try {
            contents = yaml.safeLoad(data);
        } catch (e) {
            console.error(e.message);
        }
        if (contents) {
            if (contents.main_domain) {
                domains.push({ 'domain': contents.main_domain, 'subdomain': contents.main_domain });
            }
            if (contents.addon_domains) {
                for (var domain in contents.addon_domains) {
                    domains.push({ 'domain': domain, 'subdomain': contents.addon_domains[domain] });
                }
            }
            if (contents.sub_domains) {
                contents.sub_domains.forEach((name) => {
                    const found = domains.some((domain) => domain.subdomain == name);
                    if (!found) {
                        domains.push({ 'domain': name, 'subdomain': name });
                    }
                });
            }
            domains.forEach((entry) => {
                const filename = path.join(CPANEL_PREFIX, entry.subdomain);
                const pathname = scanfile.getRootPathname(filename);
                const d = when.defer();
                const files = [];
                promises.push(d.promise);
                fs.exists(pathname, (yes) => {
                    if (yes) {
                        files.push(new scanfile.ScanFile(filename, pathname, entry.domain));
                    }
                    const sslFilename = filename + '-ssl_log';
                    const sslPathname = pathname + '-ssl_log';
                    fs.exists(sslPathname, (yes) => {
                        if (yes) {
                            files.push(new scanfile.ScanFile(sslFilename, sslPathname, entry.domain));
                        }
                        d.resolve(files);
                    });
                });
            });
        }
    }).then(() => {
        when.all(promises).then(function (array) {
            deferred.resolve(_.flatten(array));
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
            var contents = null;
            var domains = [];
            try {
                contents = yaml.safeLoad(data);
            } catch (e) {
                // ignore
            }
            if (!contents) {
                deferred.resolve([]);
                return;
            }
            if (contents.main_domain) {
                domains.push({ 'domain': contents.main_domain, 'subdomain': contents.main_domain });
            }
            if (contents.addon_domains) {
                for (var domain in contents.addon_domains) {
                    domains.push({ 'domain': domain, 'subdomain': contents.addon_domains[domain] });
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
                        domains.push({ 'domain': name, 'subdomain': name });
                    }
                });
            }

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

    // check for standard log
    filename = path.join(CPANEL_PREFIX, domain);
    pathname = scanfile.getRootPathname(filename);
    fs.exists(pathname, function (yes) {
        if (yes) {
            files.push(new scanfile.ScanFile(filename, pathname, cannonical));
        }

        // check for secure log
        filename += '-ssl_log';
        pathname += '-ssl_log';
        fs.exists(pathname, function (yes) {
            if (yes) {
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
    if (userdomains === null) {
        var d = when.defer();
        userdomains = d.promise;
        var pathname = scanfile.getRootPathname(CPANEL_USERDOMAINS);
        fs.readFile(pathname, { encoding: 'utf8' }, (err, contents) => {
            if (err) {
                d.resolve('');
            } else {
                d.resolve(contents);
            }
        });
    }
    var deferred= when.defer();
    userdomains.then(function (contents) {
        var pattern = new RegExp('^' + domain + ': (.*)$', 'im');
        var find = pattern.exec(contents);
        if (find) {
            deferred.resolve(find[1]);
        } else {
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
    var d = when.defer();

    getDomainOwner(domain).then((username) => {
        if (username === null) {
            d.resolve(null);
        } else {
            const pathname = scanfile.getRootPathname(path.join(CPANEL_USERDATA_DIR, username, 'main'));

            loadAccountMain(username);

            mains[username].then((data) => {
                var contents=null;
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
            });
        }
    });
    return d.promise;
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
        return fs.existsSync(pathname);
    },

    /**
     *  Find all available log files for accounts and domains.
     *  @rtype promise for an Array of ScanFile.
     */
    findAllLogFiles : function () {
        const deferred = when.defer();
        const promises = [];
        const accounts = getAllAccounts();

        accounts.then((list) => {
            list.forEach((account) => {
                promises.push(getAccountLogFiles(account));
            });
            when.all(promises).then((array) => {
                deferred.resolve(_.flatten(array));
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
        const promises = [];
        const deferred = when.defer();

        getSubdomainName(domain).then((subdomain) => {
            if (subdomain) {
                promises.push(getDomainLogFiles(subdomain, domain));
            }
            promises.push(getDomainLogFiles(domain, domain));

            when.all(promises).then((array) => {
                deferred.resolve(_.flatten(array));
            });
        });

        return deferred.promise;
    },

    /**
     *  Find the main (no vhost) log files.
     *  @rtype promise for an Array of ScanFile.
     */
    findMainLogFiles : function () {
        const pathname = scanfile.getRootPathname(CPANEL_MAIN_LOG);
        const d = when.defer();

        fs.exists(pathname, (yes) => {
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
        const pathname = scanfile.getRootPathname(CPANEL_PANEL_LOG);
        const d = when.defer();

        fs.exists(pathname, (yes) => {
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
        const months = getArchiveMonths(start, stop);
        const promises = [];
        const accounts = getAllAccounts();
        const deferred = when.defer();

        accounts.then((list) => {
            list.forEach((account) => {
                promises.push(getAccountArchiveFiles(account, months));
            });

            when.all(promises).then((array) => {
                deferred.resolve(_.flatten(array));
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
        const months = getArchiveMonths(start, stop);

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
        const d = when.defer();

        getDomainOwner(domain).then((account) => {
            if (!account) {
                d.resolve([]);
                return;
            }
            getSubdomainName(domain).then((subdomain) => {
                getAccountHomeDirectory(account).then((homedir) => {
                    const logsdir = path.join(homedir, 'logs');
                    const months = getArchiveMonths(start, stop);
                    const files = [];
                    fs.readdir(logsdir, (err, logfiles) => {
                        if (err) {
                            d.resolve([]);
                            return;
                        }
                        var filename, pathname;
                        months.forEach((month) => {
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
                d.resolve([ new scanfile.ScanFile(filename, pathname, 'file') ]);
            } else {
                fs.exists(filename, (yes) => {
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
                                d.resolve([ new scanfile.ScanFile(filename, pathname, 'directory') ]);
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

module.exports = cPanel;


