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
var scanfile = require('./scanfile.js');
//var util = require('util');
var when = require('when');

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
}

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
};

/** RegExp to recognize seconds since start of Unix epoch. */
PartialDate.secondsSinceEpoch = new RegExp(/^@(\d+)$/);

/** RegExp to recognize time stamp only. */
PartialDate.hhmmss = new RegExp(/^(\d{1,2})((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

/** RegExp to recognize date and time pattern. */
PartialDate.yyyymmdd_hhmmss = new RegExp(/^((\d\d\d\d)([-/]))?((\d{1,2})([-/]))?(\d{1,2})(T|\s|:)?(\d{1,2})?((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

/** RegExp for year first named month date-time pattern. */
PartialDate.yyyyMMMdd_hhmmss =
    new RegExp(/^((\d\d\d\d)(?:[-/]))?(([A-Za-z]+)(?:[-/]))?(\d{1,2})(?:T|\s|:)?(\d{1,2})?((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

/** RegExp for day first named month date-time pattern. */
PartialDate.ddMMMyyyy_hhmmss =
    new RegExp(/^(\d{1,2})[-/]([A-Za-z]+)([-/](\d\d\d\d))?(T|\s|:)?(\d{1,2})?(:?(\d\d))?(:?(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

/** Array of Full month names in lower-case English. */
PartialDate.fullMonthNames =
    [ 'january', 'february', 'march', 'april',
        'may', 'june', 'july', 'august',
        'september', 'october', 'november', 'december' ];

/** Array of three-letter month names in lower-case English. */
PartialDate.monthNames =
    [   'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec' ];

/**
 *  Determine if string date is valid.
 *  @arg value is the date-time as a string.
 *  @rtype Boolean.
 */
PartialDate.isValidFormat = function(value) {
    if (PartialDate.hhmmss.test(value) ||
        PartialDate.yyyymmdd_hhmmss.test(value) ||
        PartialDate.secondsSinceEpoch.test(value) ||
        PartialDate.yyyyMMMdd_hhmmss.test(value) ||
        PartialDate.ddMMMyyyy_hhmmss.test(value) ) {
        return true;
    }
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
    if (pattern !== null) {
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
    if (pattern !== null) {
        this.setTime(1000 * parseInt(pattern[1], 10));
        return this;
    }
    pattern = PartialDate.yyyymmdd_hhmmss.exec(timestamp);
    if (pattern !== null) {
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
    if (pattern !== null) {
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
    if (pattern !== null) {
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
    throw new Error('Invalid date-time: ' + timestamp);
};

/** Number of days in each month in a non-leap year. */
var lastDayNonLeap = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Number of days in each month in a leap year. */
var lastDayLeap =    [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const datetime = module.exports = {
    /**
     *  Check date settings for valid ranges.
     *  Return array of Error objects.
     */

    validateDateSettings: function (timestamp, year, month, day, hours, minutes, seconds, timezone) {
        const errs = [];

        if (isNaN(year)) {
            errs.push(new Error('Invalid ' + timestamp + ' year is not a number.'));
        } else if (year < 1970) {
            errs.push(new RangeError('Invalid ' + timestamp + ' year (expected year > 1970): ' + year));
        }
        const isLeap = (((year % 4) === 0) && (((year % 100) !== 0) || ((year % 400) === 0)));

        if (isNaN(month)) {
            errs.push(new Error('Invalid ' + timestamp + ' month is not a number.'));
        } else if ((month < 0) || (month > 11)) {
            errs.push(new RangeError('Invalid ' + timestamp + ' month is out of range.'));
        } else {
            const lastDay = isLeap ? lastDayLeap[month] : lastDayNonLeap[month];
            if (!isNaN(day) && ((day < 1) || (day > lastDay))) {
                errs.push(new RangeError('Invalid ' + timestamp + ' day of month (expected 1 <= day <= ' + lastDay + '): ' + day));
            }
        }
        if (isNaN(day)) {
            errs.push(new Error('Invalid ' + timestamp + ' day of month is not a number.'));
        }
        if (isNaN(hours)) {
            errs.push(new Error('Invalid ' + timestamp + ' hours is not a number.'));
        } else if ((hours < 0) || (hours > 23)) {
            errs.push(new RangeError('Invalid ' + timestamp + ' hour (expected 0 <= hours <= 23): ' + hours));
        }
        if (isNaN(minutes)) {
            errs.push(new Error('Invalid ' + timestamp + ' minutes is not a number.'));
        } else if ((minutes < 0) || (minutes > 59)) {
            errs.push(new RangeError('Invalid ' + timestamp + ' minutes (expected 0 <= minutes <= 59): ' + minutes));
        }
        if (isNaN(seconds)) {
            errs.push(new Error('Invalid ' + timestamp + ' seconds is not a number.'));
        } else if ((seconds < 0) || (seconds > 59)) {
            errs.push(new RangeError('Invalid ' + timestamp + ' seconds (expected 0 <= seconds <= 59): ' + seconds));
        }
        if (timezone !== undefined) {
            if (isNaN(timezone)) {
                errs.push(new Error('Invalid ' + timestamp + ' timezone is not a number.'));
            } else if ((timezone <= -86400000) || (timezone >= 86400000)) {
                errs.push(new RangeError('Invalid ' + timestamp + ' timezone is out of range.'));
            }
        }
        return errs;
    },

    /**
     * Determine date-time from last reboot.
     * @rtype promise to a PartialDate value.
     */
    lastReboot : function() {
        const result = new PartialDate();
        const d = when.defer();

        try {
            var lastTimestamp = 0;
            const UtmpParser = require('samplx-utmp');
            const wtmp = new UtmpParser(scanfile.getRootPathname('/var/log/wtmp'));

            wtmp.on('data', function (data) {
                if (data.type == 'BOOT_TIME') {
                    lastTimestamp = data.timestamp.getTime();
                }
            });

            wtmp.on('end', function () {
                if (lastTimestamp !== 0) {
                    result.setTime(lastTimestamp);
                }
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
            return datetime.lastReboot();
        }

        var result = new PartialDate();
        result.parse(timestamp, roundDown);
        return when(result);
    },

    calcTimezone: function (startTimezone, stopTimezone) {
        if (startTimezone === undefined) {
            if (stopTimezone === undefined) {
                return [false, undefined, undefined];
            }
            return [true, stopTimezone, stopTimezone];
        }
        if (stopTimezone === undefined) {
            return [true, startTimezone, startTimezone];
        }
        return [true, startTimezone, stopTimezone];
    },

    calcYear: function (stopYear, useUTC, now) {
        if (stopYear !== undefined) {
            return stopYear;
        }
        if (useUTC) {
            return now.getUTCFullYear();
        }
        return now.getFullYear();
    },

    calcMonth: function (stopMonth, useUTC, now) {
        if (stopMonth !== undefined) {
            return stopMonth;
        }
        if (useUTC) {
            return now.getUTCMonth();
        }
        return now.getMonth();
    },

    calcDay: function (stopDay, useUTC, now) {
        if (stopDay !== undefined) {
            return stopDay;
        }
        if (useUTC) {
            return now.getUTCDate();
        }
        return now.getDate();
    },

    calcHours: function (stopHours, slotWidth, useUTC, now) {
        if (stopHours !== undefined) {
            return stopHours;
        }
        if (slotWidth >= 86400) {
            return 23;
        }
        if (useUTC) {
            return now.getUTCHours();
        }
        return now.getHours();
    },

    calcMinutes: function (stopMinutes, slotWidth, useUTC, now) {
        if (stopMinutes !== undefined) {
            return stopMinutes;
        }
        if (slotWidth >= 60) {
            return 59;
        }
        if (useUTC) {
            return now.getUTCMinutes();
        }
        return now.getMinutes();
    },

    calcSeconds: function (stopSeconds) {
        if (stopSeconds !== undefined) {
            return stopSeconds;
        }
        return 59;
    },

    dateFactory : function (year, month, day, hours, minutes, seconds, timezone, useUTC) {
        if (useUTC) {
            const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));
            date.setTime(date.getTime() - timezone);
            return date;
        }
        return new Date(year, month, day, hours, minutes, seconds, 0);
    },

    calcStartDate: function(start, stopDate, year, month, day, hours, minutes, seconds, timezone, useUTC) {
        // first try - define the start Date via the passed parameters.
        const startDate = datetime.dateFactory(year, month, day, hours, minutes, seconds, timezone, useUTC);
        const diff = Math.abs(stopDate.getTime() - startDate.getTime());
        if (diff <= 999) {
            // indicates that no start parameters were defined. use the default start date/time.
            return datetime.dateFactory(2001, 0, 1, 0, 0, 0, 0, useUTC);
        }
        if (startDate.getTime() < stopDate.getTime()) {
            return startDate;
        }
        if ((start.day === undefined) && (diff < (24*60*60*1000))){
            startDate.setTime(startDate.getTime() - (24*60*60*1000));
            return startDate;
        }
        if (start.month === undefined) {
            const backOneMonth =
                (month === 0) ?
                    datetime.dateFactory(year - 1, 11, day, hours, minutes, seconds, timezone, useUTC)
                    :
                    datetime.dateFactory(year, month - 1, day, hours, minutes, seconds, timezone, useUTC);
            startDate.setTime(backOneMonth.getTime());
        }
        if ((startDate.getTime() > stopDate.getTime()) && (start.year === undefined)) {
            const backOneYear = datetime.dateFactory(year - 1, month, day, hours, minutes, seconds, timezone, useUTC);
            startDate.setTime(backOneYear.getTime());
        }
        return startDate;
    },

    calculateStartStopNow: function (start, stop, slotWidth, now) {
        const tzInfo = datetime.calcTimezone(start.timezone, stop.timezone);
        const useUTC = tzInfo[0];
        const startTimezone = tzInfo[1];
        const stopTimezone = tzInfo[2];
        const stopYear = datetime.calcYear(stop.year, useUTC, now);
        const stopMonth = datetime.calcMonth(stop.month, useUTC, now);
        const stopDay = datetime.calcDay(stop.day, useUTC, now);
        const stopHours = datetime.calcHours(stop.hours, slotWidth, useUTC, now);
        const stopMinutes = datetime.calcMinutes(stop.minutes, slotWidth, useUTC, now);
        const stopSeconds = datetime.calcSeconds(stop.seconds);

        const stopErrors = datetime.validateDateSettings('stop', stopYear, stopMonth, stopDay, stopHours, stopMinutes, stopSeconds, stopTimezone);
        if (stopErrors.length !== 0) {
            return { start: undefined, stop: undefined, errors: stopErrors };
        }
        const stopDate = datetime.dateFactory(stopYear, stopMonth, stopDay, stopHours, stopMinutes, stopSeconds, stopTimezone, useUTC);
        const startYear = (start.year !== undefined) ? start.year : stopYear;
        const startMonth = (start.month !== undefined) ? start.month : stopMonth;
        const startDay = (start.day !== undefined) ? start.day : stopDay;
        const startHours = (start.hours !== undefined) ? start.hours : stopHours;
        const startMinutes = (start.minutes !== undefined) ? start.minutes : stopMinutes;
        const startSeconds = (start.seconds !== undefined) ? start.seconds : stopSeconds;

        const startErrors = datetime.validateDateSettings('start', startYear, startMonth, startDay, startHours, startMinutes, startSeconds, startTimezone);
        if (startErrors.length !== 0) {
            return { start: undefined, stop: undefined, errors: startErrors };
        }
        const startDate = datetime.calcStartDate(start, stopDate, startYear, startMonth, startDay, startHours, startMinutes, startSeconds, startTimezone, useUTC);
        if (startDate.getTime() > stopDate.getTime()) {
            return { start: startDate, stop: stopDate, errors: [ new RangeError('Start time ('+startDate+') is after stop time ('+stopDate+').') ] };
        }
        return { start: startDate, stop: stopDate, errors: [] };
    },

    /**
     *  Calculate the actual start and stop Dates from the PartialDates
     *  derrived from the command-line parameters.
     *  @rtype Object with start, stop and error array fields.
     */
    calculateStartStop : function (start, stop, slotWidth) {
        const now = new Date();
        return this.calculateStartStopNow(start, stop, slotWidth, now);
    }

};

module.exports.PartialDate = PartialDate;

