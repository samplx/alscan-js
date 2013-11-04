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

util.inherits(SummaryReport, Reporter);

function SummaryReport() {
    if (!(this instanceof SummaryReport)) {
        return new SummaryReport();
    }

    // summary timeslot for ticks after stop
    this.after = undefined;
    
    // summary timeslot for ticks before start
    this.before = undefined;
    
    // reporting category.
    this.category = undefined;
    
    // debug flag.
    this.debug = false;
    
    // level of feedback (currently not used.)
    this.feedbackLevel = undefined;
    
    // are before and after ticks included.
    this.keepOutside = undefined;
    
    // number of items to include in a report.
    this.limit = undefined;
    
    // sort order of report results.
    this.order = undefined;
    
    // bandwidth sample size in seconds (currently not used)
    this.sampleSize = undefined;
    
    // array of active timeslots
    this.slots = [];
    
    // size of time-slots in seconds.
    this.slotWidth = undefined;
    
    // begining of reporting period (Date)
    this.start = undefined;
    
    // end of reporting period (Date)
    this.stop = undefined;

    // terse report option
    this.terse = false;

    // summary of active ticks
    this.totals = undefined;
    
    // where to write the output
    this.output = process.stdout;
    
    return this;
}

// allocate slots for report
SummaryReport.prototype.allocateSlots = function (nSlots, ticks, firstIndex, lastIndex) {
//    console.log("allocateSlots()");
    if (firstIndex != 0) {
//        console.log("firstIndex = " + firstIndex + ", creating before timeslot.");
        var stopTime;
        if (firstIndex < ticks.length) {
            stopTime = ticks[firstIndex].time - 1;
        } else {
            stopTime = ticks[ticks.length-1].time;
        }
        this.before = new timeslot.TimeSlot(ticks, 0, firstIndex-1, ticks[0].time, stopTime, this);
        this.before.totalScan();
    }
    if (lastIndex != (ticks.length-1)) {
//        console.log("lastIndex = " + lastIndex + ", creating after timeslot.");
        this.after = new timeslot.TimeSlot(ticks, lastIndex+1, ticks.length-1, 
                                                ticks[lastIndex+1].time,
                                                ticks[ticks.length-1].time,
                                                this);
        this.after.totalScan();
    }
    if (nSlots == 1) {
        // only a single timeslot
//        console.log("SummaryReport::allocateSlots: only one timeslot.");
        this.slots.push(new timeslot.TimeSlot(ticks, firstIndex, lastIndex, 
                                                    this.start.getTime(),
                                                    this.stop.getTime(),
                                                    this));
    } else if (nSlots > 1) {
        this.totals = new timeslot.TimeSlot(ticks, firstIndex, lastIndex, 
                                                    this.start.getTime(),
                                                    this.stop.getTime(),
                                                    this);
        this.totals.totalScan();
        
        var slotWidthMS = this.slotWidth * 1000;
        var startTime = (Math.floor(ticks[firstIndex].time / slotWidthMS) * slotWidthMS);
        var nextTime = startTime - 1000;
        var first = firstIndex;
        var last = -1;
        var length = ticks.length;
        var slot;
        
        while (nextTime < this.stop) {
            nextTime += slotWidthMS;
            for (var n=first; n < length ; n++) {
                if (ticks[n].time >= nextTime) {
                    break;
                }
                last= n;
            }
            if (last >= first) {
                slot = new timeslot.TimeSlot(ticks, first, last, startTime, nextTime, this);
//                console.log("SummaryReport::allocateSlots: adding slot. first="+first+", last="+last+", startTime="+startTime+", nextTime="+nextTime);
                this.slots.push(slot);
                first= last+1;
            }
            startTime = nextTime + 1000;
        }
    }
}

SummaryReport.prototype.getColumnHeader = function (title) {
    var header = 
    //   0        1         2         3         4         5         6         7         8
    //   12345678901234567890123456789012345678901234567890123456789012345678901234567890
        "Requests  Ave/sec Peak/sec  Bandwidth   Bytes/sec Peak Bytes ";
    
    header += title + "\n";
    return header;
}

SummaryReport.prototype.getItemRow = function (item) {
    var row;
    var elapsed = Math.floor((item.last - item.first + 1000) / 1000);
    var perSecond = item.count / elapsed;
    
    row  = this.padField(item.count.toString(), 8);
    row += this.padField(perSecond.toFixed(3), 9);
    row += this.padField(item.peakCount, 9) + ' ';
    row += this.getBytesString(item.bandwidth) + ' ';
    row += this.getBPS(item.bandwidth, elapsed) + ' ';
    row += this.getBytesString(item.peakBandwidth) + ' ';
    row += item.title;
    row += "\n";
    return row;
}

