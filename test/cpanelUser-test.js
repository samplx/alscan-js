#!/usr/bin/env node
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014 James Burlingame
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

var cpanelUser = require("../lib/panels/60-cpanelUser.js");

//buster.testRunner.timeout = 500;

buster.testCase("cpanelUser", {
    setUp: function () {
        var pathname = path.join(testData.getDataDirectory(), 'cpanel');
        scanfile.setRootDirectory(pathname);
        process.env.ALSCAN_TESTING_HOME = '/home1/druid';
        
        this.c = cpanelUser;
    },

    "test interface id": function () {
        assert.equals(this.c.id, 'cPanelUser');
    },
    
    "test hasAccounts": function () {
        refute(this.c.hasAccounts);
    },
    
    "test hasArchives": function () {
        assert(this.c.hasArchives);
    },
    
    "test hasDomains": function () {
        assert(this.c.hasDomains);
    },
    
    "test hasPanelLog": function () {
        refute(this.c.hasPanelLog);
    },
    
    "test hasMainLog": function () {
        refute(this.c.hasMainLog);
    },

    "test isActive() missing /usr/local/cpanel/version file": function () {
        scanfile.setRootDirectory(testData.getDataDirectory());
        
        refute(this.c.isActive());
    },
    
    "test isActive()": function () {
        assert(this.c.isActive());
    },

    "test findDomainLogFiles, primary domain, with SSL": function (done) {
        var promise = this.c.findDomainLogFiles('druiddesigns.com');
        var expected = [ { file: "/home1/druid/access-logs/druiddesigns.com", domain: "druiddesigns.com" },
                         { file: "/home1/druid/access-logs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" } ];
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

    "test findDomainLogFiles, addon domain": function (done) {
        var promise = this.c.findDomainLogFiles('alscan-org.druiddesigns.com');
        var expected = [ 
            { file: "/home1/druid/access-logs/alscan-org.druiddesigns.com", domain: "alscan-org.druiddesigns.com" }
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
    
    "test findDomainLogFiles, subdomain": function (done) {
        var promise = this.c.findDomainLogFiles('redmine.druiddesigns.com');
        var expected = [ { file: "/home1/druid/access-logs/redmine.druiddesigns.com", domain: "redmine.druiddesigns.com" } ];
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
    
    "test findDomainLogFiles, nonexistant domain": function (done) {
        var promise = this.c.findDomainLogFiles('nonesuch.info');
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },
    
    "test findPanelLogFiles": function (done) {
        var promise = this.c.findPanelLogFiles();
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
        var expected = [ 
                { file : "/home1/druid/access-logs/alscan-org.druiddesigns.com", domain: "alscan-org.druiddesigns.com" },
                { file : "/home1/druid/access-logs/druiddesigns.com", domain: "druiddesigns.com" },
                { file : "/home1/druid/access-logs/druiddesigns.com-ssl_log", domain: "druiddesigns.com" },
                { file : "/home1/druid/access-logs/ddinfo.druiddesigns.com", domain: "ddinfo.druiddesigns.com" },
                { file : "/home1/druid/access-logs/ddnet.druiddesigns.com", domain: "ddnet.druiddesigns.com" },
                { file : "/home1/druid/access-logs/ddorg.druiddesigns.com", domain: "ddorg.druiddesigns.com" },
                { file : "/home1/druid/access-logs/isinfo.druiddesigns.com", domain: "isinfo.druiddesigns.com" },
                { file : "/home1/druid/access-logs/isorg.druiddesigns.com", domain: "isorg.druiddesigns.com" },
                { file : "/home1/druid/access-logs/z80cim.druiddesigns.com", domain: "z80cim.druiddesigns.com" },
                { file : "/home1/druid/access-logs/redmine.druiddesigns.com", domain: "redmine.druiddesigns.com" },
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
        var expected = [ 
                { file : "/home1/druid/logs/druiddesigns.com-Sep-2013.gz", domain: "druiddesigns.com" },
                { file : "/home1/druid/logs/druiddesigns.com-Oct-2013.gz", domain: "druiddesigns.com" },
                { file : "/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz", domain: "druiddesigns.com" },
                { file : "/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz", domain: "druiddesigns.com" },
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

    "test findDomainArchiveFiles('nonesuch.info')": function (done) {
        var start = new Date(2001, 0, 1);
        var stop  = new Date();
        var promise = this.c.findDomainArchiveFiles('nonesuch.info', start, stop);
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
            assert.isArray(results);
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findDomainArchiveFiles('druiddesigns.com', '2001/01/01', '2001/12/31')": function (done) {
        var start = new Date(2001, 0, 1);
        var stop  = new Date(2001, 11, 31);
        var promise = this.c.findDomainArchiveFiles('druiddesigns.com', start, stop);
        assert(when.isPromiseLike(promise));
        promise.then(function (results) {
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
            assert.equals(results.length, 0);
            done();
        });
    },

    "test findAllArchiveFiles('2013/09/12', '2013/09/21')": function (done) {
        var start = new Date(2013, 8, 12, 0, 0, 0, 0);
        var stop = new Date(2013, 8, 21, 23, 59, 59, 0);
        var promise = this.c.findAllArchiveFiles(start, stop);
        var expected = [ 
                { file : "/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz", domain: "alscan-org.druiddesigns.com" },
                { file : "/home1/druid/logs/druiddesigns.com-Sep-2013.gz", domain: "druiddesigns.com" },
                { file : "/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz", domain: "druiddesigns.com" },
                { file : "/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz", domain: "ddinfo.druiddesigns.com" },
                { file : "/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz", domain: "ddnet.druiddesigns.com" },
                { file : "/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz", domain: "ddorg.druiddesigns.com" },
                { file : "/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz", domain: "isinfo.druiddesigns.com" },
                { file : "/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz", domain: "isorg.druiddesigns.com" },
                { file : "/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz", domain: "z80cim.druiddesigns.com" },
                { file : "/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz", domain: "redmine.druiddesigns.com" }
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
    
    "test findLogFile('/usr/local/apache/domlogs/samplx.org')": function (done) {
        var promise = this.c.findLogFile('/usr/local/apache/domlogs/samplx.org');
        var expected = [ 
                { file : "/usr/local/apache/domlogs/samplx.org", domain: "file" },
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
    
    "test findLogFile(ROOT+'/usr/local/apache/domlogs/samplx.org')": function (done) {
        var pathname = scanfile.getRootPathname('/usr/local/apache/domlogs/samplx.org');
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

    "test findLogFilesInDirectory('/usr/local/apache/domlogs')": function (done) {
        var promise = this.c.findLogFilesInDirectory('/usr/local/apache/domlogs');
        var expected = [ 
                { file : "/usr/local/apache/domlogs/samplx.org", domain: "directory" },
                { file : "/usr/local/apache/domlogs/pub.samplx.org", domain: "directory" },
                { file : "/usr/local/apache/domlogs/alscan-org.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/druiddesigns.com-ssl_log", domain: "directory" },
                { file : "/usr/local/apache/domlogs/ddinfo.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/ddnet.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/ddorg.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/isinfo.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/isorg.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/z80cim.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/redmine.druiddesigns.com", domain: "directory" },
                { file : "/usr/local/apache/domlogs/alscan.info", domain: "directory" },
                { file : "/usr/local/apache/domlogs/dst.alscan.info", domain: "directory" },
                { file : "/usr/local/apache/domlogs/addon.alscan.info", domain: "directory" },
                { file : "/usr/local/apache/domlogs/bandwidth.alscan.info", domain: "directory" },
                { file : "/usr/local/apache/domlogs/days.alscan.info", domain: "directory" },
                { file : "/usr/local/apache/domlogs/minutes.alscan.info", domain: "directory" },
                { file : "/usr/local/apache/domlogs/seconds.alscan.info", domain: "directory" },
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

    "test findLogFilesInDirectory('/home1/druid/logs')": function (done) {
        var promise = this.c.findLogFilesInDirectory('/home1/druid/logs');
        var expected = [ 
                { file: "/home1/druid/logs/alscan-org.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/alscan-org.druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddinfo.druiddesigns.com-Aug-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddinfo.druiddesigns.com-Jul-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddinfo.druiddesigns.com-Jun-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddinfo.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddinfo.druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Apr-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Aug-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Feb-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Jan-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Jul-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Jun-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Mar-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-May-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddnet.druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddorg.druiddesigns.com-Aug-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddorg.druiddesigns.com-Jul-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddorg.druiddesigns.com-Jun-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddorg.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/ddorg.druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Apr-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Aug-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Feb-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Jan-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Jul-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Jun-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Mar-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-May-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Apr-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Aug-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Feb-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Jan-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Jul-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Jun-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Mar-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-May-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/druiddesigns.com-ssl_log-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Apr-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Aug-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Feb-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Jan-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Jul-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Jun-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Mar-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-May-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isinfo.druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Apr-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Aug-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Feb-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Jan-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Jul-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Jun-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Mar-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-May-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/isorg.druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/redmine.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/redmine.druiddesigns.com-Sep-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/z80cim.druiddesigns.com-Oct-2013.gz", domain: "directory" },
                { file: "/home1/druid/logs/z80cim.druiddesigns.com-Sep-2013.gz", domain: "directory" }        
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

