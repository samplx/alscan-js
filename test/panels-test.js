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
var path = require("path");
var util = require("util");
var when = require("when");

var testData = require("alscan-test-data");

var scanfile = require("../lib/scanfile.js");
var ScanFile = scanfile.ScanFile;

var panels = require("../lib/panels.js");

buster.testRunner.timeout = 500;

buster.testCase("panels", {
    "empty" : {
        setUp: function () {
            scanfile.setRootDirectory(testData.getDataDirectory());
            panels.clear();
            this.p = panels;
        },
    
        "test hasArchives": function () {
            refute(this.p.hasArchives());
        },
        
        "test hasAccounts": function () {
            refute(this.p.hasAccounts());
        },
        
        "test hasDomains": function () {
            refute(this.p.hasDomains());
        },
        
        "test hasPanelLog": function () {
            refute(this.p.hasPanelLog());
        },
        
        "test hasMainLog": function () {
            refute(this.p.hasMainLog());
        },
        
        "test findScanFiles(domlogs)": function (done) {
            var options = {
                domlogs : true
            };
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                assert.isArray(results);
                assert.equals(results.length, 0);
                done();
            });
        },
        
        "test findScanFiles(files: ['/logs/samplx.org'])": function (done) {
            var options = {
                files : [ '/logs/samplx.org' ]
            };
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                assert.isArray(results);
                assert.equals(results.length, 0);
                done();
            });
        },
        
        "test findScanFiles(directories: ['/logs'])": function (done) {
            var options = {
                directories : [ '/logs' ]
            };
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                assert.isArray(results);
                assert.equals(results.length, 0);
                done();
            });
        },
        
    },
    
    "cPanel": {
        setUp: function () {
            scanfile.setRootDirectory(path.join(testData.getDataDirectory(), 'cpanel'));
            panels.clear();
            panels.load();
            this.p = panels;
        },
        
        "test hasArchives": function () {
            assert(this.p.hasArchives());
        },
        
        "test hasAccounts": function () {
            assert(this.p.hasAccounts());
        },
        
        "test hasDomains": function () {
            assert(this.p.hasDomains());
        },
        
        "test hasPanelLog": function () {
            assert(this.p.hasPanelLog());
        },
        
        "test hasMainLog": function () {
            assert(this.p.hasMainLog());
        },

        "test findScanFiles(domlogs)": function (done) {
            var options = {
                domlogs : true
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/pub.samplx.org", domain: "pub.samplx.org" },
                    { file : "/usr/local/apache/domlogs/alscan-org.druiddesigns.com", domain: "alscan.org" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/ddinfo.druiddesigns.com", domain: "druiddesigns.info" },
                    { file : "/usr/local/apache/domlogs/ddnet.druiddesigns.com", domain: "druiddesigns.net" },
                    { file : "/usr/local/apache/domlogs/ddorg.druiddesigns.com", domain: "druiddesigns.org" },
                    { file : "/usr/local/apache/domlogs/isinfo.druiddesigns.com", domain: "issnap.info" },
                    { file : "/usr/local/apache/domlogs/isorg.druiddesigns.com", domain: "issnap.org" },
                    { file : "/usr/local/apache/domlogs/z80cim.druiddesigns.com", domain: "z80cim.org" },
                    { file : "/usr/local/apache/domlogs/redmine.druiddesigns.com", domain: "redmine.samplx.org" },
                    { file : "/usr/local/apache/domlogs/alscan.info", domain: "alscan.info" },
                    { file : "/usr/local/apache/domlogs/dst.alscan.info", domain: "dst.alscan.info" },
                    { file : "/usr/local/apache/domlogs/addon.alscan.info", domain: "addon.us" },
                    { file : "/usr/local/apache/domlogs/bandwidth.alscan.info", domain: "bandwidth.net" },
                    { file : "/usr/local/apache/domlogs/days.alscan.info", domain: "days.info" },
                    { file : "/usr/local/apache/domlogs/minutes.alscan.info", domain: "minutes.info" },
                    { file : "/usr/local/apache/domlogs/seconds.alscan.info", domain: "seconds.info" },
            ];
            var promise = this.p.findScanFiles(options);
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
        
        "test findScanFiles(accounts)": function (done) {
            var options = {
                accounts : ['samplx', 'druid']
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/pub.samplx.org", domain: "pub.samplx.org" },
                    { file : "/usr/local/apache/domlogs/alscan-org.druiddesigns.com", domain: "alscan.org" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/ddinfo.druiddesigns.com", domain: "druiddesigns.info" },
                    { file : "/usr/local/apache/domlogs/ddnet.druiddesigns.com", domain: "druiddesigns.net" },
                    { file : "/usr/local/apache/domlogs/ddorg.druiddesigns.com", domain: "druiddesigns.org" },
                    { file : "/usr/local/apache/domlogs/isinfo.druiddesigns.com", domain: "issnap.info" },
                    { file : "/usr/local/apache/domlogs/isorg.druiddesigns.com", domain: "issnap.org" },
                    { file : "/usr/local/apache/domlogs/z80cim.druiddesigns.com", domain: "z80cim.org" },
                    { file : "/usr/local/apache/domlogs/redmine.druiddesigns.com", domain: "redmine.samplx.org" },
            ];
            var promise = this.p.findScanFiles(options);
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

        "test findScanFiles(domains)": function (done) {
            var options = {
                domains : ['samplx.org', 'druiddesigns.com']
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
            ];
            var promise = this.p.findScanFiles(options);
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

        "test findScanFiles(domains+main)": function (done) {
            var options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                main : true
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/logs/access_log", domain: "main" },
            ];
            var promise = this.p.findScanFiles(options);
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

        "test findScanFiles(domains+panel)": function (done) {
            var options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                panel : true
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
                    { file : "/usr/local/cpanel/logs/access_log", domain: "panel" },
            ];
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                // console.log("got results"); console.dir(results);
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
                    refute.less(index, 0, "Expected to find file:" + file.filename);
                    assert.equals(file.domain, expected[index].domain);
                });
                for (var n=0; n < expected.length; n++) {
                    assert(expected[n].found);
                }
                done();
            });
        },

        "test findScanFiles(domains+archives)": function (done) {
            var options = {
                domains : ['samplx.org', 'druiddesigns.com'],
                archives : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
                    { file : "/home1/druid/logs/druiddesigns.com-Sep-2013.gz", domain: "druiddesigns.com" },
                    { file : "/home1/druid/logs/druiddesigns.com-Oct-2013.gz", domain: "druiddesigns.com" },
                    { file : "/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz", domain: "druiddesigns.com" },
                    { file : "/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz", domain: "druiddesigns.com" },
            ];
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                // console.log("got results"); console.dir(results);
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
                    refute.less(index, 0, "Expected to find file:" + file.filename);
                    assert.equals(file.domain, expected[index].domain);
                });
                for (var n=0; n < expected.length; n++) {
                    assert(expected[n].found);
                }
                done();
            });
        },

        "test findScanFiles(account+archives)": function (done) {
            var options = {
                accounts : ['samplx'],
                archives : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 9, 21, 23, 59, 59, 0)
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/pub.samplx.org", domain: "pub.samplx.org" },
            ];
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                // console.log("got results"); console.dir(results);
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
                    refute.less(index, 0, "Expected to find file:" + file.filename);
                    assert.equals(file.domain, expected[index].domain);
                });
                for (var n=0; n < expected.length; n++) {
                    assert(expected[n].found);
                }
                done();
            });
        },

        "test findScanFiles(domlogs+archives)": function (done) {
            var options = {
                domlogs : true,
                archives : true,
                start : new Date(2013, 8, 12, 0, 0, 0, 0),
                stop : new Date(2013, 8, 21, 23, 59, 59, 0)
            };
            var expected = [ 
                    { file : "/usr/local/apache/domlogs/samplx.org", domain: "samplx.org" },
                    { file : "/usr/local/apache/domlogs/pub.samplx.org", domain: "pub.samplx.org" },
                    { file : "/usr/local/apache/domlogs/alscan-org.druiddesigns.com", domain: "alscan.org" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
                    { file : "/usr/local/apache/domlogs/ddinfo.druiddesigns.com", domain: "druiddesigns.info" },
                    { file : "/usr/local/apache/domlogs/ddnet.druiddesigns.com", domain: "druiddesigns.net" },
                    { file : "/usr/local/apache/domlogs/ddorg.druiddesigns.com", domain: "druiddesigns.org" },
                    { file : "/usr/local/apache/domlogs/isinfo.druiddesigns.com", domain: "issnap.info" },
                    { file : "/usr/local/apache/domlogs/isorg.druiddesigns.com", domain: "issnap.org" },
                    { file : "/usr/local/apache/domlogs/z80cim.druiddesigns.com", domain: "z80cim.org" },
                    { file : "/usr/local/apache/domlogs/redmine.druiddesigns.com", domain: "redmine.samplx.org" },
                    { file : "/usr/local/apache/domlogs/alscan.info", domain: "alscan.info" },
                    { file : "/usr/local/apache/domlogs/dst.alscan.info", domain: "dst.alscan.info" },
                    { file : "/usr/local/apache/domlogs/addon.alscan.info", domain: "addon.us" },
                    { file : "/usr/local/apache/domlogs/bandwidth.alscan.info", domain: "bandwidth.net" },
                    { file : "/usr/local/apache/domlogs/days.alscan.info", domain: "days.info" },
                    { file : "/usr/local/apache/domlogs/minutes.alscan.info", domain: "minutes.info" },
                    { file : "/usr/local/apache/domlogs/seconds.alscan.info", domain: "seconds.info" },
                    { file : "/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz", domain: "alscan.org" },
                    { file : "/home1/druid/logs/druiddesigns.com-Sep-2013.gz", domain: "druiddesigns.com" },
                    { file : "/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz", domain: "druiddesigns.com" },
                    { file : "/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz", domain: "druiddesigns.info" },
                    { file : "/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz", domain: "druiddesigns.net" },
                    { file : "/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz", domain: "druiddesigns.org" },
                    { file : "/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz", domain: "issnap.info" },
                    { file : "/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz", domain: "issnap.org" },
                    { file : "/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz", domain: "z80cim.org" },
                    { file : "/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz", domain: "redmine.samplx.org" }
            ];
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                // console.log("got results"); console.dir(results);
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
                    refute.less(index, 0, "Expected to find file:" + file.filename);
                    assert.equals(file.domain, expected[index].domain);
                });
                for (var n=0; n < expected.length; n++) {
                    assert(expected[n].found);
                }
                done();
            });
        },

        "test findScanFiles(files: ['/logs/samplx.org'])": function (done) {
            var options = {
                files : [ '/logs/samplx.org' ]
            };
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                assert.isArray(results);
                assert.equals(results.length, 0);
                done();
            });
        },
        
        "test findScanFiles(directories: ['/logs'])": function (done) {
            var options = {
                directories : [ '/logs' ]
            };
            var promise = this.p.findScanFiles(options);
            assert(when.isPromiseLike(promise));
            promise.then(function (results) {
                assert.isArray(results);
                assert.equals(results.length, 0);
                done();
            });
        },
    },
});