SummaryReport.prototype.getTerseItemRow = function (item, sep, start, stop) {
//    console.log("getTerseItemRow");
    var row = '';
    var elapsed = Math.floor((item.last - item.first + 1000) / 1000);
//    console.log("elapsed=" + elapsed);
    var countPerSecond = item.count / elapsed;
//    console.log("countPerSecond=" + countPerSecond);
    var bytesPerSecond = item.bandwidth / elapsed;
//    console.log("bytesPerSecond=" + bytesPerSecond);

    row += this.getTimestamp(start) + sep;
    row += Math.floor(start / 1000).toString() + sep;    
    row += this.getTimestamp(item.first) + sep;
    row += Math.floor(item.first / 1000).toString() + sep;
    row += this.getTimestamp(item.last) + sep;
    row += Math.floor(item.last / 1000).toString() + sep;
    row += this.getTimestamp(stop) + sep;
    row += Math.floor(stop / 1000).toString() + sep;
    row += item.count.toString() + sep;
    row += countPerSecond.toString() + sep;
    row += item.peakCount.toString() + sep;
    row += item.bandwidth.toString() + sep;
    row += bytesPerSecond.toString() + sep;
    row += item.peakBandwidth.toString() + sep;
    row += item.title;
    row += "\n";
    return row;
}

// return index of first tick after start
SummaryReport.prototype.getFirstIndex = function (ticks) {
    if (this.keepOutside) {
        for (var n=0, length=ticks.length; n < length; n++) {
            if (ticks[n].time >= this.start) {
                return n;
            }
        }
        return ticks.length;
    } else {
        return 0;
    }
}

// return index of last tick before stop
SummaryReport.prototype.getLastIndex = function (ticks) {
    if (this.keepOutside) {
        var last = -1;
        for (var n=0, length= ticks.length; n < length; n++) {
            if (ticks[n].time > this.stop) {
                break;
            }
            last = n;
        }
        return last;
    } else {
        return ticks.length-1;
    }
}

SummaryReport.prototype.terseTotalReport = function (title, slot) {
//        console.log("terseTotalReport");
    var total = slot.getTotals();
    total.title = title;
    var row = this.getTerseItemRow(total, this.fieldSep, slot.startTime, slot.stopTime);
    console.log(row);
}

SummaryReport.prototype.verboseTotalReport = function (title, slot) {
    var total = slot.getTotals();
//        console.dir(total);
    this.output.write(this.getTimestampHeader(slot.startTime, slot.firstTime, slot.lastTime, slot.stopTime, ''));
    this.output.write(this.getColumnHeader(title));
//        total.title = 'Totals';
//        row = getItemRow(total);
    total.title = '';
    var row = this.getItemRow(total);
    this.output.write(row);
//        console.log("verboseTotalReport: " + title);
}

// report on a total
SummaryReport.prototype.totalReport = function (title, total) {
    if (this.terse) {
        this.terseTotalReport(title, total);
    } else {
        this.verboseTotalReport(title, total);
    }
}

SummaryReport.prototype.terseSlotReport = function (slot) {
    var row;
//    console.log("SummaryReport::terseSlotReport");
    var length = slot.nItems();
    if (this.limit < length) {
        length = this.limit;
    }
    for (var n=0; n < length; n++) {
        row = this.getTerseItemRow(slot.getItem(n), this.fieldSep, slot.startTime, slot.stopTime);
        this.output.write(row);
    }
    var total = slot.getTotals();
    total.title = 'Totals';
    row = this.getTerseItemRow(total, this.fieldSep, slot.startTime, slot.stopTime);
    this.output.write(row);
}

SummaryReport.prototype.verboseSlotReport = function (slot) {
    var title = Reporter.categoryLookup[this.category];
    var row;
//    console.log("SummaryReport::verboseSlotReport");
    this.output.write(this.getTimestampHeader(slot.startTime, slot.firstTime, slot.lastTime, slot.stopTime, 'Slot'));
    this.output.write(this.getColumnHeader(title));
    var length = slot.nItems();
    if (this.limit < length) {
        length = this.limit;
    }
    for (var n=0; n < length; n++) {
        row = this.getItemRow(slot.getItem(n));
        this.output.write(row);
    }
    if (length != 1) {
        var total = slot.getTotals();
        total.title = 'Totals';
        row = this.getItemRow(total);
        this.output.write(row);
    }
//        console.dir(slot);
    this.output.write("\n");
}

SummaryReport.prototype.slotReport = function (slot) {
    if (this.terse) {
        this.terseSlotReport(slot);
    } else {
        this.verboseSlotReport(slot);
    }
}

SummaryReport.prototype.report = function(ticks) {
//    console.log("SummaryReport::report");
//  console.dir(ticks);
    // compute the duration of all of the samples (in seconds)
    if (ticks.length == 0) {
        this.output.write("No entires match search criteria.\n");
        return;
    }
    var firstIndex = this.getFirstIndex(ticks);
//    console.log("firstIndex=" + firstIndex);
    var lastIndex = this.getLastIndex(ticks);
//    console.log("lastIndex=" + lastIndex);
    var nSlots;
    if (this.slotWidth == Infinity) {
        nSlots = 1;
    } else if (firstIndex < lastIndex) {
        var duration = (ticks[lastIndex].time - ticks[firstIndex].time) / 1000;
//        console.log("duration=" + duration);
        nSlots = Math.ceil(duration / this.slotWidth);
    } else {
        nSlots = 0;
    }
//    console.log("nSlots=" + nSlots);

    this.allocateSlots(nSlots, ticks, firstIndex, lastIndex);

    if (this.before) {
        this.totalReport('Before', this.before);
    }
    var self = this;
    this.slots.forEach(function (slot) {
        slot.scan();
        self.slotReport(slot);
    });
    if (this.after) {
        this.totalReport('After', this.after);
    }
    if (this.totals) {
        this.totalReport('Grand Totals', this.totals);
    }
}

exports.SummaryReport = SummaryReport;
