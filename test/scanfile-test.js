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

buster.testCase("scanfile", {
    setUp: function () {
        this.s = scanfile;
    },
    
    "test getRootPathname()": function () {
        this.s.setRootDirectory('');
        assert.equals(this.s.getRootPathname('-'), '/dev/fd/0');
        assert.equals(this.s.getRootPathname('/dev/null'), '/dev/null');
        assert.equals(this.s.getRootPathname('/etc/passwd'), '/etc/passwd');
        assert.equals(this.s.getRootPathname('filename'), 'filename');

        this.s.setRootDirectory(testData.getDataDirectory());
        assert.equals(this.s.getRootPathname('-'), '/dev/fd/0');
        assert.equals(this.s.getRootPathname('filename'), 'filename');
        assert.equals('/dev/fd/0', this.s.getRootPathname('-'));
        assert.equals('filename', this.s.getRootPathname('filename'));
        var pathname = this.s.getRootPathname('/logs/samplx.org');
        assert.equals(pathname, path.join(testData.getDataDirectory(), '/logs/samplx.org'));
    },
    
    "test ScanFile(undefined, pathname, domain)": function () {
        this.s.setRootDirectory('');
        var file = new ScanFile(undefined, '/usr/local/apache/domlogs/samplx.org', 'samplx.org');
        
        assert.equals(file.filename, '/usr/local/apache/domlogs/samplx.org');
        assert.equals(file.pathname, '/usr/local/apache/domlogs/samplx.org');
        assert.equals(file.domain, 'samplx.org');
    },

    "test ScanFile(filename, undefined, domain)": function () {
        this.s.setRootDirectory(testData.getDataDirectory());
        var file = new ScanFile('/usr/local/apache/domlogs/samplx.org', undefined, 'samplx.org');
        
        assert.equals(file.filename, '/usr/local/apache/domlogs/samplx.org');
        assert.equals(file.pathname, path.join(testData.getDataDirectory(), '/usr/local/apache/domlogs/samplx.org'));
        assert.equals(file.domain, 'samplx.org');
    },

    "test ScanFile(undefined, undefined, domain)": function () {
        this.s.setRootDirectory(testData.getDataDirectory());
        
        assert.exception(function () {
            var file = new ScanFile(undefined, undefined, 'samplx.org');
        });
    },

    "test ScanFile('-', undefined, 'file')": function () {
        this.s.setRootDirectory('');
        var file = new ScanFile('-', undefined, 'file');
        
        assert.equals(file.filename, '-');
        assert.equals(file.pathname, '/dev/fd/0');
        assert.equals(file.domain, 'file');
    },

    "test ScanFile(undefined, '/dev/fd/0', 'file')": function () {
        this.s.setRootDirectory('');
        var file = new ScanFile(undefined, '/dev/fd/0', 'file');
        
        assert.equals(file.filename, '-');
        assert.equals(file.pathname, '/dev/fd/0');
        assert.equals(file.domain, 'file');
    },

    "test isCompressed('/dev/fd/0')": function () {
        this.s.setRootDirectory('');
        var file = new ScanFile(undefined, '/dev/fd/0', 'file');
        
        refute(file.isCompressed());
    },
    
    "test isCompressed('samplx.org-Apr-2012.gz')": function () {
        this.s.setRootDirectory('');
        var file = new ScanFile('samplx.org-Apr-2012.gz', undefined, 'samplx.org');
        
        assert(file.isCompressed());
    },
    
});


