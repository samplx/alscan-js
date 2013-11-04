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

var Reporter = require("./reporter.js").Reporter;

util.inherits(DowntimeReport, Reporter);

function DowntimeReport(options) {
    if (!(this instanceof DowntimeReport)) {
        return new DowntimeReport(options);
    }

    this.options = options;
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
    
//    console.log("DowntimeReport::constructor");
    return this;
}

DowntimeReport.prototype.report = function (ticks) {
    if (ticks.length == 0) {
        console.log("No entires match search criteria.");
        return;
    }

//    console.log("DowntimeReport::report"); console.dir(this);
    var firstTime = ticks[0].time;
    var firstTS = this.getTimestamp(firstTime);
    var lastTime = ticks[ticks.length-1].time;
    var lastTS  = this.getTimestamp(lastTime);
    var tsFirst = 0;
    var tsLast  = 26;
    if (firstTS.substr(-5) == lastTS.substr(-5)) {
        // timezones match, don't need to print them.
        tsLast = 20;
    }
    if (firstTS.substr(0, 12) == lastTS.substr(0, 12)) {
        // dates match, don't need them
        tsFirst = 12;
    }

    // print header
    console.log(this.getTimestampHeader(this.start.getTime(), firstTime, lastTime, this.stop.getTime(), 'Downtime'));
    var row;
    row  = this.padFieldRight('Time', tsLast - tsFirst) + ' ';
    row += ' Count  Bandwidth';
    console.log(row);
        
    // convert slotWidth to milliseconds.
    var slotWidthMS = this.slotWidth * 1000;
    var currentTime = Math.floor(ticks[0].time / slotWidthMS) * slotWidthMS;
    var nextTime = currentTime - 1000;
    var count = 0;
    var bandwidth = 0;
    var n= 0;
    
    while (n < ticks.length) {
        nextTime += slotWidthMS;
        while (ticks[n].time <= nextTime) {
            count += 1;
            bandwidth += ticks[n].size;
            n += 1;
        }
        row  = this.getTimestamp(currentTime).substring(tsFirst, tsLast);
        row += this.padField(count, 7);
        if (count == 0) {
            row += '    -';
        } else {
            row += this.padField(this.getBytesString(bandwidth), 9);
        }
        currentTime += slotWidthMS;
        console.log(row);
        count = 0;
        bandwidth = 0;
    }
}

exports.DowntimeReport = DowntimeReport;


