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
var path = require("path");
var util = require("util");
var when = require("when");

var testData = require("alscan-test-data");

var scanfile = require("../lib/scanfile.js");
var ScanFile = scanfile.ScanFile;

var reporter = require("../lib/reporter.js");
var Reporter = reporter.Reporter;

buster.testCase("reporter", {
    setUp: function () {
        this.r = new Reporter();
    },
    
    "test padZero": function () {
        assert.equals('01', this.r.padZero(1, 2));
        assert.equals('00', this.r.padZero(0, 2));
        assert.equals('100', this.r.padZero(100, 2));
        assert.equals('0x', this.r.padZero('x', 2));
    },
    
    "test padField": function() {
        assert.equals(' x', this.r.padField('x', 2));
        assert.equals('xxx', this.r.padField('xxx', 2));
        assert.equals('xx', this.r.padField('xx', 2));
    },
    
    "test padFieldRight": function () {
        assert.equals('x ', this.r.padFieldRight('x', 2));
        assert.equals('xxx', this.r.padFieldRight('xxx', 2));
        assert.equals('xx', this.r.padFieldRight('xx', 2));
    },
    
    "test getTimestamp": function () {
        //            0         1         2         3         
        //            0123456789012345678901234567890123456789
        // timeString=Fri Jan 01 2010 06:34:56 GMT-0600 (CST)
        // timestamp =01/Jan/2010:06:34:56 -0600

        var time;
        var timeString;
        var timestamp;
        var month;
        var day;
        for (month=0; month < 12; month++) {
            day = 1;
            time = new Date(Date.UTC(2010, month, day, 12, 34, 56, 0));
            timeString = time.toString();
            timestamp = this.r.getTimestamp(time);
            assert.equals(timestamp.substr(0, 2), timeString.substr(8, 2));
            assert.equals(timestamp.substr(2, 1), '/');
            assert.equals(timestamp.substr(3, 3), timeString.substr(4, 3));
            assert.equals(timestamp.substr(6, 1), '/');
            assert.equals(timestamp.substr(7, 4), timeString.substr(11, 4));
            assert.equals(timestamp.substr(11, 1), ':');
            assert.equals(timestamp.substr(12, 2), timeString.substr(16, 2));
            assert.equals(timestamp.substr(14, 1), ':');
            assert.equals(timestamp.substr(15, 2), timeString.substr(19, 2));
            assert.equals(timestamp.substr(17, 1), ':');
            assert.equals(timestamp.substr(18, 2), timeString.substr(22, 2));
            assert.equals(timestamp.substr(20, 1), ' ');
            assert.equals(timestamp.substr(21, 5), timeString.substr(28, 5));
            day = 10;
            time = new Date(Date.UTC(2010, month, day, 12, 34, 56, 0));
            time = new Date(Date.UTC(2010, month, day, 12, 34, 56, 0));
            timeString = time.toString();
            timestamp = this.r.getTimestamp(time);
            assert.equals(timestamp.substr(0, 2), timeString.substr(8, 2));
            assert.equals(timestamp.substr(2, 1), '/');
            assert.equals(timestamp.substr(3, 3), timeString.substr(4, 3));
            assert.equals(timestamp.substr(6, 1), '/');
            assert.equals(timestamp.substr(7, 4), timeString.substr(11, 4));
            assert.equals(timestamp.substr(11, 1), ':');
            assert.equals(timestamp.substr(12, 2), timeString.substr(16, 2));
            assert.equals(timestamp.substr(14, 1), ':');
            assert.equals(timestamp.substr(15, 2), timeString.substr(19, 2));
            assert.equals(timestamp.substr(17, 1), ':');
            assert.equals(timestamp.substr(18, 2), timeString.substr(22, 2));
            assert.equals(timestamp.substr(20, 1), ' ');
            assert.equals(timestamp.substr(21, 5), timeString.substr(28, 5));
        }
    },

    "test getBytesString() length": function () {
        var nBytes = 1;
        var s;
        while (nBytes < 1e21) {
            s = this.r.getBytesString(nBytes);
//            console.log('bytesString=' + s + ', nBytes=' + nBytes + ', length=' + s.length);
            assert.equals(s.length, 10);
            nBytes *= 2;
        }
    },
    
    "test getBPS() length": function () {
        var nBytes = 1;
        var elapsed = 1;
        var s;
        while (nBytes < 5e22) {
            s = this.r.getBPS(nBytes, elapsed);
//            console.log('BPS=' + s + ', nBytes=' + nBytes + ', elapsed=' + elapsed + ', length=' + s.length);
//            assert(true);
            assert.equals(s.length, 11);
            nBytes *= 2;
            elapsed += 1;
        }
    },
    
    "test getTimestampHeader() timezones and dates all match": function () {
        var start = new Date(2001, 0, 2, 6, 0, 0);
        var first = new Date(2001, 0, 2, 7, 0, 0);
        var last  = new Date(2001, 0, 2, 8, 0, 0);
        var stop  = new Date(2001, 0, 2, 9, 0, 0);
        var title = 'title';
        var header = this.r.getTimestampHeader(start, first, last, stop, title);
        assert.equals(header.length, 66);
    },
    
    "test getTimestampHeader() timezones and start/first dates match": function () {
        var start = new Date(2001, 0, 2, 6, 0, 0);
        var first = new Date(2001, 0, 2, 7, 0, 0);
        var last  = new Date(2001, 0, 3, 8, 0, 0);
        var stop  = new Date(2001, 0, 4, 9, 0, 0);
        var title = 'title';
        var header = this.r.getTimestampHeader(start, first, last, stop, title);
        assert.equals(header.length, 90);
    },
    
    "test getTimestampHeader() timezones and last/stop dates match": function () {
        var start = new Date(2001, 0, 2, 6, 0, 0);
        var first = new Date(2001, 0, 3, 7, 0, 0);
        var last  = new Date(2001, 0, 4, 8, 0, 0);
        var stop  = new Date(2001, 0, 4, 9, 0, 0);
        var title = 'title';
        var header = this.r.getTimestampHeader(start, first, last, stop, title);
        assert.equals(header.length, 90);
    },
    
    "test getTimestampHeader() timezones match, no dates": function () {
        var start = new Date(2001, 0, 2, 6, 0, 0);
        var first = new Date(2001, 0, 3, 7, 0, 0);
        var last  = new Date(2001, 0, 4, 8, 0, 0);
        var stop  = new Date(2001, 0, 5, 9, 0, 0);
        var title = 'title';
        var header = this.r.getTimestampHeader(start, first, last, stop, title);
        assert.equals(header.length, 102);
    },
    
    "test getTimestampHeader() full width": function () {
        var start = new Date(2001, 0, 2, 6, 0, 0);
        var first = new Date(2001, 1, 3, 7, 0, 0);
        var last  = new Date(2001, 6, 4, 8, 0, 0);
        var stop  = new Date(2001, 11, 5, 9, 0, 0);
        var title = 'title';
        var header = this.r.getTimestampHeader(start, first, last, stop, title);
        var timezone = start.toString().substr(28, 5);
        var tzSame = true;
        if ( (timezone != first.toString().substr(28, 5)) ||
             (timezone != last.toString().substr(28, 5))  ||
             (timezone != stop.toString().substr(28, 5)) ) {
            tzSame = false;
        }
//        console.log("header ='"+ header + "'");
//        console.log("header.length="+ header.length);
//        console.log("tzSame="+tzSame);
        if (tzSame) {
            assert.equals(header.length, 102);
        } else {
            assert.equals(header.length, 120);
        }
    },
    
});


