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


export class AccessLogEntry {
    /** full request string. */
    line       : undefined | string;

    /** request host (IP address) */
    host       : undefined | string;

    /** id of requesting system (almost always '-' for unknown) */
    ident      : undefined | string;

    /** authenticated user id. '-' for an unknown user. */
    user       : undefined | string;

    /** timestamp as a string. */
    timestamp  : undefined | string;

    /** timestamp as a number. */
    time       : undefined | number;

    /** full request line */
    request    : undefined | string;

    /** request method (if exists) */
    method     : undefined | string;

    /** uri = path + query string */
    uri        : undefined | string;

    /** request protocol i.e. HTTP/1.0 or HTTP/1.1 */
    protocol   : undefined | string;

    /** three digit status code. */
    status     : undefined | string;

    /** number of bytes in result */
    size       : undefined | number;

    /** referer sting if known, '-' if not. */
    referer    : undefined | string;

    /** user-agent string if known, '-' if not. */
    agent      : undefined | string;

    /** user-agent group */
    group      : undefined | string;

    /** user-agent source */
    source     : undefined | string;

    constructor() {
        // everything is undefined
    }

    /** Regular expression for common log entry. */
    static commonRegExp: RegExp =
        new RegExp(/^([^ ]+) ([^ ]+) ([^ ]+) \[([^\]]+)\] "([^"]*)" (\d+) ([-0-9]\d*)/);

    /** Regular expression for combined log entry. */
    static combinedRegExp: RegExp =
        new RegExp(/^([^ ]+) ([^ ]+) ([^ ]+) \[([^\]]+)\] "([^"]*)" (\d+) ([-0-9]?\d*) "([^"]*)" "(.*)"/);

    /** Regular expression for the standard Apache timestamp. */
    static timestampRegExp: RegExp =
        new RegExp(/(\d{1,2})\/(...)\/(\d\d\d\d):(\d\d):(\d\d):(\d\d) (.)(\d\d)(\d\d)/);

    /** Regular expression for the cPanel timestamp. */
    static cPanelTimestampRegExp: RegExp =
        new RegExp(/(\d{1,2})\/(\d{1,2})\/(\d\d\d\d):(\d\d):(\d\d):(\d\d) (.)(\d\d)(\d\d)/);

    /** Regular expression for the "request line". */
    static requestRegExp: RegExp =
        new RegExp(/([^ ]+) ([^ ]+) ([^ ]+)/);

    /** Text month names. These are not localized in Apache. */
    static monthNames: Array<string> = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    /**
     *  Extract log entry from string.
     *  @param str log entry.
     */
    parse(str: string): void {
        this.line       = str;
        // clear-out any old information.
        this.host       = undefined;
        this.ident      = undefined;
        this.user       = undefined;
        this.timestamp  = undefined;
        this.time       = undefined;
        this.request    = undefined;
        this.method     = undefined;
        this.uri        = undefined;
        this.protocol   = undefined;
        this.status     = undefined;
        this.size       = undefined;
        this.referer    = undefined;
        this.agent      = undefined;
        this.group      = 'Unknown';
        this.source     = 'Unknown';

        const combined = AccessLogEntry.combinedRegExp.exec(str);
        if (combined !== null) {
            this.line       = combined[0];
            this.host       = combined[1];
            this.ident      = combined[2];
            this.user       = combined[3];
            this.timestamp  = combined[4];
            this.request    = combined[5];
            this.status     = combined[6];
            if (combined[7] == '-') {
                this.size = 0;
            } else {
                this.size = parseInt(combined[7] ?? '');
            }
            this.referer    = combined[8] || '-';
            this.agent      = combined[9] || '-';
        } else {
            const common = AccessLogEntry.commonRegExp.exec(str);
            if (common !== null) {
                this.line       = common[0];
                this.host       = common[1];
                this.ident      = common[2];
                this.user       = common[3];
                this.timestamp  = common[4];
                this.request    = common[5];
                this.status     = common[6];
                if (common[7] == '-') {
                    this.size = 0;
                } else {
                    this.size = parseInt(common[7] ?? '');
                }
                this.referer    = '-';
                this.agent      = '-';
            } else {
                throw new Error('Invalid access log entry: ' + str);
            }
        }

        const req = AccessLogEntry.requestRegExp.exec(this.request ?? '');
        if (req !== null) {
            this.method = req[1];
            this.uri = req[2];
            this.protocol = req[3];
        }

        let timestamp = AccessLogEntry.timestampRegExp.exec(this.timestamp ?? '');
        let day, month;
        if (timestamp !== null) {
            day = parseInt(timestamp[1] ?? '', 10);
            month = AccessLogEntry.monthNames.indexOf(timestamp[2] ?? '');
            if (month < 0) {
                throw new Error(`Invalid month name: ${timestamp[2]}`);
            }
        } else {
            timestamp = AccessLogEntry.cPanelTimestampRegExp.exec(this.timestamp ?? '');
            if (timestamp === null) {
                throw new Error(`Invalid timestamp: ${this.timestamp}`);
            }
            month = parseInt(timestamp[1] ?? '', 10)-1;
            day = parseInt(timestamp[2] ?? '', 10);
        }
        const year = parseInt(timestamp[3] ?? '', 10);
        const hours = parseInt(timestamp[4] ?? '', 10);
        const minutes = parseInt(timestamp[5] ?? '', 10);
        const seconds = parseInt(timestamp[6] ?? '', 10);
        let timezone = ((parseInt(timestamp[8] ?? '', 10) * 3600) + (parseInt(timestamp[9] ?? '', 10) * 60)) * 1000;
        if (timestamp[7] == '-') {
            timezone = -timezone;
        }
        this.time = Date.UTC(year, month, day, hours, minutes, seconds, 0);
        this.time -= timezone;
    }
}
