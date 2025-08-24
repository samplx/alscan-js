/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018, 2025 James Burlingame
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

import { getRootPathname } from "./scanfile.ts";

// -------------------------------------------------------------------------

export class PartialDate {
    year       : undefined | number;
    month      : undefined | number;
    day        : undefined | number;
    hours      : undefined | number;
    minutes    : undefined | number;
    seconds    : undefined | number;
    timezone   : undefined | number;

    /**
     * PartialDate constructor @ctor.
     * A PartialDate is used to define date-time option which allows some values
     * to be determined by additional information.
     * i.e. the start time may have fields defined based upon the stop time, and
     * the stop time may have fields defined based upon the current time.
     */
    constructor() {
        this.year       = undefined;
        this.month      = undefined;
        this.day        = undefined;
        this.hours      = undefined;
        this.minutes    = undefined;
        this.seconds    = undefined;
        this.timezone   = undefined;
    }

    /**
     *  Define the PartialDate object based upon a milliseconds since start of epoch timestamp.
     *  @arg timestamp is a Number of milliseconds since the start of the Epoch.
     *  @rtype PartialDate is a reference to the object.
     */
    setTime(timestamp: number): PartialDate {
        const time = new Date(timestamp);
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
    static secondsSinceEpoch: RegExp = new RegExp(/^@(\d+)$/);

    /** RegExp to recognize time stamp only. */
    static hhmmss: RegExp = new RegExp(/^(\d{1,2})((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

    /** RegExp to recognize date and time pattern. */
    static yyyymmdd_hhmmss: RegExp = new RegExp(/^((\d\d\d\d)([-/]))?((\d{1,2})([-/]))?(\d{1,2})(T|\s|:)?(\d{1,2})?((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

    /** RegExp for year first named month date-time pattern. */
    static yyyyMMMdd_hhmmss: RegExp =
        new RegExp(/^((\d\d\d\d)(?:[-/]))?(([A-Za-z]+)(?:[-/]))?(\d{1,2})(?:T|\s|:)?(\d{1,2})?((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

    /** RegExp for day first named month date-time pattern. */
    static ddMMMyyyy_hhmmss: RegExp =
        new RegExp(/^(\d{1,2})[-/]([A-Za-z]+)([-/](\d\d\d\d))?(T|\s|:)?(\d{1,2})?(:?(\d\d))?(:?(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);

    /** Array of Full month names in lower-case English. */
    static fullMonthNames: Array<string> = [
        'january', 'february', 'march', 'april',
        'may', 'june', 'july', 'august',
        'september', 'october', 'november', 'december'
    ];

    /** Array of three-letter month names in lower-case English. */
    static monthNames: Array<string> = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];

    /**
     *  Determine if string date is valid.
     *  @arg value is the date-time as a string.
     */
    static isValidFormat(value: string): boolean {
        if (PartialDate.hhmmss.test(value) ||
            PartialDate.yyyymmdd_hhmmss.test(value) ||
            PartialDate.secondsSinceEpoch.test(value) ||
            PartialDate.yyyyMMMdd_hhmmss.test(value) ||
            PartialDate.ddMMMyyyy_hhmmss.test(value) ) {
            return true;
        }
        return false;
    }

    /**
     *  Parse a date-time string into the PartialDate value.
     *  @arg timestamp is String value.
     *  @arg roundDown is Boolean, true if parse value should be rounded down
     *      to the nearest time.
     */
    parse(timestamp: string, roundDown: boolean): PartialDate {
        if ( (this.parseHHMMSS(timestamp, roundDown) != null) ||
             (this.parseSecondSinceEpoch(timestamp, roundDown) != null) ||
             (this.parseYYYYMMDD_HHMMSS(timestamp, roundDown) != null) ||
             (this.parseYYYYMMMDD_HHMMSS(timestamp, roundDown) != null) ||
             (this.parseDDMMMYYYY_HHMMSS(timestamp, roundDown) != null)) {
            return this;
        }
        throw new Error(`invalid timestamp: ${timestamp}`);
    }

    parseHHMMSS(timestamp: string, roundDown: boolean): null | PartialDate {
        const pattern = PartialDate.hhmmss.exec(timestamp);
        if (pattern === null) {
            return null;
        }
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
        let zone: number;
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

    parseSecondSinceEpoch(timestamp: string, _roundDown: boolean): null | PartialDate {
        const pattern = PartialDate.secondsSinceEpoch.exec(timestamp);
        if (pattern !== null) {
            this.setTime(1000 * parseInt(pattern[1], 10));
            return this;
        }
        return null;
    }

    parseYYYYMMDD_HHMMSS(timestamp: string, roundDown: boolean): null | PartialDate {
        const pattern = PartialDate.yyyymmdd_hhmmss.exec(timestamp);
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
            let zone: number;
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
        return null;
    }

    parseYYYYMMMDD_HHMMSS(timestamp: string, roundDown: boolean): null | PartialDate {
        const pattern = PartialDate.yyyyMMMdd_hhmmss.exec(timestamp);
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
            let zone: number;
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
        return null;
    }

    parseDDMMMYYYY_HHMMSS(timestamp: string, roundDown: boolean): null | PartialDate {
        const pattern = PartialDate.ddMMMyyyy_hhmmss.exec(timestamp);
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
                let zone: number;
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
        return null;
    }

}



/** Number of days in each month in a non-leap year. */
const lastDayNonLeap = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Number of days in each month in a leap year. */
const lastDayLeap =    [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 *  Check date settings for valid ranges.
 *  Return array of Error objects.
 */
export function validateDateSettings(
    timestamp: string,
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
    timezone: number
): Array<Error> {
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
}

/**
 * Determine date-time from last reboot.
 * @rtype promise to a PartialDate value.
 */
export async function lastReboot(): Promise<PartialDate> {
    const result = new PartialDate();

    try {
    } catch (e) {
        // ignore
    }
    return result;
}

/**
 *  Parse a string into a PartialDate value.
 *  @arg timestamp - date-time string.
 *  @arg roundDown - true if start time, false if stop time.
 *  @rtype promise for a PartialDate object.
 */
export async function parsePartialDate(timestamp: string, roundDown: boolean): Promise<PartialDate> {
    if (timestamp == 'reboot') {
        return await lastReboot();
    }

    const result = new PartialDate();
    result.parse(timestamp, roundDown);
    return result;
}

export function calcTimezone(
    startTimezone: number | undefined,
    stopTimezone: number | undefined
): [boolean, number | undefined, number | undefined] {
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
}

export function calcYear(stopYear: number | undefined, useUTC: boolean, now: Date): number {
    if (stopYear !== undefined) {
        return stopYear;
    }
    if (useUTC) {
        return now.getUTCFullYear();
    }
    return now.getFullYear();
}

export function calcMonth(stopMonth: number | undefined, useUTC: boolean, now: Date): number {
    if (stopMonth !== undefined) {
        return stopMonth;
    }
    if (useUTC) {
        return now.getUTCMonth();
    }
    return now.getMonth();
}

export function calcDay(stopDay: number | undefined, useUTC: boolean, now: Date): number {
    if (stopDay !== undefined) {
        return stopDay;
    }
    if (useUTC) {
        return now.getUTCDate();
    }
    return now.getDate();
}

export function calcHours(stopHours: number | undefined, slotWidth: number, useUTC: boolean, now: Date): number {
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
}

export function calcMinutes(stopMinutes: number | undefined, slotWidth: number, useUTC: boolean, now: Date): number {
    if (stopMinutes !== undefined) {
        return stopMinutes;
    }
    if (slotWidth > 60) {
        return 59;
    }
    if (useUTC) {
        return now.getUTCMinutes();
    }
    return now.getMinutes();
}

export function calcSeconds(stopSeconds: number | undefined): number {
    if (stopSeconds !== undefined) {
        return stopSeconds;
    }
    return 59;
}

export function dateFactory(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
    timezone: number | undefined,
    useUTC: boolean): Date {
    if (useUTC) {
        const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));
        date.setTime(date.getTime() - (timezone ?? 0));
        return date;
    }
    return new Date(year, month, day, hours, minutes, seconds, 0);
}

export function calcStartDate(start: PartialDate,
    stopDate: Date,
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
    timezone: number,
    useUTC: boolean): Date {
    // first try - define the start Date via the passed parameters.
    const startDate = dateFactory(year, month, day, hours, minutes, seconds, timezone, useUTC);
    const diff = Math.abs(stopDate.getTime() - startDate.getTime());
    if (diff <= 999) {
        // indicates that no start parameters were defined. use the default start date/time.
        return dateFactory(2001, 0, 1, 0, 0, 0, 0, useUTC);
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
                dateFactory(year - 1, 11, day, hours, minutes, seconds, timezone, useUTC)
                :
                dateFactory(year, month - 1, day, hours, minutes, seconds, timezone, useUTC);
        startDate.setTime(backOneMonth.getTime());
    }
    if ((startDate.getTime() > stopDate.getTime()) && (start.year === undefined)) {
        const backOneYear = dateFactory(year - 1, month, day, hours, minutes, seconds, timezone, useUTC);
        startDate.setTime(backOneYear.getTime());
    }
    return startDate;
}

export function calculateStartStopNow(start: PartialDate, stop: PartialDate, slotWidth: number, now: Date): StartStopAndErrors {
    const [useUTC, startTimezone, stopTimezone] = calcTimezone(start.timezone, stop.timezone);
    const stopYear = calcYear(stop.year, useUTC, now);
    const stopMonth = calcMonth(stop.month, useUTC, now);
    const stopDay = calcDay(stop.day, useUTC, now);
    const stopHours = calcHours(stop.hours, slotWidth, useUTC, now);
    const stopMinutes = calcMinutes(stop.minutes, slotWidth, useUTC, now);
    const stopSeconds = calcSeconds(stop.seconds);

    const stopErrors = validateDateSettings('stop', stopYear, stopMonth, stopDay, stopHours, stopMinutes, stopSeconds, stopTimezone ?? 0);
    if (stopErrors.length !== 0) {
        return { start: undefined, stop: undefined, errors: stopErrors };
    }
    const stopDate = dateFactory(stopYear, stopMonth, stopDay, stopHours, stopMinutes, stopSeconds, stopTimezone ?? 0, useUTC);
    const startYear = (start.year !== undefined) ? start.year : stopYear;
    const startMonth = (start.month !== undefined) ? start.month : stopMonth;
    const startDay = (start.day !== undefined) ? start.day : stopDay;
    const startHours = (start.hours !== undefined) ? start.hours : stopHours;
    const startMinutes = (start.minutes !== undefined) ? start.minutes : stopMinutes;
    const startSeconds = (start.seconds !== undefined) ? start.seconds : stopSeconds;

    const startErrors = validateDateSettings('start', startYear, startMonth, startDay, startHours, startMinutes, startSeconds, startTimezone ?? 0);
    if (startErrors.length !== 0) {
        return { start: undefined, stop: undefined, errors: startErrors };
    }
    const startDate = calcStartDate(start, stopDate, startYear, startMonth, startDay, startHours, startMinutes, startSeconds, startTimezone ?? 0, useUTC);
    if (startDate.getTime() > stopDate.getTime()) {
        return { start: startDate, stop: stopDate, errors: [ new RangeError('Start time ('+startDate+') is after stop time ('+stopDate+').') ] };
    }
    return { start: startDate, stop: stopDate, errors: [] };
}

/**
 *  Calculate the actual start and stop Dates from the PartialDates
 *  derived from the command-line parameters.
 */
export function calculateStartStop(start: PartialDate, stop: PartialDate, slotWidth: number): StartStopAndErrors {
    const now = new Date();
    return calculateStartStopNow(start, stop, slotWidth, now);
}

export interface StartStopAndErrors {
    start: Date | undefined;
    stop: Date | undefined;
    errors: Array<Error>;
}
