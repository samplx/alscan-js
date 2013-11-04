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

function DenyReport(options) {
    if (!(this instanceof DenyReport)) {
        return new DenyReport(options);
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
    
    // list of ips to deny
    this.ips = [];
//    console.log("DenyReport::constructor");
    return this;
}

DenyReport.prototype.report = function (results) {
//    console.log("DenyReport::report"); console.dir(this);
    var slot = new timeslot.TimeSlot(results, 0, results.length-1, this.start.getTime(), this.stop.getTime(), this);
//    console.log("calling slot.scan");
    slot.scan();
//    console.log("scan completed.");
    for (var n=0, length= slot.nItems(); (n < length) && (n < this.limit); n++) {
//        console.log("adding: " + util.inspect(slot.getItem(n)));
        this.ips.push(slot.getItem(n).title);
    }
    this.ips.sort().forEach(function (ip) {
        console.log("deny from " + ip);
    });
}

exports.DenyReport = DenyReport;

/*
var deny = module.exports = {
    // report id
    id : 'deny',
    
    // reporting category
    category : undefined,
    
    // debug flag
    debug : undefined,
    
    // feedback level
    feedbackLevel : undefined,
    
    // array of IP addresses to deny.    
    ips : [],

    // number of items to include
    limit : undefined,
    
    // sort order
    order : undefined,
    
    // bandwidth sample size in seconds.
    sampleSize : undefined,
    
    // size of time-slot in seconds.
    slotWidth : undefined,
    
    // begining of reporting period (Date)
    start : undefined,
    
    // end of reporting period (Date)
    stop : undefined,

    // scan progress handler
    progress : function () {
    },
    
    // scan report handler
    report : function(results) {
//        console.log("deny::report");
        var slot = new timeslot.TimeSlot(results, 0, results.length-1, deny);
//        console.log("calling slot.scan");
        slot.scan();
//        console.log("scan completed.");
        for (var n=0, length= slot.nItems(); (n < length) && (n < deny.limit); n++) {
//            console.log("adding: " + util.inspect(slot.getItem(n)));
            deny.ips.push(slot.getItem(n).title);
        }
        deny.ips.sort().forEach(function (ip) {
            console.log("deny from " + ip);
        });
    },
    
    // scan error handler
    reportError : function (error) {
        console.error("ERROR: " + error.message);
    }
};
*/

