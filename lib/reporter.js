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

/**
 *  @ctor Reporter constructor.
 */
function Reporter() {
    if (!(this instanceof Reporter)) {
        return new Reporter();
    }

    // what type of report
    this.id = undefined;
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
    // where to write error message
    this.stderr = process.stderr;

    return this;
}

/** Bytes order of magnitudes. */
Reporter.bytesSuffix = [ ' B', 'kB', 'MB', 'GB', 'TB', 'PB', 'XB' ];

/** Strings used to convert a category option to the title for the report. */
Reporter.categoryLookup =
    {
        'groups'      : 'Group',
        'sources'     : 'Source',
        'user-agents' : 'User Agent',
        'agents'      : 'User Agent',
        'uris'        : 'URI',
        'urls'        : 'URL',
        'codes'       : 'HTTP Status',
        'referers'    : 'Referer',
        'referrers'   : 'Referrer',
        'methods'     : 'Method',
        'requests'    : 'Request',
        'protocols'   : 'Protocol',
        'users'       : 'User',
        'ips'         : 'IP',
        'domains'     : 'Domain'
    };

/** Names of the months. To match Apache should not be localized. */
Reporter.monthNames =
    [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

/**
 *  Zero pad a number to a given width.
 *  @param number to display.
 *  @param width of field.
 *  @rtype String.
 */
Reporter.prototype.padZero = function (number, width) {
    var s = number.toString();
    while (s.length < width) {
        s = '0' + s;
    }
    return s;
};

/**
 *  Pad a string on left with spaces until it is width characters (right justify).
 *  @param field to pad.
 *  @param width of field.
 *  @rtype String.
 */
Reporter.prototype.padField = function (field, width) {
    var s = field.toString();
    while (s.length < width) {
        s = ' ' + s;
    }
    return s;
};

/**
 *  Pad a string on right with spaces until it is width characters (left justify).
 *  @param field to pad.
 *  @param width of field.
 *  @rtype String.
 */
Reporter.prototype.padFieldRight = function (field, width) {
    var s = field.toString();
    while (s.length < width) {
        s += ' ';
    }
    return s;
};

/**
 *  Returns a milliseconds since Epoch time as an Apache log format.
 *  @param time in milliseconds since Epoch number.
 *  @rtype String.
 */
Reporter.prototype.getTimestamp = function (time) {
    const date = new Date(time);
    return this.getDatestamp(date);
};

/**
 *  Returns a JavaScript Date in Apache log format.
 *  @param date to be converted.
 *  @rtype String.
 */
Reporter.prototype.getDatestamp = function (date) {
    const timestamp = [];
    const timezoneOffset = date.getTimezoneOffset();
    const sign = (timezoneOffset <= 0) ? '+' : '-';
    const timezone = (timezoneOffset <= 0) ? -timezoneOffset : timezoneOffset;
    const ZZ = Math.floor(timezone / 60);
    const zz = timezone - (ZZ * 60);

    timestamp.push(this.padZero(date.getDate(), 2));
    timestamp.push('/');
    timestamp.push(Reporter.monthNames[date.getMonth()]);
    timestamp.push('/');
    timestamp.push(date.getFullYear());
    timestamp.push(':');
    timestamp.push(this.padZero(date.getHours(), 2));
    timestamp.push(':');
    timestamp.push(this.padZero(date.getMinutes(), 2));
    timestamp.push(':');
    timestamp.push(this.padZero(date.getSeconds(), 2));
    timestamp.push(' ' + sign);
    timestamp.push(this.padZero(ZZ, 2));
    timestamp.push(this.padZero(zz, 2));

    return timestamp.join('');
};

/**
 *  Create a time stamp header.
 *  @param start time (milliseconds since Epoch).
 *  @param first time (milliseconds since Epoch).
 *  @param last time (milliseconds since Epoch).
 *  @param stop time (milliseconds since Epoch).
 *  @param title String.
 *  @rtype String.
 */
Reporter.prototype.getTimestampHeader = function (start, first, last, stop, title) {
    const startTS = this.getTimestamp(start);
    var firstTS = this.getTimestamp(first);
    var lastTS  = this.getTimestamp(last);
    var stopTS  = this.getTimestamp(stop);
    var timezone = startTS.substr(-5);
    if ((timezone == firstTS.substr(-5)) && (timezone == lastTS.substr(-5)) && (timezone == stopTS.substr(-5))) {
        firstTS = firstTS.substr(0, 20);
        lastTS = lastTS.substr(0, 20);
        stopTS = stopTS.substr(0, 20);
    }
    var prefix = startTS.substr(0, 12);
    if (prefix == firstTS.substr(0, 12)) {
        firstTS = firstTS.substr(12);
    }
    prefix = stopTS.substr(0, 12);
    if (prefix == lastTS.substr(0, 12)) {
        lastTS = lastTS.substr(12);
    }
    if (prefix == startTS.substr(0, 12)) {
        stopTS = stopTS.substr(12);
    }
    const header =
        startTS + ' [' +
        firstTS + '] - [' +
        lastTS + '] ' +
        stopTS + ' ' +
        title + '\n';

    return header;
};

/**
 *  Return number of bytes scaled by suffix.
 *  @param nBytes Number.
 *  @rtype String -- 10 characters.
 */
Reporter.prototype.getBytesString = function (nBytes) {
    var radix = 0;
    var exponent = 1;
    var scaled = nBytes;

    while (scaled > 5120) {
        scaled = scaled / 1024;
        radix += 1;
        exponent *= 1024;
    }
    if (radix === 0) {                              // 123456
        return this.padField(nBytes.toString(), 4) + '     B';
    }
    return this.padField((nBytes / exponent).toFixed(3), 8) + Reporter.bytesSuffix[radix];
};

/**
 *  Return number of bytes per second as a scaled string.
 *  @param nBytes Number of bytes.
 *  @param elapsed seconds.
 *  @rtype String -- 11 characters.
 */
Reporter.prototype.getBPS = function (nBytes, elapsed) {
    if (elapsed === 0) {
        //      12345678901
        return '    NaN    ';
    }
    var radix = 0;
    var exponent = 1;
    var scaled = Math.floor(nBytes / elapsed);

    while (scaled > 5120) {
        scaled = scaled / 1024;
        radix += 1;
        exponent *= 1024;
    }

    const bps = (nBytes / elapsed) / exponent;
    return this.padField(bps.toFixed(2), 7) + Reporter.bytesSuffix[radix] + '/s';
};

/**
 *  Report an error message.
 *  @param error.
 */
Reporter.prototype.reportError = function (error) {
    this.stderr.write('ERROR: ' + error.message);
};

/**
 *  Create report (override).
 *  @param ticks data to report.
 */
Reporter.prototype.report = function () {
    this.stderr.write('Reporter::report: stub');
};

exports.Reporter = Reporter;

