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
var timeslot = require("./timeslot.js");
var util = require("util");
var Reporter = require("./reporter.js").Reporter;

util.inherits(DenyReport, Reporter);

/**
 *  @ctor DenyReport constructor.
 */
function DenyReport() {
    if (!(this instanceof DenyReport)) {
        return new DenyReport();
    }

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
    
    // list of ips to deny
    this.ips = [];

    // where to write the output
    this.output = process.stdout;
    
    return this;
}

/**
 *  Create Deny report.
 *  @param results data to create report.
 */
DenyReport.prototype.report = function (results) {
    var slot = new timeslot.TimeSlot(results, 0, results.length-1, this.start.getTime(), this.stop.getTime(), this);
    slot.scan();
    for (var n=0, length= slot.nItems(); (n < length) && (n < this.limit); n++) {
        this.ips.push(slot.getItem(n).title);
    }
    this.ips.sort().forEach(function (ip) {
        this.output.write("deny from " + ip + "\n");
    }.bind(this));
}

exports.DenyReport = DenyReport;

