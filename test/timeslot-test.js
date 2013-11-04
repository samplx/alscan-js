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
var buster = require("buster");
var assert = buster.assert;
var refute = buster.refute;
var path = require("path");
var util = require("util");
var when = require("when");

var testData = require("alscan-test-data");

var Tick = require("../lib/tick.js").Tick;

var timeslot = require("../lib/timeslot.js");
var TimeSlot = timeslot.TimeSlot;

buster.testCase("timeslot", {
    setUp: function () {
        this.t = timeslot;
    },
    
    "test TimeSlot constructor": function () {
        var ticks = [];
        var time = new Date(2001, 0, 10, 12, 34, 56);
        var start = new Date(2001, 0, 10, 0, 0, 0);
        var stop = new Date(2001, 0, 10, 23, 59, 59);
        var options = {};
        
        for (var n=0; n < 100; n++) {
            ticks.push(new Tick(time.getTime()+n, n, "item #" + n));
        }
        var ts = new TimeSlot(ticks, 0, 99, start.getTime(), stop.getTime(), options);
        
        assert.same(ts.ticks, ticks);
        assert.same(ts.options, options);
        assert.equals(ts.firstIndex, 0);
        assert.equals(ts.lastIndex, 99);
        assert.equals(ts.startTime, start.getTime());
        assert.equals(ts.stopTime, stop.getTime());
        refute.defined(ts.totals);
        assert.equals(ts.items.length, 0);
    },
    
});


