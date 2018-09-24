#!/usr/bin/env node
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2018 James Burlingame
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
const underscore = require('lodash');
const when = require('when');

/**
 *  Singleton panels interface class.
 */
const panels = module.exports = {
    /** Current panel. */
    panel : undefined,

    /** Does the current panel support Archives. */
    hasArchives : function () {
        return this.panel && this.panel.hasArchives;
    },

    /** Does the current panel support Accounts. */
    hasAccounts : function () {
        return this.panel && this.panel.hasAccounts;
    },

    /** Does current panel support Domains. */
    hasDomains : function () {
        return this.panel && this.panel.hasDomains;
    },

    /** Does the current panel have a Panel access log. */
    hasPanelLog : function () {
        return this.panel && this.panel.hasPanelLog;
    },

    /** Does the current panel have a default (main) access log. */
    hasMainLog : function () {
        return this.panel && this.panel.hasMainLog;
    },

    /** Load panel interfaces. */
    load : function() {
        const panelsDir = path.join(path.dirname(module.filename), 'panels');
        const contents = fs.readdirSync(panelsDir).sort();
        var panelModule;
        for (var n=0, length=contents.length; n < length; n++) {
            try {
                panelModule = require(path.join(panelsDir, contents[n]));
                if (panelModule.isActive()) {
                    this.panel = panelModule;
                }
            } catch(err) {
                // ignore
            }
            if (this.panel !== undefined) {
                return;
            }
        }
    },

    /**
     *  Find the log files based upon the options.
     *  @arg options object.
     *  @rtype promise for an array of ScanFiles.
     */
    findScanFiles : function(options) {
        const promises = [];
        const deferred = when.defer();

        const self = this;
        const doArchives = this.hasArchives() && options.archives && options.start && options.stop;
        if (options.domlogs && this.hasDomains()) {
            promises.push(this.panel.findAllLogFiles());
            if (doArchives) {
                promises.push(this.panel.findAllArchiveFiles(options.start, options.stop));
            }
        } else {
            if (options.accounts && panels.hasAccounts()) {
                options.accounts.forEach(function(account) {
                    promises.push(self.panel.findAccountLogFiles(account));
                    if (doArchives) {
                        promises.push(self.panel.findAccountArchiveFiles(account, options.start, options.stop));
                    }
                });
            }
            if (options.domains && panels.hasDomains()) {
                options.domains.forEach(function(domain) {
                    promises.push(self.panel.findDomainLogFiles(domain));
                    if (doArchives) {
                        promises.push(self.panel.findDomainArchiveFiles(domain, options.start, options.stop));
                    }
                });
            }
        }
        if (options.files && self.panel) {
            options.files.forEach(function(file) {
                promises.push(self.panel.findLogFile(file));
            });
        }
        if (options.directories && self.panel) {
            options.directories.forEach(function(dir) {
                promises.push(self.panel.findLogFilesInDirectory(dir));
            });
        }
        if (options.main && panels.hasMainLog()) {
            promises.push(self.panel.findMainLogFiles());
            if (doArchives) {
                promises.push(self.panel.findMainArchiveFiles(options.start, options.stop));
            }
        }
        if (options.panel && panels.hasPanelLog()) {
            promises.push(self.panel.findPanelLogFiles());
            if (doArchives) {
                promises.push(self.panel.findPanelArchiveFiles(options.start, options.stop));
            }
        }

        when.all(promises).then(function (array) {
            deferred.resolve(underscore.flatten(array));
        });

        return deferred.promise;
    },

    /**
     *  Clear the current panel interface.
     *  Used for testing.
     */
    clear : function () {
        this.panel = undefined;
    }
};

