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
var util = require("util");

var rootDir = process.env.ALSCAN_TESTING_ROOTDIR || '';

// set the root directory prefix (for testing)
function setRootDirectory(dir) {
    rootDir = dir;
}

// return a pathname prefixed with the rootDir (used for testing).
function getRootPathname(filename) {
    if (filename == '-') {
        return '/dev/fd/0';
    }
    if (filename[0] == path.sep) {
        return path.normalize(path.join(rootDir, filename));
    }
    return path.normalize(filename);
}

// ScanFile constructor.
// either filename or pathname must be defined.
function ScanFile(filename, pathname, domain) {
    if (!(this instanceof ScanFile)) {
        return new ScanFile(filename, pathname, domain);
    }
//    console.log("ScanFile(filename="+filename+", pathname="+pathname+", domain="+domain+")");
    if (filename) {
        this.filename = filename;
        if (pathname) {
            this.pathname = pathname;
        } else {
            this.pathname = getRootPathname(filename);
        }
    } else if (pathname) {
        this.pathname = pathname;
        if ((rootDir.length != 0) && (pathname.substr(0, rootDir.length) == rootDir)) {
            this.filename = pathname.slice(rootDir.length);
        } else if (pathname == '/dev/fd/0') {
            this.filename = '-';
        } else {
            this.filename = pathname;
        }
    } else {
        throw new Error("Either filename or pathname must be defined.");
    }
    this.domain  = domain;
}

ScanFile.prototype.isCompressed = function () {
    return (this.pathname.substr(-3) == '.gz');
}

exports.ScanFile = ScanFile;
exports.getRootPathname = getRootPathname;
exports.setRootDirectory = setRootDirectory;

