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
var buster = require("buster");
var assert = buster.assert;
var refute = buster.refute;
var util = require("util");
var when = require("when");
var path = require("path");

var testData = require("alscan-test-data");

var scanfile = require("../lib/scanfile.js");
var ScanFile = scanfile.ScanFile;

var defaultPanel = require("../lib/panels/99-default.js");

//buster.testRunner.timeout = 500;

buster.testCase("defaultPanel", {
    setUp: function () {
        scanfile.setRootDirectory(testData.getDataDirectory());
        
        this.c = defaultPanel;
    },

    "test interface id": function () {
        assert.equals(this.c.id, 'default');
    },
    
    "test hasAccounts": function () {
        refute(this.c.hasAccounts);
    },
    
    "test hasArchives": function () {
        refute(this.c.hasArchives);
    },
    
    "test hasDomains": function () {
        refute(this.c.hasDomains);
    },
    
    "test hasPanelLog": function () {
        refute(this.c.hasPanelLog);
    },
    
    "test hasMainLog": function () {
        refute(this.c.hasMainLog);
    },

    "test isActive()": function () {
        assert(this.c.isActive());
    },

    "test findDomainLogFiles": function (done) {
        var promise = this.c.findDomainLogFiles('druiddesigns.com');
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },
    
    "test findMainLogFiles": function (done) {
        var promise = this.c.findMainLogFiles();
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },
    
    "test findAccountLogFiles('samplx')": function (done) {
        var promise = this.c.findAccountLogFiles('samplx');
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findAllLogFiles()": function (done) {
        var promise = this.c.findAllLogFiles();
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findPanelArchiveFiles()": function (done) {
        var start = new Date(2001, 0, 1);
        var stop  = new Date();
        var promise = this.c.findPanelArchiveFiles(start, stop);
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findMainArchiveFiles()": function (done) {
        var start = new Date(2001, 0, 1);
        var stop  = new Date();
        var promise = this.c.findMainArchiveFiles(start, stop);
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findDomainArchiveFiles('druiddesigns.com', '2013/08/12', '2013/09/21')": function (done) {
        var start = new Date(2013, 8, 12, 0, 0, 0, 0);
        var stop = new Date(2013, 9, 21, 23, 59, 59, 0);
        var promise = this.c.findDomainArchiveFiles('druiddesigns.com', start, stop);
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    
    "test findAccountArchiveFiles('druid', '2013/09/12', '2013/09/21')": function (done) {
        var start = new Date(2013, 8, 12, 0, 0, 0, 0);
        var stop = new Date(2013, 8, 21, 23, 59, 59, 0);
        var promise = this.c.findAccountArchiveFiles('druid', start, stop);
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findAllArchiveFiles('2013/09/12', '2013/09/21')": function (done) {
        var start = new Date(2013, 8, 12, 0, 0, 0, 0);
        var stop = new Date(2013, 8, 21, 23, 59, 59, 0);
        var promise = this.c.findAllArchiveFiles(start, stop);
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },
    
    "test findLogFile('/logs/samplx.org')": function (done) {
        var promise = this.c.findLogFile('/logs/samplx.org');
        var expected = [ 
                { file : "/logs/samplx.org", domain: "file" },
        ];
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            results.forEach(function (file) {
                assert(file instanceof ScanFile);
                var index = -1;
                for (var n=0; n < expected.length; n++) {
                    if (expected[n].file == file.filename) {
                        index = n;
                        expected[n].found = true;
                        break;
                    }
                }
                refute.less(index, 0);
                assert.equals(file.domain, expected[index].domain);
            });
            for (var n=0; n < expected.length; n++) {
                assert(expected[n].found);
            }
            done();
        });
    },
    
    "test findLogFile(ROOT+'/logs/samplx.org')": function (done) {
        var pathname = scanfile.getRootPathname('/logs/samplx.org');
        var promise = this.c.findLogFile(pathname);
        var expected = [ 
                { file : pathname, domain: "file" },
        ];
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            results.forEach(function (file) {
                assert(file instanceof ScanFile);
                var index = -1;
                for (var n=0; n < expected.length; n++) {
                    if (expected[n].file == file.filename) {
                        index = n;
                        expected[n].found = true;
                        break;
                    }
                }
                refute.less(index, 0);
                assert.equals(file.domain, expected[index].domain);
            });
            for (var n=0; n < expected.length; n++) {
                assert(expected[n].found);
            }
            done();
        });
    },
    
    "test findLogFile('-')": function (done) {
        var promise = this.c.findLogFile('-');
        var expected = [ 
                { file : '-', domain: "file" },
        ];
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            results.forEach(function (file) {
                assert(file instanceof ScanFile);
                var index = -1;
                for (var n=0; n < expected.length; n++) {
                    if (expected[n].file == file.filename) {
                        index = n;
                        expected[n].found = true;
                        break;
                    }
                }
                refute.less(index, 0);
                assert.equals(file.domain, expected[index].domain);
            });
            for (var n=0; n < expected.length; n++) {
                assert(expected[n].found);
            }
            done();
        });
    },

    "test findLogFile('nonesuch')": function (done) {
        var promise = this.c.findLogFile('nonesuch');
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findLogFilesInDirectory('/logs')": function (done) {
        var promise = this.c.findLogFilesInDirectory('/logs');
        var expected = [ 
                { file : "/logs/alscan.info", domain : "directory" },
                { file : "/logs/alscan-org.druiddesigns.com", domain : "directory" },
                { file : "/logs/cpanel-access_log", domain : "directory" },
                { file : "/logs/ddinfo.druiddesigns.com", domain : "directory" },
                { file : "/logs/ddnet.druiddesigns.com", domain : "directory" },
                { file : "/logs/ddorg.druiddesigns.com", domain : "directory" },
                { file : "/logs/druiddesigns.com", domain : "directory" },
                { file : "/logs/druiddesigns.com-ssl_log", domain : "directory" },
                { file : "/logs/ftp.druiddesigns.com-ftp_log", domain : "directory" },
                { file : "/logs/isinfo.druiddesigns.com", domain : "directory" },
                { file : "/logs/isorg.druiddesigns.com", domain : "directory" },
                { file : "/logs/main-access_log", domain : "directory" },
                { file : "/logs/pub.samplx.org", domain : "directory" },
                { file : "/logs/redmine.druiddesigns.com", domain : "directory" },
                { file : "/logs/samplx.org", domain : "directory" },
                { file : "/logs/z80cim.druiddesigns.com", domain : "directory" },
            ];
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            results.forEach(function (file) {
                assert(file instanceof ScanFile);
                var index = -1;
                for (var n=0; n < expected.length; n++) {
                    if (expected[n].file == file.filename) {
                        index = n;
                        expected[n].found = true;
                        break;
                    }
                }
                refute.less(index, 0);
                assert.equals(file.domain, expected[index].domain);
            });
            for (var n=0; n < expected.length; n++) {
                assert(expected[n].found, "Result not found:" + expected[n].file);
            }
            done();
        });
    },

    "test findLogFilesInDirectory('nonesuch')": function (done) {
        var promise = this.c.findLogFilesInDirectory('nonesuch');
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

});

