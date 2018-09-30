/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018 James Burlingame
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
'use strict';

// module imports
const util = require('util');

const Reporter = require('./reporter.js').Reporter;

util.inherits(DowntimeReport, Reporter);

/**
 *  @ctor DowntimeReport constructor.
 */
function DowntimeReport() {
    if (!(this instanceof DowntimeReport)) {
        return new DowntimeReport();
    }

    // report id
    this.id = 'downtime';

    // reporting category.
    this.category = undefined;

    // debug flag.
    this.debug = false;

    // number of items to include in a report.
    this.limit = undefined;

    // sort order of report results.
    this.order = undefined;

    // size of time-slots in seconds.
    this.slotWidth = undefined;

    // begining of reporting period (Date)
    this.start = undefined;

    // end of reporting period (Date)
    this.stop = undefined;

    // where to write the output
    this.output = {
        write : process.stdout.write
    };

    return this;
}

/**
 *  Create Downtime report.
 *  @param ticks data for the report.
 */
DowntimeReport.prototype.report = function (ticks) {
    if (ticks.length === 0) {
        this.output.write('No entires match search criteria.\n');
        return;
    }

    const firstTime = ticks[0].time;
    const firstTS = this.getTimestamp(firstTime);
    const lastTime = ticks[ticks.length-1].time;
    const lastTS  = this.getTimestamp(lastTime);
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
    const stopTimeMS = this.stop.getTime();
    this.output.write(this.getTimestampHeader(this.start.getTime(), firstTime, lastTime, stopTimeMS, 'Downtime'));
    var row;
    row  = this.padFieldRight('Time', tsLast - tsFirst) + ' ';
    row += ' Count  Bandwidth\n';
    this.output.write(row);

    // convert slotWidth to milliseconds.
    const slotWidthMS = this.slotWidth * 1000;
    var currentTime = Math.floor(ticks[0].time / slotWidthMS) * slotWidthMS;
    var nextTime = currentTime - 1000;
    var count = 0;
    var bandwidth = 0;
    var n= 0;

    while ((n < ticks.length) && (ticks[n].time <= stopTimeMS)) {
        nextTime += slotWidthMS;
        while ((n < ticks.length) && (ticks[n].time <= nextTime)) {
            count += 1;
            bandwidth += ticks[n].size;
            n += 1;
        }
        row  = this.getTimestamp(currentTime).substring(tsFirst, tsLast);
        row += this.padField(count, 7);
        if (count === 0) {
            row += '    -';
        } else {
            row += this.padField(this.getBytesString(bandwidth), 9);
        }
        row += '\n';
        currentTime += slotWidthMS;
        this.output.write(row);
        count = 0;
        bandwidth = 0;
    }
};

exports.DowntimeReport = DowntimeReport;

