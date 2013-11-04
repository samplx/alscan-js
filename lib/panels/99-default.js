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
var fs = require("fs");
var path = require("path");
var scanfile = require("./../scanfile.js");
var underscore = require("underscore");
var util = require("util");
var when = require("when");

/**
 *  Default interface to use when no recognized panel is found.
 */
var defaultPanel = {
    /** Identifier of the panel interface. */
    id : 'default',

    /** Does this panel support --accounts option. */
    hasAccounts : false,
    
    /** Does this panel support --archives option. */
    hasArchives : false,
    
    /** Does this panel support --domains option. */
    hasDomains : false,
    
    /** Does this panel support --panel option. */
    hasPanelLog : false,
    
    /** Does this panel support --main option. */
    hasMainLog : false,

    /**
      * Deterine if the panel is installed.
      * @rtype Boolean. Always true.
      */
    isActive : function() {
        return true;
    },
    
    /**
     *  Find all available log files.
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findAllLogFiles : function () {
        return when([]);
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
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findDomainLogFiles : function (domain) {
        return when([]);
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
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findAllArchiveFiles : function (start, stop) {
        return when([]);
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
     *  @rtype promise for an (empty) Array of ScanFile.
     */
    findDomainArchiveFiles : function (domain, start, stop) {
        return when([]);
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
     *  @rtype promise to Array of ScanFile.
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
                files.forEach(function (file) {
                    var d = when.defer();
                    promises.push(d.promise);
                    var pathname= path.join(dirpath, file);
                    var filename= path.join(dir, file);
                    fs.stat(pathname, function (err, stats) {
                        if (!err && stats.isFile()) {
                            d.resolve([ new scanfile.ScanFile(filename, pathname, 'directory') ]);
                        } else {
                            d.resolve([]);
                        }
                    });
                });
                when.all(promises).then(function (array) {
                    deferred.resolve(underscore.flatten(array));
                });
            }
        });

        return deferred.promise;
    }
};

module.exports = defaultPanel;


