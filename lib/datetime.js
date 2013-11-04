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
var scanfile = require("./scanfile.js");
var util = require("util");
var when = require("when");

// -------------------------------------------------------------------------

/**
 * PartialDate constructor @ctor.
 * A PartialDate is used to define date-time option which allows some values
 * to be determined by additional information.
 * i.e. the start time may have fields defined based upon the stop time, and
 * the stop time may have fields defined based upon the current time.
 */
function PartialDate() {
    this.year       = undefined;
    this.month      = undefined;
    this.day        = undefined;
    this.hours      = undefined;
    this.minutes    = undefined;
    this.seconds    = undefined;
    this.timezone   = undefined;
    return this;
};

/**
 *  Define the PartialDate object based upon a milliseconds since start of epoch timestamp.
 *  @arg timestamp is a Number of milliseconds since the start of the Epoch.
 *  @rtype PartialDate is a reference to the object.
 */
PartialDate.prototype.setTime = function(timestamp) {
    var time = new Date(timestamp);
    this.year     = time.getUTCFullYear();
    this.month    = time.getUTCMonth();
    this.day      = time.getUTCDate();
    this.hours    = time.getUTCHours();
    this.minutes  = time.getUTCMinutes();
    this.seconds  = time.getUTCSeconds();
    this.timezone = 0;
    return this;
}

/** RegExp to recognize seconds since start of Unix epoch. */
PartialDate.secondsSinceEpoch = new RegExp(/^@(\d+)$/);
    
