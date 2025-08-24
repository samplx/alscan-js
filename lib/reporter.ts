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

import { Tick } from "./tick.ts";

/**
 *  @ctor Reporter constructor.
 */
export class Reporter {
    /** what type of report */
    id?: string = undefined;

    /** reporting category. */
    category?: string = undefined;

    /** debug flag. */
    debug: boolean = false;

    /** number of items to include in a report. */
    limit?: number = undefined;

    output: (s: string) => void = (s) => console.log(s);

    /** sort order of report results. */
    order?: string = undefined;

    /** size of time-slots in seconds. */
    slotWidth?: number = undefined;

    /** beginning of reporting period (Date) */
    start?: Date = undefined;

    /** end of reporting period (Date) */
    stop?: Date = undefined;


    /** Bytes order of magnitudes. */
    static bytesSuffix: Array<string> = [ ' B', 'kB', 'MB', 'GB', 'TB', 'PB', 'XB' ];

    /** Strings used to convert a category option to the title for the report. */
    static categoryLookup: Record<string, string> =
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
        'domains'     : 'Domain',
        'undefined'   : 'Unknown',
    };

    /** Names of the months. To match Apache should not be localized. */
    static monthNames: Array<string> =
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
    padZero(n: number, width: number): string {
        const s = n.toString();
        return s.padStart(width, '0');
    }

    /**
     *  Pad a string on left with spaces until it is width characters (right justify).
     *  @param field to pad.
     *  @param width of field.
     */
    padField(field: any, width: number): string {
        let s = '';
        if ((field !== null) && (field !== undefined)) {
            s = field.toString();
        }
        return s.padStart(width, ' ');
    }

    /**
     *  Pad a string on right with spaces until it is width characters (left justify).
     *  @param field to pad.
     *  @param width of field.
     */
    padFieldRight(field: any, width: number): string {
        let s = '';
        if ((field !== null) && (field !== undefined)) {
            s = field.toString();
        }
        return s.padEnd(width, ' ');
    }

    /**
     *  Returns a milliseconds since Epoch time as an Apache log format.
     *  @param time in milliseconds since Epoch number.
     */
    getTimestamp(time: number | Date): string {
        const date = new Date(time);
        return this.getDatestamp(date);
    }

    /**
     *  Returns a JavaScript Date in Apache log format.
     *  @param date to be converted.
     */
    getDatestamp(date: Date): string {
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

    }

    /**
     *  Create a time stamp header.
     *  @param start time (milliseconds since Epoch).
     *  @param first time (milliseconds since Epoch).
     *  @param last time (milliseconds since Epoch).
     *  @param stop time (milliseconds since Epoch).
     *  @param title String.
     */
    getTimestampHeader(
        start: Date | number,
        first: Date | number,
        last: Date | number,
        stop: Date | number,
        title: string
    ): string {
        const startTS = this.getTimestamp(start);
        let firstTS = this.getTimestamp(first);
        let lastTS  = this.getTimestamp(last);
        let stopTS  = this.getTimestamp(stop);
        let timezone = this.tzSuffix(startTS);
        if ((timezone == this.tzSuffix(firstTS)) &&
            (timezone == this.tzSuffix(lastTS)) &&
            (timezone == this.tzSuffix(stopTS))) {
            firstTS = firstTS.substring(0, 20);
            lastTS = lastTS.substring(0, 20);
            stopTS = stopTS.substring(0, 20);
        }
        let prefix = startTS.substring(0, 12);
        if (prefix == firstTS.substring(0, 12)) {
            firstTS = firstTS.substring(12);
        }
        prefix = stopTS.substring(0, 12);
        if (prefix == lastTS.substring(0, 12)) {
            lastTS = lastTS.substring(12);
        }
        if (prefix == startTS.substring(0, 12)) {
            stopTS = stopTS.substring(12);
        }
        const header =
            startTS + ' [' +
            firstTS + '] - [' +
            lastTS + '] ' +
            stopTS + ' ' +
            title + '\n';

        return header;

    }

    /**
     *  Return number of bytes scaled by suffix.
     *  @param nBytes Number.
     */
    getBytesString(nBytes: number): string {
        let radix = 0;
        let exponent = 1;
        let scaled = nBytes;

        while (scaled > 5120) {
            scaled = scaled / 1024;
            radix += 1;
            exponent *= 1024;
        }
        if (radix === 0) {                              // 123456
            return this.padField(nBytes.toString(), 4) + '     B';
        }
        return this.padField((nBytes / exponent).toFixed(3), 8) + Reporter.bytesSuffix[radix];
    }

    /**
     *  Return number of bytes per second as a scaled 11 character string.
     *  @param nBytes Number of bytes.
     *  @param elapsed seconds.
     */
    getBPS(nBytes: number, elapsed: number): string {
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
    }

    /**
     *  Report an error message.
     *  @param error.
     */
    reportError(err: Error): void {
        console.error('ERROR: ' + err.message);
    }


    /**
     *  Create report (override).
     *  @param ticks data to report.
     */
    report(ticks: Array<Tick>): void {

    }

    /**
     * Extract the timezone from a timestamp string.
     * @param s timestamp string
     * @returns last 5 characters (timezone portion)
     */
    tzSuffix(s: string): string {
        if (s.length < 5) {
            return '';
        }
        return s.substring(s.length - 5);
    }
}
