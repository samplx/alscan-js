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
var util = require("util");

function Reporter() {
    if (!(this instanceof Reporter)) {
        return new Reporter(options);
    }

    this.id = undefined;
    // reporting category.
    this.category = undefined;
    // debug flag.
    this.debug = false;
    // level of feedback (currently not used.)
    this.feedbackLevel = undefined;
    // number of items to include in a report.
    this.limit = undefined;
    // sort order of report results.
    this.order = undefined;
    // bandwidth sample size in seconds (currently not used)
    this.sampleSize = undefined;
    // size of time-slots in seconds.
    this.slotWidth = undefined;
    // begining of reporting period (Date)
    this.start = undefined;
    // end of reporting period (Date)
    this.stop = undefined;
    
//    console.log("Reporter::constructor");
    return this;
}

// Bytes order of magnitudes
Reporter.bytesSuffix = [ ' B', 'kB', 'MB', 'GB', 'TB', 'PB', 'XB' ];

// used to convert a category option to the title for the report.
Reporter.categoryLookup = {
        "groups"      : "Group",
        "sources"     : "Source",
        "user-agents" : "User Agent",
        "agents"      : "User Agent",
        "uris"        : "URI",
        "urls"        : "URL",
        "codes"       : "HTTP Status",
        "referers"    : "Referer",
        "referrers"   : "Referrer",
        "methods"     : "Method",
        "requests"    : "Request",
        "protocols"   : "Protocol",
        "users"       : "User",
        "ips"         : "IP",
        "domains"     : "Domain"
    };

// names of the months -- to match Apache should not be localized.
Reporter.monthNames = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

// zero pad a number to a given width
Reporter.prototype.padZero = function (number, width) {
    var s = number.toString();
    while (s.length < width) {
        s = '0' + s;
    }
    return s;
}

// pad a string on left with spaces until it is width characters (right justify)
Reporter.prototype.padField = function (field, width) {
    var s = field.toString();
    while (s.length < width) {
        s = ' ' + s;
    }
    return s;
}

// pad a string on right with spaces until it is width characters (left justify)
Reporter.prototype.padFieldRight = function (field, width) {
    var s = field.toString();
    while (s.length < width) {
        s += ' ';
    }
    return s;
}

// returns a milliseconds since Epoch time as an Apache log format
// timestamp. dd/mmm/yyyy:hh:mm:ss +ZZzz
Reporter.prototype.getTimestamp = function (time) {
//    console.log("Reporter::getTimestamp=" + time);
    var date = new Date(time);
    var timestamp = '';
    var timezone = date.getTimezoneOffset();
    var sign = '-';
    if (timezone <= 0) {
        sign = '+';
        timezone = -timezone;
    }
    var ZZ = Math.floor(timezone / 60);
    var zz = timezone - (ZZ * 60);
    
    timestamp += this.padZero(date.getDate(), 2);
    timestamp += '/';
    timestamp += Reporter.monthNames[date.getMonth()];
    timestamp += '/';
    timestamp += date.getFullYear();
    timestamp += ':';
    timestamp += this.padZero(date.getHours(), 2);
    timestamp += ':';
    timestamp += this.padZero(date.getMinutes(), 2);
    timestamp += ':';
    timestamp += this.padZero(date.getSeconds(), 2);
    timestamp += ' ' + sign;
    timestamp += this.padZero(ZZ, 2);
    timestamp += this.padZero(zz, 2);

//    console.log("Reporter::getTimestamp, returning ="+timestamp);    
    return timestamp;
}

// return a time stamp header
Reporter.prototype.getTimestampHeader = function (start, first, last, stop, title) {
//    console.log("Reporter::getTimestampHeader");
    var startTS = this.getTimestamp(start);
    var firstTS = this.getTimestamp(first);
    var lastTS  = this.getTimestamp(last);
    var stopTS  = this.getTimestamp(stop);
//    console.log("startTS.length="+startTS.length)
    var timezone = startTS.substr(-5);
    if ((timezone == firstTS.substr(-5)) && (timezone == lastTS.substr(-5)) && (timezone == stopTS.substr(-5))) {
//        console.log("Reporter::getTimestampHeader: timezones match.");
        firstTS = firstTS.substr(0, 20);
        lastTS = lastTS.substr(0, 20);
        stopTS = stopTS.substr(0, 20);
    }
    var prefix = startTS.substr(0, 12);
    if (prefix == firstTS.substr(0, 12)) {
//        console.log("Reporter::getTimestampHeader: start/first dates match.");        
        firstTS = firstTS.substr(12);
    }
    prefix = stopTS.substr(0, 12);
    if (prefix == lastTS.substr(0, 12)) {
//        console.log("Reporter::getTimestampHeader: last/stop dates match.");        
        lastTS = lastTS.substr(12);
    }
    if (prefix == startTS.substr(0, 12)) {
        stopTS = stopTS.substr(12);
    }
    var header = 
        startTS + ' [' +
        firstTS + '] - [' +
        lastTS + '] ' +
        stopTS + ' ' +
        title + "\n";
        
    return header;
}

// return number of bytes scaled by suffix
Reporter.prototype.getBytesString = function (nBytes) {
    var radix = 0;
    var exponent = 1;
    var scaled = nBytes;
    
    while (scaled > 5120) {
        scaled = scaled / 1024;
        radix += 1;
        exponent *= 1024;
    }
    if (radix == 0) {
        return this.padField(nBytes.toString(), 4) + '     B';
    }
    return this.padField((nBytes / exponent).toFixed(3), 8) + Reporter.bytesSuffix[radix];
}

// return number of bytes per second as a scaled string
Reporter.prototype.getBPS = function (nBytes, elapsed) {
    if (elapsed == 0) {
        return '  NaN  ';
    }
    var radix = 0;
    var exponent = 1;
    var scaled = Math.floor(nBytes / elapsed);
    
    while (scaled > 5120) {
        scaled = scaled / 1024;
        radix += 1;
        exponent *= 1024;
    }
    
    var bps = (nBytes / elapsed) / exponent;
    return this.padField(bps.toFixed(2), 7) + Reporter.bytesSuffix[radix] + '/s';
}

Reporter.prototype.reportError = function (error) {
    console.error("ERROR: " + error.message);
}

Reporter.prototype.report = function (ticks) {
    console.error("Reporter::report: stub");
}

Reporter.prototype.progress = function (info) {
    console.error("Reporter::progress: stub");
}

exports.Reporter = Reporter;