/** RegExp to recognize time stamp only. */
PartialDate.hhmmss = new RegExp(/^(\d{1,2})((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
    
/** RegExp to recognize date and time pattern. */
PartialDate.yyyymmdd_hhmmss = new RegExp(/^((\d\d\d\d)([-/]))?((\d{1,2})([-/]))?(\d{1,2})(T|\s|:)(\d{1,2})((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
    
/** RegExp for year first named month date-time pattern. */
PartialDate.yyyyMMMdd_hhmmss =
    new RegExp(/^((\d\d\d\d)(?:[-/]))?(([A-Za-z]+)(?:[-/]))?(\d{1,2})(?:T|\s|:)(\d{1,2})((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
    
/** RegExp for day first named month date-time pattern. */
PartialDate.ddMMMyyyy_hhmmss =
    new RegExp(/^(\d{1,2})[-/]([A-Za-z]+)([-/](\d\d\d\d))?(T|\s|:)?(\d{1,2})?(:?(\d\d))?(:?(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
    
/** Array of Full month names in lower-case English. */
PartialDate.fullMonthNames = [ "january", "february", "march", "april", 
                               "may", "june", "july", "august", 
                               "september", "october", "november", "december" ];

/** Array of three-letter month names in lower-case English. */
PartialDate.monthNames = [ "jan", "feb", "mar", "apr", "may", "jun",
                           "jul", "aug", "sep", "oct", "nov", "dec" ];

/**
 *  Determine if string date is valid.
 *  @arg value is the date-time as a string.
 *  @rtype Boolean.
 */
PartialDate.isValidFormat = function(value) {
//    console.log("PartialDate.isValidFormat: " + value);
//    console.dir(PartialDate.hhmmss);
//    console.dir(PartialDate.hhmmss.test(value));
    if (PartialDate.hhmmss.test(value) ||
        PartialDate.yyyymmdd_hhmmss.test(value) ||
        PartialDate.secondsSinceEpoch.test(value) ||
        PartialDate.yyyyMMMdd_hhmmss.test(value) ||
        PartialDate.ddMMMyyyy_hhmmss.test(value) ) {
//        console.log("isValidFormat: returning true");
        return true;
    }
//    console.log("isValidFormat: returning false");
    return false;
};

/**
 *  Parse a date-time string into the PartialDate value.
 *  @arg timestamp is String value.
 *  @arg roundDown is Boolean, true if parse value should be rounded down
 *  to the nearest time.
 *  @rtype PartialDate reference to current object.
 */
PartialDate.prototype.parse = function(timestamp, roundDown) {
    var pattern;
    var zone;
    pattern = PartialDate.hhmmss.exec(timestamp);
//    console.dir(pattern);
    if (pattern != null) {
//        console.log("hhmmss, pattern="+util.inspect(pattern));
        this.hours = parseInt(pattern[1], 10);
        if (pattern[4] === undefined) {
            this.minutes = roundDown ? 0 : 59;
        } else {
            this.minutes = parseInt(pattern[4], 10);
        }
        if (pattern[7] === undefined) {
            this.seconds = roundDown ? 0 : 59;
        } else {
            this.seconds = parseInt(pattern[7], 10);
        }
        if (pattern[9] !== undefined) { // local time
            if (pattern[9] == 'Z') {
                zone = 0;
            } else {
                if (pattern[12] === undefined) {
                    zone = 0;
                } else {
                    zone = parseInt(pattern[12], 10) * 60000;
                }
                zone += parseInt(pattern[11], 10) * 3600000;
                if (pattern[10] == '-') {
                    zone = -zone;
                }
            }
            this.timezone = zone;
        }
        return this;
    }
    pattern = PartialDate.secondsSinceEpoch.exec(timestamp);
    if (pattern != null) {
//        console.log("secondsSinceEpoch, pattern="+util.inspect(pattern));
        this.setTime(1000 * parseInt(pattern[1], 10));
        return this;
    }
    pattern = PartialDate.yyyymmdd_hhmmss.exec(timestamp);
    if (pattern != null) {
//        console.log("yyyymmdd_hhmmss, pattern="+util.inspect(pattern));
        if (pattern[2] !== undefined) {
            this.year = parseInt(pattern[2], 10);
        }
        if (pattern[5] !== undefined) {
            this.month = parseInt(pattern[5], 10)-1;
        }
        this.day = parseInt(pattern[7], 10);
        if (pattern[9] === undefined) {
            this.hours = roundDown ? 0 : 23;
        } else {
            this.hours = parseInt(pattern[9], 10);
        }
        if (pattern[12] === undefined) {
            this.minutes = roundDown ? 0 : 59;
        } else {
            this.minutes = parseInt(pattern[12], 10);
        }
        if (pattern[15] === undefined) {
            this.seconds = roundDown ? 0 : 59;
        } else {
            this.seconds = parseInt(pattern[15], 10);
        }
        if (pattern[17] !== undefined) {
            if (pattern[17] == 'Z') {
                zone = 0;
            } else {
                if (pattern[20] === undefined) {
                    zone = 0;
                } else {
                    zone = parseInt(pattern[20], 10) * 60000;
                }
                zone += parseInt(pattern[19], 10) * 3600000;
                if (pattern[18] == '-') {
                    zone = -zone;
                }
            }
            this.timezone = zone;
        }            
        return this;
    }
    pattern = PartialDate.yyyyMMMdd_hhmmss.exec(timestamp);
    if (pattern != null) {
//        console.log("yyyyMMMdd_hhmmss: pattern="+util.inspect(pattern));
        if (pattern[2] !== undefined) {
            this.year = parseInt(pattern[2], 10);
        }
        if (pattern[4] !== undefined) {
            this.month = PartialDate.monthNames.indexOf(pattern[4].toLowerCase());
            if (this.month < 0) {
                this.month = PartialDate.fullMonthNames.indexOf(pattern[4].toLowerCase());
                if (this.month < 0) {
                    this.month = undefined;
                }
            }
        }
        this.day = parseInt(pattern[5], 10);
        if (pattern[6] === undefined) {
            this.hours = roundDown ? 0 : 23;
        } else {
            this.hours = parseInt(pattern[6], 10);
        }
        if (pattern[9] === undefined) {
            this.minutes = roundDown ? 0 : 59;
        } else {
            this.minutes = parseInt(pattern[9], 10);
        }
        if (pattern[12] === undefined) {
            this.seconds = roundDown ? 0 : 59;
        } else {
            this.seconds = parseInt(pattern[12], 10);
        }
        if (pattern[14] !== undefined) {
            if (pattern[14] == 'Z') {
                zone = 0;
            } else {
                if (pattern[17] === undefined) {
                    zone = 0;
                } else {
                    zone = parseInt(pattern[17], 10) * 60000;
                }
                if (pattern[16] !== undefined) {
                    zone += parseInt(pattern[16], 10) * 3600000;
                }
                if (pattern[15] == '-') {
                    zone = -zone;
                }
            }
            this.timezone = zone;
        }
        return this;
    }
    pattern = PartialDate.ddMMMyyyy_hhmmss.exec(timestamp);
    if (pattern != null) {
//        console.log("ddMMMyyyy_hhmmss: pattern="+util.inspect(pattern));
        if (pattern[4] !== undefined) {
            this.year = parseInt(pattern[4], 10);
        }
        if (pattern[2] !== undefined) {
            this.month = PartialDate.monthNames.indexOf(pattern[2].toLowerCase());
            if (this.month < 0) {
                this.month = PartialDate.fullMonthNames.indexOf(pattern[2].toLowerCase());
                if (this.month < 0) {
                    this.month = undefined;
                }
            }
        }
        this.day = parseInt(pattern[1], 10);
        if (pattern[6] === undefined) {
            this.hours = roundDown ? 0 : 23;
        } else {
            this.hours = parseInt(pattern[6], 10);
        }
        if (pattern[8] === undefined) {
            this.minutes = roundDown ? 0 : 59;
        } else {
            this.minutes = parseInt(pattern[8], 10);
        }
        if (pattern[10] === undefined) {
            this.seconds = roundDown ? 0 : 59;
        } else {
            this.seconds = parseInt(pattern[10], 10);
        }
        if (pattern[12] !== undefined) {
            if (pattern[12] == 'Z') {
                zone = 0;
            } else {
                if (pattern[15] === undefined) {
                    zone = 0;
                } else {
                    zone = parseInt(pattern[15], 10) * 60000;
                }
                if (pattern[14] !== undefined) {
                    zone += parseInt(pattern[14], 10) * 3600000;
                }
                if (pattern[13] == '-') {
                    zone = -zone;
                }
            }
            this.timezone = zone;
        }
    
        return this;
    }
    throw new Error("Invalid date-time: " + timestamp);
    return this;
};

/** Number of days in each month in a non-leap year. */
var lastDayNonLeap = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Number of days in each month in a leap year. */
var lastDayLeap =    [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 *  Check date settings for valid ranges.
 *  Return undefined if valid. if not return array of Error objects.
 */
function validateDateSettings(timestamp, year, month, day, hours, minutes, seconds, timezone) {
    var isLeap;
    var lastDay;
    var errs = new Array();
    
    if (isNaN(year)) {
        errs.push(new Error("Invalid " + timestamp + " year is not a number."));
    } else if (year < 1970) {
        errs.push(new RangeError("Invalid " + timestamp + " year (expected year > 1970): " + year));
    }
    if (((year % 4) == 0) && (((year % 100) != 0) || ((year % 400) == 0))) {
        isLeap = true;
    } else {
        isLeap = false;
    }
    if (isNaN(month)) {
        errs.push(new Error("Invalid " + timestamp + " month is not a number."));
    } else if ((month < 0) || (month > 11)) {
        errs.push(new RangeError("Invalid " + timestamp + " month is out of range."));
    }
    lastDay = isLeap ? lastDayLeap[month] : lastDayNonLeap[month];
    if (isNaN(day)) {
        errs.push(new Error("Invalid " + timestamp + " day is not a number."));
    } else if ((day < 1) || (day > lastDay)) {
        errs.push(new RangeError("Invalid " + timestamp + " day of month (expected 1 <= day <= " + lastDay + "): " + day));
    }
    if (isNaN(hours)) {
        errs.push(new Error("Invalid " + timestamp + " hours is not a number."));
    } else if ((hours < 0) || (hours > 23)) {
        errs.push(new RangeError("Invalid " + timestamp + " hour (expected 0 <= hours <= 23): " + hours));
    }
    if (isNaN(minutes)) {
        errs.push(new Error("Invalid " + timestamp + " minutes is not a number."));
    } else if ((minutes < 0) || (minutes > 59)) {
        errs.push(new RangeError("Invalid " + timestamp + " minutes (expected 0 <= minutes <= 59): " + minutes));
    }
    if (isNaN(seconds)) {
        errs.push(new Error("Invalid " + timestamp + " seconds is not a number."));
    } else if ((seconds < 0) || (seconds > 59)) {
        errs.push(new RangeError("Invalid " + timestamp + " seconds (expected 0 <= seconds <= 59): " + seconds));
    }
    if (timezone !== undefined) {
        if (isNaN(timezone)) {
            errs.push(new Error("Invalid " + timestamp + " timezone is not a number."));
        } else if ((timezone <= -86400000) || (timezone >= 86400000)) {
            errs.push(new RangeError("Invalid " + timestamp + " timezone is out of range."));
        }
    }
    if (errs.length == 0) {
        return undefined;
    }
    return errs;
}

var datetime = module.exports = {
    /**
     * Determine date-time from last reboot.
     * @rtype promise to a PartialDate value.
     */
    lastReboot : function() {
        var result = new PartialDate();
        var d = when.defer();
        var UtmpParser = require("utmp");
        var wtmp;
        var e;
        var lastTimestamp = 0;

        try { 
            wtmp = new UtmpParser(scanfile.getRootPathname("/var/log/wtmp"));
            wtmp.on('data', function (d) {
                if (d.type == 'BOOT_TIME') {
                    lastTimestamp = d.timestamp.getTime();
                }
            });
        
            wtmp.on('end', function () {
                result.setTime(lastTimestamp);
                d.resolve(result);
            });
            wtmp.run();
        } catch (e) {
            d.resolve(result);
        }
        return d.promise;
    },
    
    /**
     *  Parse a string into a PartialDate value.
     *  @arg timestamp - date-time string.
     *  @arg roundDown - true if start time, false if stop time.
     *  @rtype promise for a PartialDate object.
     */
    parsePartialDate : function (timestamp, roundDown) {
        if (timestamp == 'reboot') {
//            console.log("calling lastReboot()");
            return datetime.lastReboot();
        }
        
        var result = new PartialDate();
//        console.log("calling result.parse: " + timestamp + ", " + roundDown);
        result.parse(timestamp, roundDown);
//        console.log(util.inspect(result, { showHidden : true, depth: null }));
        return when(result);
    },


    /**
     *  Calculate the actual start and stop Dates from the PartialDates
     *  derived from the command-line parameters.
     *  @rtype Object with start, stop and error array fields.
     */
    calculateStartStop : function (start, stop, slotWidth) {
        var now = new Date();
        var startDate = undefined;
        var stopDate = undefined;
        var useUTC;
        var year, month, day, hours, minutes, seconds;
        var errs = undefined;

        if (process.env.ALSCAN_TESTING_NOW) {
            now.setTime(Date.parse(process.env.ALSCAN_TESTING_NOW));
        }

        if ((start.timezone === undefined) && (stop.timezone === undefined)) {
            useUTC = false;
        } else {
            useUTC = true;
            if ((start.timezone === undefined) && (stop.timezone !== undefined)) {
                start.timezone = stop.timezone;
            } else if ((start.timezone !== undefined) && (stop.timezone === undefined)) {
                stop.timezone = start.timezone;
            }
        }
        if (stop.hours === undefined) {
            if (slotWidth >= 86400) {
                hours = 23;
            } else {
                hours = useUTC ? now.getUTCHours() : now.getHours();
            }
        } else {
            hours = stop.hours;
        }
        if (stop.minutes === undefined) {
            if (slotWidth > 60) {
                minutes = 59;
            } else {
                minutes = useUTC ? now.getUTCMinutes() : now.getMinutes();
            }
        } else {
            minutes = stop.minutes;
        }
        if (stop.seconds === undefined) {
            seconds = 59;
        } else {
            seconds = stop.seconds;
        }
        if (stop.day === undefined) {
            day = useUTC ? now.getUTCDate() : now.getDate();
        } else {
            day = stop.day;
        }
        if (stop.month === undefined) {
            month = useUTC ? now.getUTCMonth() : now.getMonth();
        } else {
            month = stop.month;
        }
        if (stop.year === undefined) {
            year = useUTC ? now.getUTCFullYear() : now.getFullYear();
        } else {
            year = stop.year;
        }
        errs = validateDateSettings('stop', year, month, day, hours, minutes, seconds, stop.timezone);
        if (errs === undefined) {
            if (useUTC) {
//                console.log("Date.UTC=" + Date.UTC(year, month, day, hours, minutes, seconds, 0));
                stopDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));
                stopDate.setTime(stopDate.getTime() - stop.timezone);
            } else {
                stopDate = new Date(year, month, day, hours, minutes, seconds, 0);
            }
//            console.log("stopDate="+util.inspect(stopDate)+"="+stopDate.getTime());
            if (start.seconds !== undefined) {
                seconds = start.seconds;
            }
            if (start.minutes !== undefined) {
                minutes = start.minutes;
            }
            if (start.hours !== undefined) {
                hours = start.hours;
            }
            if (start.day !== undefined) {
                day = start.day;
            }
            if (start.month !== undefined) {
                month = start.month;
            }
            if (start.year !== undefined) {
                year = start.year;
            }

            errs = validateDateSettings('start', year, month, day, hours, minutes, seconds, start.timezone);
            if (errs !== undefined) {
                stopDate = undefined;
            } else {
                if (useUTC) {
                    startDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));
                    startDate.setTime(startDate.getTime() - start.timezone);
                } else {
                    startDate = new Date(year, month, day, hours, minutes, seconds, 0);
                }
                if (startDate.getTime() == stopDate.getTime()) {
                    startDate = new Date(2001, 0, 1, 0, 0, 0, 0);
                } else if (startDate.getTime() > stopDate.getTime()) {
                    if (start.day === undefined) {
//                        console.log("start="+ util.inspect(start));
//                        console.log("stop="+ util.inspect(stop));
//                        console.log("start ("+startDate+") > stop ("+stopDate+"), go back one day.");
                        startDate.setTime(startDate.getTime() - (24*60*60*1000));
                    }
                    if (startDate.getTime() > stopDate.getTime()) {
                        if (start.month === undefined) {
                            if (month == 0) {
                                year -= 1;
                                month = 11;
//                                console.log("start > stop, go back one month -- previous december.");
                            } else {
//                                console.log("start > stop, go back one month.");
                                month -= 1;
                            }
                            if (useUTC) {
                                startDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));
                            } else {
                                startDate = new Date(year, month, day, hours, minutes, seconds, 0);
                            }
                        }
                        if (startDate.getTime() > stopDate.getTime()) {
                            if (start.year === undefined) {
//                                console.log("start > stop, go back one year.");
                                year -= 1;
                                if (useUTC) {
                                    startDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));
                                } else {
                                    startDate = new Date(year, month, day, hours, minutes, seconds, 0);
                                }
                            }
                        }
                        if (startDate.getTime() > stopDate.getTime()) {
                            errs = [ new RangeError("Start time ("+startDate+") is after stop time ("+stopDate+").") ];
                            startDate = undefined;
                            stopDate = undefined;
                        }
                    }
                    if ((errs === undefined) && useUTC) {
                        startDate.setTime(startDate.getTime() - start.timezone);
//                        stopDate.setTime(stopDate.getTime() + stop.timezone);
                    }
                }
            }
        }
        return { start: startDate, stop: stopDate, errors: errs };
    }

};

module.exports.PartialDate = PartialDate;
