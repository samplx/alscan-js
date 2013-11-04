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
var underscore = require("underscore");
var util = require("util");

/**
 *  @ctor SlotItem constructor.
 *  @arg tick first tick in the slot.
 */
function SlotItem(tick) {
    if (!(this instanceof SlotItem)) {
        return new SlotItem(tick);
    }
    
    this.title = tick.item;
    this.count = this.currentCount = this.peakCount = 1;
    this.bandwidth = this.currentBandwidth = this.peakBandwidth = tick.size;
    this.first = this.last = this.lastTime = tick.time;
    
    return this;
}

/**
 *  Increment the item by the tick.
 *  @arg tick seen.
 */
SlotItem.prototype.inc = function (tick) {
    this.count += 1;
    this.bandwidth += tick.size;
    if (this.last < tick.time) {
        this.last = tick.time;
    }
    if (this.first > tick.time) {   // should not happen if sorted.
        this.first = tick.time;
    }
    if (this.lastTime == tick.time) {
        this.currentBandwidth += tick.size;
        this.currentCount += 1;
    } else {
        this.currentBandwidth = tick.size;
        this.currentCount = 1;
    }
    if (this.peakBandwidth < this.currentBandwidth) {
        this.peakBandwidth = this.currentBandwidth;
    }
    if (this.peakCount < this.currentCount) {
        this.peakCount = this.currentCount;
    }
    this.lastTime = tick.time;
}

/**
 *  @ctor TimeSlot constructor.
 *  @arg ticks Array of Ticks.
 *  @arg firstIndex of this time slot in ticks array.
 *  @arg lastIndex of this time slot in ticks array.
 *  @arg startTime.
 *  @arg stopTime.
 *  @arg options associated with the report.
 */
function TimeSlot(ticks, firstIndex, lastIndex, startTime, stopTime, options) {
    if (!(this instanceof TimeSlot)) {
        return new TimeSlot(ticks, firstIndex, lastIndex, startTime, stopTime, options);
    }
    
    this.ticks = ticks;
    this.firstIndex = firstIndex;
    this.lastIndex = lastIndex;
    this.startTime = startTime;
    this.firstTime = ticks[firstIndex].time;
    this.stopTime = stopTime;
    this.lastTime = ticks[lastIndex].time;
    this.options = options;
    this.totals = undefined;
    this.items = [];
}

/**
 *  Find an item which matches the item value of the tick.
 *  @arg tick to locate.
 *  @rtype Number. Index of tick in items array. -1 if not found.
 */
TimeSlot.prototype.find = function(tick) {
//    console.log("TimeSlot::find tick() = " + util.inspect(tick));
    for (var n=0, length = this.items.length; n < length; n++) {
        if (this.items[n].title == tick.item) {
            return n;
        }
    }
    return -1;
}

/**
 *  Increment the item associated with the tick.
 *  @arg index of the tick in the item array.
 *  @arg tick data seen.
 */
TimeSlot.prototype.inc = function(index, tick) {
    if ((index < 0) || (index >= this.items.length)) {
        throw new RangeError("index is out-of-bounds.");
    }
    this.items[index].inc(tick);
}

/** Table used to convert a sort option to the field to sort upon. */
var sortFieldLookup = {
        "title"          : "title",
        "item"           : "title",
        "count"          : "count",
        "bandwidth"      : "bandwidth",
        "peak"           : "peakCount",
        "peak-bandwidth" : "peakBandwidth"
    };
    

/**
 *  Process all of the ticks in this time slot to generate summary data.
 */
TimeSlot.prototype.scan = function () {
    var index, tick;
//    console.log("TimeSlot::scan: firstIndex=" +this.firstIndex + ", lastIndex=" + this.lastIndex);
    for (var n= this.firstIndex; n <= this.lastIndex; n++) {
        tick = this.ticks[n];
        if (n == this.firstIndex) {
            this.totals = new SlotItem(tick);
        } else {
            this.totals.inc(tick);
        }
        index = this.find(tick);
        if (index < 0) {
//            console.log("adding new SlotItem()");
            this.items.push(new SlotItem(tick));
        } else {
//            console.log("inc existing item");
            this.inc(index, tick);
        }
        
    }
    
    if (this.options.order) {
        var field= 'count';
        if (sortFieldLookup[this.options.order]) {
            field = sortFieldLookup[this.options.order];
        }
//        console.log("sorting items by " + field);
        if (field == 'title') {
            this.items = underscore.sortBy(this.items, field);
        } else {
            this.items = underscore.sortBy(this.items, field).reverse();
        }
    }
}

/**
 *  Perform a totals only scan of the TimeSlot.
 */
TimeSlot.prototype.totalScan = function () {
    var tick;
    for (var n= this.firstIndex; n <= this.lastIndex; n++) {
        tick = this.ticks[n];
        if (n == this.firstIndex) {
            this.totals = new SlotItem(tick);
        } else {
            this.totals.inc(tick);
        }
    }
}

/**
 *  Return the number of items in the TimeSlot.
 *  @rtype Number.
 */
TimeSlot.prototype.nItems = function () {
    return this.items.length;
}

/**
 *  Access an item in the TimeSlot.
 *  @arg n index of the item.
 *  @rtype SlotItem.
 */
TimeSlot.prototype.getItem = function (n) {
    if ((n < 0) || (n >= this.items.length)) {
        throw new RangeError("Index is out-of-bounds.");
    }
    return this.items[n];
}

/**
 *  Access the totals associated with this TimeSlot.
 *  @rtype SlotItem.
 */
TimeSlot.prototype.getTotals = function () {
    return this.totals;
}

exports.TimeSlot = TimeSlot;

