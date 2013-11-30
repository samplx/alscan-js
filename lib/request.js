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

var util = require("util");
var Reporter = require("./reporter.js").Reporter;

util.inherits(RequestReport, Reporter);

/**
 *  @ctor RequestReport constructor.
 */
function RequestReport() {
    if (!(this instanceof RequestReport)) {
        return new RequestReport();
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
    
    // where to write the output
    this.output = process.stdout;
    
    return this;
}

/**
 *  Create Request report.
 *  @param results data to create report.
 */
RequestReport.prototype.report = function (results) {
    results.forEach(function (record) {
        if (record.item) {
            this.output.write(record.item + "\n");
        }
    }.bind(this));
}

/** Export RequestReport object. */
exports.RequestReport = RequestReport;

