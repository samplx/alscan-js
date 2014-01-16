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
var fs = require("fs");
var path = require("path");
var util = require("util");

var rootDir = process.env.ALSCAN_TESTING_ROOTDIR || '';

/**
 *  Set the root directory prefix (for testing.)
 *  @param dir new root directory.
 */
function setRootDirectory(dir) {
    rootDir = dir;
}

/**
 *  Return a pathname prefixed with the rootDir (used for testing).
 *  @param filename to resolve.
 *  @rtype String.
 */
function getRootPathname(filename) {
    if (filename == '-') {
        return '/dev/fd/0';
    }
    if (filename[0] == path.sep) {
        return path.normalize(path.join(rootDir, filename));
    }
    return path.normalize(filename);
}

/**
 *  @ctor ScanFile constructor.
 *  Either filename or pathname must be defined.
 *  @param filename of file.
 *  @param pathname rootDir based full pathname.
 *  @param domain associated with the file.
 */
function ScanFile(filename, pathname, domain) {
    if (!(this instanceof ScanFile)) {
        return new ScanFile(filename, pathname, domain);
    }
    if (filename) {
        this.filename = filename;
        if (pathname) {
            this.pathname = pathname;
        } else {
            this.pathname = getRootPathname(filename);
        }
    } else if (pathname) {
        this.pathname = pathname;
        if ((rootDir.length !== 0) && (pathname.substr(0, rootDir.length) == rootDir)) {
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

/**
 *  Determine if the file is compressed.
 *  @rtype Boolean.
 */
ScanFile.prototype.isCompressed = function () {
    return (this.pathname.substr(-3) == '.gz');
};

/** Export the ScanFile object. */
exports.ScanFile = ScanFile;
/** Export the getRootPathname function. */
exports.getRootPathname = getRootPathname;
/** Export the setRootDirectory function. */
exports.setRootDirectory = setRootDirectory;

