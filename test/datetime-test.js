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
var util = require("util");
var when = require("when");
var path = require("path");

var testData = require("alscan-test-data");

var datetime = require("./../lib/datetime.js");
var PartialDate = datetime.PartialDate;

var scanfile = require("./../lib/scanfile.js");

// -------------------------------------------------------------------------

buster.testCase("datetime", {
    setUp: function () {
        this.empty = new PartialDate();
        this.start = new PartialDate();
        this.stop  = new PartialDate();
        this.d     = datetime;
    },
    
    "test empty fields are undefined": function () {
        assert.equals(this.empty.year, undefined);
        assert.equals(this.empty.month, undefined);
        assert.equals(this.empty.day, undefined);
        assert.equals(this.empty.hours, undefined);
        assert.equals(this.empty.minutes, undefined);
        assert.equals(this.empty.seconds, undefined);
        assert.equals(this.empty.timezone, undefined);
    },
    
    "test setTime(1383136415000)=Wed, 30 Oct 2013 12:33:35 +0000": function () {
        this.stop.setTime(1383136415000);
        
        assert.equals(this.stop.year, 2013);
        assert.equals(this.stop.month, 9);
        assert.equals(this.stop.day, 30);
        assert.equals(this.stop.hours, 12);
        assert.equals(this.stop.minutes, 33);
        assert.equals(this.stop.seconds, 35);
        assert.equals(this.stop.timezone, 0);
    },
    
    "test isValidFormat(@seconds)": function () {
        assert(PartialDate.isValidFormat('@1383136415'));
    },
    
    "test parse('@1383136415')": function () {
        this.stop.parse('@1383136415');

        assert.equals(this.stop.year, 2013);
        assert.equals(this.stop.month, 9);
        assert.equals(this.stop.day, 30);
        assert.equals(this.stop.hours, 12);
        assert.equals(this.stop.minutes, 33);
        assert.equals(this.stop.seconds, 35);
        assert.equals(this.stop.timezone, 0);
    },
    
    "test isValidFormat(hhmmss)": function () {
        assert(PartialDate.isValidFormat('10'));
        assert(PartialDate.isValidFormat('10:23'));
        assert(PartialDate.isValidFormat('1023'));
        assert(PartialDate.isValidFormat('102345'));
        assert(PartialDate.isValidFormat('10:23:45'));
    },
    
    "test parse(hhmmss=10, roundDown=true)": function () {
        this.stop.parse('10', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 0);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse(hhmmss=10, roundDown=false)": function () {
        this.stop.parse('10', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 59);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse(hhmmss=10:23, roundDown=true)": function () {
        this.stop.parse('10:23', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse(hhmmss=10:23, roundDown=false)": function () {
        this.stop.parse('10:23', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },

    "test parse(hhmmss=1023, roundDown=true)": function () {
        this.stop.parse('1023', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse(hhmmss=1023, roundDown=false)": function () {
        this.stop.parse('1023', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },

    "test parse(hhmmss=10:23:45, roundDown=true)": function () {
        this.stop.parse('10:23:45', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse(hhmmss=10:23:45, roundDown=false)": function () {
        this.stop.parse('10:23:45', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },

    "test parse(hhmmss=102345, roundDown=true)": function () {
        this.stop.parse('102345', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse(hhmmss=102345, roundDown=false)": function () {
        this.stop.parse('102345', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, undefined);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },

    "test isValidFormat(yyyymmdd_hhmmss)": function () {
        assert(PartialDate.isValidFormat('1T10'));
        assert(PartialDate.isValidFormat('1T10:23'));
        assert(PartialDate.isValidFormat('1T1023'));
        assert(PartialDate.isValidFormat('1T102345'));
        assert(PartialDate.isValidFormat('1T10:23:45'));

        assert(PartialDate.isValidFormat('1 10'));
        assert(PartialDate.isValidFormat('1 10:23'));
        assert(PartialDate.isValidFormat('1 1023'));
        assert(PartialDate.isValidFormat('1 102345'));
        assert(PartialDate.isValidFormat('1 10:23:45'));
        assert(PartialDate.isValidFormat('1 10:23:45.678'));
        assert(PartialDate.isValidFormat('1 10:23:45.678 Z'));
        assert(PartialDate.isValidFormat('1 10:23:45.678 +00'));
        assert(PartialDate.isValidFormat('1 10:23:45.678 +0000'));
        assert(PartialDate.isValidFormat('1 10:23:45.678 -06'));
        assert(PartialDate.isValidFormat('1 10:23:45.678 -0600'));
        assert(PartialDate.isValidFormat('2/1 10:23:45'));
        assert(PartialDate.isValidFormat('2-1 10:23:45'));
        assert(PartialDate.isValidFormat('2001/2/1 10:23:45'));
        assert(PartialDate.isValidFormat('2001-2-1 10:23:45'));
        assert(PartialDate.isValidFormat('2001/12/31 10:23:45'));
        assert(PartialDate.isValidFormat('2001/02/01 10:23:45'));

        assert(PartialDate.isValidFormat('1:10:23:45'));
        assert(PartialDate.isValidFormat('2001/02/01:10:23:45'));
        assert(PartialDate.isValidFormat('02/01:10:23:45'));
        assert(PartialDate.isValidFormat('2/1:10:23:45'));
        assert(PartialDate.isValidFormat('2/1:10'));
    },

    "test parse('1T10', roundDown=true)": function () {
        this.stop.parse('1T10', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 0);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1T10', roundDown=false)": function () {
        this.stop.parse('1T10', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 59);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1T10:23', roundDown=true)": function () {
        this.stop.parse('1T10:23', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1T10:23', roundDown=false)": function () {
        this.stop.parse('1T10:23', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1T10:23:45', roundDown=false)": function () {
        this.stop.parse('1T10:23:45', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1T102345', roundDown=false)": function () {
        this.stop.parse('1T102345', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1T1023', roundDown=true)": function () {
        this.stop.parse('1T1023', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1T1023', roundDown=false)": function () {
        this.stop.parse('1T1023', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1 102345', roundDown=false)": function () {
        this.stop.parse('1 102345', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },

    "test parse('1:10:23:45', roundDown=false)": function () {
        this.stop.parse('1:10:23:45', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1:10:23:45.678', roundDown=false)": function () {
        this.stop.parse('1:10:23:45.678', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
        
    "test parse('1:10:23:45.678 Z', roundDown=false)": function () {
        this.stop.parse('1:10:23:45.678 Z', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 0);
    },
    
    "test parse('1:10:23:45.678 +01', roundDown=false)": function () {
        this.stop.parse('1:10:23:45.678 +01', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 3600000);
    },
    
    "test parse('1:10:23:45.678 -01', roundDown=false)": function () {
        this.stop.parse('1:10:23:45.678 -01', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, -3600000);
    },
    
    "test parse('1:10:23:45.678 +0130', roundDown=false)": function () {
        this.stop.parse('1:10:23:45.678 +0130', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 5400000);
    },
    
    "test parse('1:10:23:45.678 -0600', roundDown=false)": function () {
        this.stop.parse('1:10:23:45.678 -0600', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, undefined);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, -21600000);
    },
    
    "test parse('2/1:10:23:45', roundDown=false)": function () {
        this.stop.parse('2/1:10:23:45', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2-1:10:23:45', roundDown=false)": function () {
        this.stop.parse('2-1:10:23:45', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/2/1:10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/2/1:10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001-2-1:10:23:45', roundDown=false)": function () {
        this.stop.parse('2001-2-1:10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/2/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/2/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test isValidFormat(yyyyMMMdd_hhmmss)": function () {
        assert(PartialDate.isValidFormat('Feb/1 10'));
        assert(PartialDate.isValidFormat('Feb/1 10:23'));
        assert(PartialDate.isValidFormat('Feb/1 10:23:45'));
        assert(PartialDate.isValidFormat('Feb-1 10:23:45'));
        assert(PartialDate.isValidFormat('2001/Feb/1 10:23:45'));
        assert(PartialDate.isValidFormat('2001-Feb-1 10:23:45'));
        assert(PartialDate.isValidFormat('2001/December/31 10:23:45'));
        assert(PartialDate.isValidFormat('2001/Feb/01:10:23:45'));
        assert(PartialDate.isValidFormat('2001/Feb/01:10:23:45.678'));
        assert(PartialDate.isValidFormat('2001/Feb/01:10:23:45 Z'));
        assert(PartialDate.isValidFormat('2001/Feb/01:10:23:45 +01'));
        assert(PartialDate.isValidFormat('2001/Feb/01:10:23:45 -01'));
        assert(PartialDate.isValidFormat('2001/Feb/01:10:23:45 +0100'));
        assert(PartialDate.isValidFormat('2001/Feb/01:10:23:45 -0600'));
        assert(PartialDate.isValidFormat('2001/Feb/01T10:23:45'));
    },

    "test parse('Feb/1 10', roundDown=false)": function () {
        this.stop.parse('Feb/1 10', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 59);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('FEB/1 10', roundDown=true)": function () {
        this.stop.parse('FEB/1 10', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 0);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('Feb/1 10:23', roundDown=false)": function () {
        this.stop.parse('Feb/1 10:23', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('February/1 10:23', roundDown=true)": function () {
        this.stop.parse('February/1 10:23', true);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('Feb/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('Feb/1 10:23:45', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('Feb-1 10:23:45', roundDown=false)": function () {
        this.stop.parse('Feb-1 10:23:45', false);

        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Jan/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Jan/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 0);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001-March-1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001-March-1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 2);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/January/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/January/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 0);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/February/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/February/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/March/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/March/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 2);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/April/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/April/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 3);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/May/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/May/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 4);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/June/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/June/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 5);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/July/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/July/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 6);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/august/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/august/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 7);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/septembER/11 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/septembER/11 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 8);
        assert.equals(this.stop.day, 11);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/October/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/October/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 9);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/November/18 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/November/18 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 10);
        assert.equals(this.stop.day, 18);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/December/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/December/31 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Feb/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Feb/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Mar/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Mar/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 2);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Apr/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Apr/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 3);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Jun/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Jun/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 5);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Jul/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Jul/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 6);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/aug/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/aug/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 7);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/sep/11 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/sep/11 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 8);
        assert.equals(this.stop.day, 11);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/OCT/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/OCT/1 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 9);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Nov/18 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Nov/18 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 10);
        assert.equals(this.stop.day, 18);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Dec/1 10:23:45', roundDown=false)": function () {
        this.stop.parse('2001/Dec/31 10:23:45', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Dec/1 10:23:45.678', roundDown=false)": function () {
        this.stop.parse('2001/Dec/31 10:23:45.678', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('2001/Dec/1 10:23:45 Z', roundDown=false)": function () {
        this.stop.parse('2001/Dec/31 10:23:45 Z', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 0);
    },
    
    "test parse('2001/Dec/1 10:23:45 +01', roundDown=false)": function () {
        this.stop.parse('2001/Dec/31 10:23:45 +01', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 3600000);
    },
    
    "test parse('2001/Dec/1 10:23:45 -01', roundDown=false)": function () {
        this.stop.parse('2001/Dec/31 10:23:45 -01', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, -3600000);
    },
    
    "test parse('2001/Dec/1 10:23:45 +0130', roundDown=false)": function () {
        this.stop.parse('2001/Dec/31 10:23:45 +0130', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 5400000);
    },
    
    "test parse('2001/Dec/1 10:23:45 -0130', roundDown=false)": function () {
        this.stop.parse('2001/Dec/31 10:23:45 -0600', false);

        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 11);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, -21600000);
    },

    "test isValidFormat(ddMMMyyyy_hhmmss)": function () {
        assert(PartialDate.isValidFormat('1/Feb 10'));
        assert(PartialDate.isValidFormat('01/Feb/2001 10'));
        assert(PartialDate.isValidFormat('01/Jan/2001T10:23'));
        assert(PartialDate.isValidFormat('03/Mar/2001:10:23:45'));
        assert(PartialDate.isValidFormat('04/Apr/2001 10:23:45 Z'));
        assert(PartialDate.isValidFormat('05/May/2001 10:23:45 +01'));
        assert(PartialDate.isValidFormat('06/June/2001 10:23:45 -01'));
        assert(PartialDate.isValidFormat('7/JUL/2001:10:23:45 +0000'));
        assert(PartialDate.isValidFormat('8-AUG-2010:10:23:45.678 -0600'));
    },
    
    "test parse('1/Feb 10', roundDown= true)": function () {
        this.stop.parse('1/Feb 10', true);
        
        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 0);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('1/Feb 10', roundDown= false)": function () {
        this.stop.parse('1/Feb 10', false);
        
        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 59);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('1/Feb 10:23', roundDown= true)": function () {
        this.stop.parse('1/Feb 10:23', true);
        
        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 0);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('1/Feb 10:23', roundDown= false)": function () {
        this.stop.parse('1/Feb 10:23', false);
        
        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 59);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('1/Feb 10:23:45', roundDown= false)": function () {
        this.stop.parse('1/Feb 10:23:45', false);
        
        assert.equals(this.stop.year, undefined);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('1/Feb/2001 10:23:45', roundDown= false)": function () {
        this.stop.parse('1/Feb/2001 10:23:45', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 1);
        assert.equals(this.stop.day, 1);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('31/Jan/2001:10:23:45', roundDown= false)": function () {
        this.stop.parse('31/Jan/2001:10:23:45', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 0);
        assert.equals(this.stop.day, 31);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, undefined);
    },
    
    "test parse('03/Mar/2001:10:23:45 Z', roundDown= false)": function () {
        this.stop.parse('03/Mar/2001:10:23:45 Z', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 2);
        assert.equals(this.stop.day, 3);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 0);
    },
    
    "test parse('04/April/2001:10:23:45.678 Z', roundDown= false)": function () {
        this.stop.parse('04/April/2001:10:23:45.678 Z', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 3);
        assert.equals(this.stop.day, 4);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 0);
    },
    
    "test parse('04/April/2001:10:23:45.678 +01', roundDown= false)": function () {
        this.stop.parse('04/April/2001:10:23:45.678 +01', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 3);
        assert.equals(this.stop.day, 4);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 3600000);
    },
    
    "test parse('04/April/2001:10:23:45.678 -01', roundDown= false)": function () {
        this.stop.parse('04/April/2001:10:23:45.678 -01', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 3);
        assert.equals(this.stop.day, 4);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, -3600000);
    },
    
    "test parse('04/April/2001:10:23:45.678 +0130', roundDown= false)": function () {
        this.stop.parse('04/April/2001:10:23:45.678 +0130', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 3);
        assert.equals(this.stop.day, 4);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, 5400000);
    },
    
    "test parse('04/April/2001:10:23:45 -0600', roundDown= false)": function () {
        this.stop.parse('04/APR/2001:10:23:45 -0600', false);
        
        assert.equals(this.stop.year, 2001);
        assert.equals(this.stop.month, 3);
        assert.equals(this.stop.day, 4);
        assert.equals(this.stop.hours, 10);
        assert.equals(this.stop.minutes, 23);
        assert.equals(this.stop.seconds, 45);
        assert.equals(this.stop.timezone, -21600000);
    },
    
    "test parse('invalid-date', roundDone= true)": function () {
        var self = this;
        assert.exception(function () {
            self.stop.parse('invalid-date', true);
        });
    },
    
    "test lastReboot()": function (done) {
        var pathname = path.join(testData.getDataDirectory(), 'datetime', 'valid');
        scanfile.setRootDirectory(pathname);
        var promise = this.d.lastReboot();
        assert(when.isPromiseLike(promise));
        promise.then(function (reboot) {
            assert.equals(reboot.year, 2013);
            assert.equals(reboot.month, 9);
            assert.equals(reboot.day, 28);
            assert.equals(reboot.hours, 10);
            assert.equals(reboot.minutes, 9);
            assert.equals(reboot.seconds, 52);
            assert.equals(reboot.timezone, 0);
            done();
        });
    },
    
    "test lastReboot (missing wtmp)": function (done) {
        var pathname = path.join(testData.getDataDirectory(), 'datetime', 'missing');
        scanfile.setRootDirectory(pathname);
        var promise = this.d.lastReboot();
        assert(when.isPromiseLike(promise));
        promise.then(function (reboot) {
            assert.equals(reboot.year, undefined);
            assert.equals(reboot.month, undefined);
            assert.equals(reboot.day, undefined);
            assert.equals(reboot.hours, undefined);
            assert.equals(reboot.minutes, undefined);
            assert.equals(reboot.seconds, undefined);
            assert.equals(reboot.timezone, undefined);
            done();
        });
    },
    
    "test parsePartialDate('reboot', roundDown= false)": function (done) {
        var pathname = path.join(testData.getDataDirectory(), 'datetime', 'valid');
        scanfile.setRootDirectory(pathname);
        var promise = this.d.parsePartialDate('reboot', false);
        assert(when.isPromiseLike(promise));
        promise.then(function (reboot) {
            assert.equals(reboot.year, 2013);
            assert.equals(reboot.month, 9);
            assert.equals(reboot.day, 28);
            assert.equals(reboot.hours, 10);
            assert.equals(reboot.minutes, 9);
            assert.equals(reboot.seconds, 52);
            assert.equals(reboot.timezone, 0);
            done();
        });
    },
    
    "test parsePartialDate('10', roundDown= true)": function () {
        var promise = this.d.parsePartialDate('10', true);
        assert(when.isPromiseLike(promise));
    },
    
    "test parsePartialDate('10', roundDown= false)": function () {
        var promise = this.d.parsePartialDate('10', false);
        assert(when.isPromiseLike(promise));
    },
    
    "test calculateStartStop(stop=empty, start=empty, slotWidth=Infinity)": function () {
        var startStop = this.d.calculateStartStop(this.start, this.stop, Infinity);
        var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
        var expectedStop = new Date();
        assert.isObject(startStop);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start, expectedStart);
        assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
        assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
        assert.equals(startStop.stop.getDate(), expectedStop.getDate());
        assert.equals(startStop.stop.getHours(), 23);
        assert.equals(startStop.stop.getMinutes(), 59);
        assert.equals(startStop.stop.getSeconds(), 59);
        assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    },

    "test calculateStartStop(stop=empty, start=empty, slotWidth=86400)": function () {
        var startStop = this.d.calculateStartStop(this.start, this.stop, 86400);
        var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
        var expectedStop = new Date();
        assert.isObject(startStop);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start, expectedStart);
        assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
        assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
        assert.equals(startStop.stop.getDate(), expectedStop.getDate());
        assert.equals(startStop.stop.getHours(), 23);
        assert.equals(startStop.stop.getMinutes(), 59);
        assert.equals(startStop.stop.getSeconds(), 59);
        assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    },
    
    "test calculateStartStop(stop=empty, start=empty, slotWidth=3600)": function () {
        var startStop = this.d.calculateStartStop(this.start, this.stop, 3600);
        var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
        var expectedStop = new Date();
        assert.isObject(startStop);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start, expectedStart);
        assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
        assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
        assert.equals(startStop.stop.getDate(), expectedStop.getDate());
        assert.equals(startStop.stop.getHours(), expectedStop.getHours());
        assert.equals(startStop.stop.getMinutes(), 59);
        assert.equals(startStop.stop.getSeconds(), 59);
        assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    },
    
    "test calculateStartStop(stop=empty, start=empty, slotWidth=60)": function () {
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        var expectedStart = new Date(2001, 0, 1, 0, 0, 0);
        var expectedStop = new Date();
        assert.isObject(startStop);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start, expectedStart);
        assert.equals(startStop.stop.getFullYear(), expectedStop.getFullYear());
        assert.equals(startStop.stop.getMonth(), expectedStop.getMonth());
        assert.equals(startStop.stop.getDate(), expectedStop.getDate());
        assert.equals(startStop.stop.getHours(), expectedStop.getHours());
        assert.near(startStop.stop.getMinutes(), expectedStop.getMinutes(), 1);
        assert.equals(startStop.stop.getSeconds(), 59);
        assert.equals(startStop.stop.getTimezoneOffset(), expectedStop.getTimezoneOffset());
    },
    
    "test calculateStartStop(stop=year isNaN)": function () {
        this.stop.year = 'twenty-twelve';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/year is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=year < 1970)": function () {
        this.stop.year = 1900;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected year > 1970/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=month isNaN)": function () {
        this.stop.month = 'January';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/month is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=month < 0)": function () {
        this.stop.month = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/month is out of range/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=month > 11)": function () {
        this.stop.month = 12;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/month is out of range/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day isNaN)": function () {
        this.stop.day = 'first';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/day is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day is zero)": function () {
        this.stop.day = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/01/31)": function () {
        this.stop.year = 2013
        this.stop.month = 0;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/01/32)": function () {
        this.stop.year = 2013
        this.stop.month = 0;
        this.stop.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/02/29)": function () {
        this.stop.year = 2013
        this.stop.month = 1;
        this.stop.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2012/02/29)": function () {
        this.stop.year = 2012
        this.stop.month = 1;
        this.stop.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2012/02/30)": function () {
        this.stop.year = 2012
        this.stop.month = 1;
        this.stop.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2000/02/29)": function () {
        this.stop.year = 2000
        this.stop.month = 1;
        this.stop.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2000/02/30)": function () {
        this.stop.year = 2000
        this.stop.month = 1;
        this.stop.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2100/02/28)": function () {
        this.stop.year = 2100
        this.stop.month = 1;
        this.stop.day = 28;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2100/02/29)": function () {
        this.stop.year = 2100
        this.stop.month = 1;
        this.stop.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/03/31)": function () {
        this.stop.year = 2013
        this.stop.month = 2;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/03/32)": function () {
        this.stop.year = 2013
        this.stop.month = 2;
        this.stop.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/04/30)": function () {
        this.stop.year = 2013
        this.stop.month = 3;
        this.stop.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/04/31)": function () {
        this.stop.year = 2013
        this.stop.month = 3;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/05/31)": function () {
        this.stop.year = 2013
        this.stop.month = 4;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/05/32)": function () {
        this.stop.year = 2013
        this.stop.month = 4;
        this.stop.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/06/30)": function () {
        this.stop.year = 2013
        this.stop.month = 5;
        this.stop.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/06/31)": function () {
        this.stop.year = 2013
        this.stop.month = 5;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/07/31)": function () {
        this.stop.year = 2013
        this.stop.month = 6;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/07/32)": function () {
        this.stop.year = 2013
        this.stop.month = 6;
        this.stop.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/08/31)": function () {
        this.stop.year = 2013
        this.stop.month = 7;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/08/32)": function () {
        this.stop.year = 2013
        this.stop.month = 7;
        this.stop.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/09/30)": function () {
        this.stop.year = 2013
        this.stop.month = 8;
        this.stop.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/09/31)": function () {
        this.stop.year = 2013
        this.stop.month = 8;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/10/31)": function () {
        this.stop.year = 2013
        this.stop.month = 9;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/10/32)": function () {
        this.stop.year = 2013
        this.stop.month = 9;
        this.stop.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/11/30)": function () {
        this.stop.year = 2013
        this.stop.month = 10;
        this.stop.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/11/31)": function () {
        this.stop.year = 2013
        this.stop.month = 10;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=day 2013/12/31)": function () {
        this.stop.year = 2013
        this.stop.month = 11;
        this.stop.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=day 2013/12/32)": function () {
        this.stop.year = 2013
        this.stop.month = 11;
        this.stop.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=hours isNaN)": function () {
        this.stop.hours = 'Noon';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/hours is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=hours < 0)": function () {
        this.stop.hours = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=hours == 0)": function () {
        this.stop.hours = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=hours is 24)": function () {
        this.stop.hours = 24;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=hours == 23)": function () {
        this.stop.hours = 23;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=minutes isNaN)": function () {
        this.stop.minutes = 'none';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/minutes is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=minutes < 0)": function () {
        this.stop.minutes = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=minutes == 0)": function () {
        this.stop.minutes = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=minutes is 60)": function () {
        this.stop.minutes = 60;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=minutes == 59)": function () {
        this.stop.minutes = 59;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },

    "test calculateStartStop(stop=seconds isNaN)": function () {
        this.stop.seconds = 'zero';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/seconds is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=seconds < 0)": function () {
        this.stop.seconds = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=seconds == 0)": function () {
        this.stop.seconds = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(stop=seconds is 60)": function () {
        this.stop.seconds = 60;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(stop=seconds == 59)": function () {
        this.stop.seconds = 59;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },

    "test calculateStartStop(stop=timezone isNaN)": function () {
        this.stop.timezone = 'UTC';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/timezone is not a number/.test(startStop.errors[0].message));
    },

    "test calculateStartStop(stop=timezone <= -24 hours)": function () {
        this.stop.timezone = -24 * 60 * 60 * 1000;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/timezone is out of range/.test(startStop.errors[0].message));
    },

    "test calculateStartStop(stop=timezone > -24 hours)": function () {
        this.stop.timezone = (-24 * 60 * 60 * 1000) + 1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },

    "test calculateStartStop(stop=timezone >= 24 hours)": function () {
        this.stop.timezone = 24 * 60 * 60 * 1000;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/timezone is out of range/.test(startStop.errors[0].message));
    },

    "test calculateStartStop(stop=timezone < 24 hours)": function () {
        this.stop.timezone = (24 * 60 * 60 * 1000) - 1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=year isNaN)": function () {
        this.start.year = 'twenty-twelve';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/year is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=year < 1970)": function () {
        this.start.year = 1900;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.start, undefined);
        assert.equals(startStop.stop, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected year > 1970/.test(startStop.errors[0].message));
    },

    "test calculateStartStop(start=month isNaN)": function () {
        this.start.month = 'January';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.start, undefined);
        assert.equals(startStop.stop, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/month is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=month < 0)": function () {
        this.start.month = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.start, undefined);
        assert.equals(startStop.stop, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/month is out of range/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=month > 11)": function () {
        this.start.month = 12;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.start, undefined);
        assert.equals(startStop.stop, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/month is out of range/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day isNaN)": function () {
        this.start.day = 'first';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.start, undefined);
        assert.equals(startStop.stop, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/day is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day is zero)": function () {
        this.start.day = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.start, undefined);
        assert.equals(startStop.stop, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/01/31)": function () {
        this.start.year = 2013
        this.start.month = 0;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.start, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/01/32)": function () {
        this.start.year = 2013
        this.start.month = 0;
        this.start.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/02/29)": function () {
        this.start.year = 2013
        this.start.month = 1;
        this.start.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2012/02/29)": function () {
        this.start.year = 2012
        this.start.month = 1;
        this.start.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2012/02/30)": function () {
        this.start.year = 2012
        this.start.month = 1;
        this.start.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2000/02/29)": function () {
        this.start.year = 2000
        this.start.month = 1;
        this.start.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2000/02/30)": function () {
        this.start.year = 2000
        this.start.month = 1;
        this.start.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2100/02/28)": function () {
        this.stop.year = 2100;
        this.stop.month = 11;
        this.stop.day = 31;
        this.start.year = 2100
        this.start.month = 1;
        this.start.day = 28;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2100/02/29)": function () {
        this.start.year = 2100
        this.start.month = 1;
        this.start.day = 29;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/03/31)": function () {
        this.start.year = 2013
        this.start.month = 2;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/03/32)": function () {
        this.start.year = 2013
        this.start.month = 2;
        this.start.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/04/30)": function () {
        this.start.year = 2013
        this.start.month = 3;
        this.start.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/04/31)": function () {
        this.start.year = 2013
        this.start.month = 3;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/05/31)": function () {
        this.start.year = 2013
        this.start.month = 4;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/05/32)": function () {
        this.start.year = 2013
        this.start.month = 4;
        this.start.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/06/30)": function () {
        this.start.year = 2013
        this.start.month = 5;
        this.start.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/06/31)": function () {
        this.start.year = 2013
        this.start.month = 5;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/07/31)": function () {
        this.start.year = 2013
        this.start.month = 6;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/07/32)": function () {
        this.start.year = 2013
        this.start.month = 6;
        this.start.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/08/31)": function () {
        this.start.year = 2013
        this.start.month = 7;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/08/32)": function () {
        this.start.year = 2013
        this.start.month = 7;
        this.start.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2013/09/30)": function () {
        this.start.year = 2013
        this.start.month = 8;
        this.start.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2013/09/31)": function () {
        this.start.year = 2013
        this.start.month = 8;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2012/10/31)": function () {
        this.start.year = 2012
        this.start.month = 9;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2012/10/32)": function () {
        this.start.year = 2012
        this.start.month = 9;
        this.start.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2012/11/30)": function () {
        this.start.year = 2012
        this.start.month = 10;
        this.start.day = 30;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2012/11/31)": function () {
        this.start.year = 2012
        this.start.month = 10;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=day 2012/12/31)": function () {
        this.start.year = 2012
        this.start.month = 11;
        this.start.day = 31;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=day 2012/12/32)": function () {
        this.start.year = 2012
        this.start.month = 11;
        this.start.day = 32;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/day of month/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=hours isNaN)": function () {
        this.start.hours = 'Noon';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/hours is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=hours < 0)": function () {
        this.start.hours = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=hours == 0)": function () {
        this.start.hours = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=hours is 24)": function () {
        this.start.hours = 24;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= hours <= 23/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=hours == 23)": function () {
        this.start.year = 2012;
        this.start.month = 0;
        this.start.day = 1;
        this.start.hours = 23;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=minutes isNaN)": function () {
        this.start.minutes = 'none';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/minutes is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=minutes < 0)": function () {
        this.start.minutes = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=minutes == 0)": function () {
        this.start.hours = 0;
        this.start.minutes = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=minutes is 60)": function () {
        this.start.minutes = 60;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= minutes <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=minutes == 59)": function () {
        this.start.hours = 0;
        this.start.minutes = 59;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },

    "test calculateStartStop(start=seconds isNaN)": function () {
        this.start.seconds = 'zero';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/seconds is not a number/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=seconds < 0)": function () {
        this.start.seconds = -1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=seconds == 0)": function () {
        this.start.hours = 0;
        this.start.minutes = 0;
        this.start.seconds = 0;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },
    
    "test calculateStartStop(start=seconds is 60)": function () {
        this.start.seconds = 60;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/expected 0 <= seconds <= 59/.test(startStop.errors[0].message));
    },
    
    "test calculateStartStop(start=seconds == 59)": function () {
        this.start.hours = 0;
        this.start.minutes = 0;
        this.start.seconds = 59;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },

    "test calculateStartStop(start=timezone isNaN)": function () {
        this.start.timezone = 'UTC';
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof Error);
        assert(/timezone is not a number/.test(startStop.errors[0].message));
    },

    "test calculateStartStop(start=timezone <= -24 hours)": function () {
        this.start.timezone = -24 * 60 * 60 * 1000;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/timezone is out of range/.test(startStop.errors[0].message));
    },

    "test calculateStartStop(start=timezone > -24 hours)": function () {
        this.start.year = 2012;
        this.start.month = 0;
        this.start.day = 1;
        this.start.hours = 0;
        this.start.minutes = 0;
        this.start.seconds = 0;
        this.start.timezone = (-24 * 60 * 60 * 1000) + 1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },

    "test calculateStartStop(start=timezone >= 24 hours)": function () {
        this.start.timezone = 24 * 60 * 60 * 1000;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/timezone is out of range/.test(startStop.errors[0].message));
    },

    "test calculateStartStop(start=timezone < 24 hours)": function () {
        this.start.year = 2012;
        this.start.month = 0;
        this.start.day = 1;
        this.start.hours = 0;
        this.start.minutes = 0;
        this.start.seconds = 0;
        this.start.timezone = (24 * 60 * 60 * 1000) - 1;
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
    },

    "test calculateStartStop(start > stop)": function () {
        this.start.year = 2013;
        this.start.month = 0;
        this.start.day = 1;
        this.start.hours = 0;
        this.start.minutes = 0;
        this.start.seconds = 0;
        this.start.timezone = 0;
        this.stop.year = 2012;
        this.stop.month = 0;
        this.stop.day = 1;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;
        this.stop.timezone = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        assert.equals(startStop.stop, undefined);
        assert.equals(startStop.start, undefined);
        assert.isArray(startStop.errors);
        assert.equals(startStop.errors.length, 1);
        assert(startStop.errors[0] instanceof RangeError);
        assert(/Start time .* is after stop time/.test(startStop.errors[0].message));
    },

    "test calculateStartStop() go back one day": function () {
        this.stop.year = 2012;
        this.stop.month = 0;
        this.stop.day = 10;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;

        this.start.hours = 10;
        this.start.minutes = 0;
        this.start.seconds = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start.getFullYear(), 2012);
        assert.equals(startStop.start.getMonth(), 0);
        assert.equals(startStop.start.getDate(), 9);
        assert.equals(startStop.start.getHours(), 10);
        assert.equals(startStop.start.getMinutes(), 0);
        assert.equals(startStop.start.getSeconds(), 0);
    },
    
    "test calcualteStartStop() go back one month - timezone set": function () {
        this.stop.year = 2012;
        this.stop.month = 1;
        this.stop.day = 10;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;
        this.stop.timezone = 0;

        this.start.day = 11;
        this.start.hours = 10;
        this.start.minutes = 0;
        this.start.seconds = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start.getUTCFullYear(), 2012);
        assert.equals(startStop.start.getUTCMonth(), 0);
        assert.equals(startStop.start.getUTCDate(), 11);
        assert.equals(startStop.start.getUTCHours(), 10);
        assert.equals(startStop.start.getUTCMinutes(), 0);
        assert.equals(startStop.start.getUTCSeconds(), 0);
    },
    
    "test calculateStartStop() go back one month to december - timezone set": function () {
        this.stop.year = 2012;
        this.stop.month = 0;
        this.stop.day = 10;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;
        this.stop.timezone = 0;

        this.start.day = 11;
        this.start.hours = 10;
        this.start.minutes = 0;
        this.start.seconds = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start.getUTCFullYear(), 2011);
        assert.equals(startStop.start.getUTCMonth(), 11);
        assert.equals(startStop.start.getUTCDate(), 11);
        assert.equals(startStop.start.getUTCHours(), 10);
        assert.equals(startStop.start.getUTCMinutes(), 0);
        assert.equals(startStop.start.getUTCSeconds(), 0);
    },
    
    "test calcualteStartStop() go back one month - timezone undefined": function () {
        this.stop.year = 2012;
        this.stop.month = 2;
        this.stop.day = 10;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;

        this.start.day = 12;
        this.start.hours = 10;
        this.start.minutes = 0;
        this.start.seconds = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start.getFullYear(), 2012);
        assert.equals(startStop.start.getMonth(), 1);
        assert.equals(startStop.start.getDate(), 12);
        assert.equals(startStop.start.getHours(), 10);
        assert.equals(startStop.start.getMinutes(), 0);
        assert.equals(startStop.start.getSeconds(), 0);
    },
    
    "test calculateStartStop() go back one month to december - timezone undefined": function () {
        this.stop.year = 2012;
        this.stop.month = 0;
        this.stop.day = 10;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;

        this.start.day = 11;
        this.start.hours = 10;
        this.start.minutes = 0;
        this.start.seconds = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start.getFullYear(), 2011);
        assert.equals(startStop.start.getMonth(), 11);
        assert.equals(startStop.start.getDate(), 11);
        assert.equals(startStop.start.getHours(), 10);
        assert.equals(startStop.start.getMinutes(), 0);
        assert.equals(startStop.start.getSeconds(), 0);
    },
    
    "test calculateStartStop() go back one year - timezone set": function () {
        this.stop.year = 2012;
        this.stop.month = 2;
        this.stop.day = 10;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;
        this.stop.timezone = 0;

        this.start.month = 10;
        this.start.day = 11;
        this.start.hours = 10;
        this.start.minutes = 0;
        this.start.seconds = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start.getUTCFullYear(), 2011);
        assert.equals(startStop.start.getUTCMonth(), 10);
        assert.equals(startStop.start.getUTCDate(), 11);
        assert.equals(startStop.start.getUTCHours(), 10);
        assert.equals(startStop.start.getUTCMinutes(), 0);
        assert.equals(startStop.start.getUTCSeconds(), 0);
    },
    
    "test calculateStartStop() go back one year - timezone undefined": function () {
        this.stop.year = 2012;
        this.stop.month = 2;
        this.stop.day = 10;
        this.stop.hours = 0;
        this.stop.minutes = 0;
        this.stop.seconds = 0;

        this.start.month = 10;
        this.start.day = 11;
        this.start.hours = 10;
        this.start.minutes = 0;
        this.start.seconds = 0;
        
        var startStop = this.d.calculateStartStop(this.start, this.stop, 60);
        assert.isObject(startStop);
        refute.equals(startStop.stop, undefined);
        refute.equals(startStop.start, undefined);
        assert.equals(startStop.errors, undefined);
        assert.equals(startStop.start.getFullYear(), 2011);
        assert.equals(startStop.start.getMonth(), 10);
        assert.equals(startStop.start.getDate(), 11);
        assert.equals(startStop.start.getHours(), 10);
        assert.equals(startStop.start.getMinutes(), 0);
        assert.equals(startStop.start.getSeconds(), 0);
    },
    
});

