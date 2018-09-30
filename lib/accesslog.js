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
 *  @ctor AccessLogEntry constructor.
 */
function AccessLogEntry() {
    if (!(this instanceof AccessLogEntry)) {
        return new AccessLogEntry();
    }

    // full request string.
    this.line       = undefined;
    // request host (IP address)
    this.host       = undefined;
    // id of requesting system (almost always '-' for unknown)
    this.ident      = undefined;
    // authenticated user id. '-' for an unknown user.
    this.user       = undefined;
    // timestamp as a string.
    this.timestamp  = undefined;
    // timestamp as a Date object
    this.time       = undefined;
    // full request line
    this.request    = undefined;
    // request method (if exists)
    this.method     = undefined;
    // uri = path + query string
    this.uri        = undefined;
    // request protocol i.e. HTTP/1.0 or HTTP/1.1
    this.protocol   = undefined;
    // three digit status code.
    this.status     = undefined;
    // number of bytes in result
    this.size       = undefined;
    // referer sting if known, '-' if not.
    this.referer    = undefined;
    // user-agent string if known, '-' if not.
    this.agent      = undefined;
    // user-agent group
    this.group      = undefined;
    // user-agent source
    this.source     = undefined;

    return this;
}

/** Regular expression for common log entry. */
AccessLogEntry.prototype.commonRegExp =
    new RegExp(/^([^ ]+) ([^ ]+) ([^ ]+) \[([^\]]+)\] "([^"]*)" (\d+) ([-0-9]\d*)/);

/** Regular expression for combined log entry. */
AccessLogEntry.prototype.combinedRegExp =
    new RegExp(/^([^ ]+) ([^ ]+) ([^ ]+) \[([^\]]+)\] "([^"]*)" (\d+) ([-0-9]?\d*) "([^"]*)" "(.*)"/);

/** Regular expression for the standard Apache timestamp. */
AccessLogEntry.prototype.timestampRegExp =
    new RegExp(/(\d{1,2})\/(...)\/(\d\d\d\d):(\d\d):(\d\d):(\d\d) (.)(\d\d)(\d\d)/);

/** Regular expression for the cPanel timestamp. */
AccessLogEntry.prototype.cPanelTimestampRegExp =
    new RegExp(/(\d{1,2})\/(\d{1,2})\/(\d\d\d\d):(\d\d):(\d\d):(\d\d) (.)(\d\d)(\d\d)/);

/** Regular expression for the "request line". */
AccessLogEntry.prototype.requestRegExp =
    new RegExp(/([^ ]+) ([^ ]+) ([^ ]+)/);

/** Text month names. These are not localized in Apache. */
AccessLogEntry.prototype.monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 *  Extract log entry from string.
 *  @param str log entry.
 */
AccessLogEntry.prototype.parse = function (str) {
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
    this.group      = undefined;
    this.source     = undefined;

    var fields = this.combinedRegExp.exec(str);
    if (fields !== null) {
        this.line       = fields[0];
        this.host       = fields[1];
        this.ident      = fields[2];
        this.user       = fields[3];
        this.timestamp  = fields[4];
        this.request    = fields[5];
        this.status     = fields[6];
        if (fields[7] == '-') {
            this.size = 0;
        } else {
            this.size = parseInt(fields[7]);
        }
        this.referer    = fields[8] || '-';
        this.agent      = fields[9] || '-';
    } else {
        fields = this.commonRegExp.exec(str);
        if (fields !== null) {
            this.line       = fields[0];
            this.host       = fields[1];
            this.ident      = fields[2];
            this.user       = fields[3];
            this.timestamp  = fields[4];
            this.request    = fields[5];
            this.status     = fields[6];
            if (fields[7] == '-') {
                this.size = 0;
            } else {
                this.size = parseInt(fields[7]);
            }
            this.referer    = '-';
            this.agent      = '-';
        } else {
            return new Error('Invalid access log entry: ' + str);
        }
    }
    fields = this.requestRegExp.exec(this.request);
    if (fields !== null) {
        this.method = fields[1];
        this.uri = fields[2];
        this.protocol = fields[3];
    }

    var year, month, day, hours, minutes, seconds, timezone;
    fields = this.timestampRegExp.exec(this.timestamp);
    if (fields !== null) {
        day = parseInt(fields[1], 10);
        month = this.monthNames.indexOf(fields[2]);
        if (month < 0) {
            return new Error('Invalid month name: ' + fields[2]);
        }
    } else {
        fields = this.cPanelTimestampRegExp.exec(this.timestamp);
        if (fields === null) {
            return new Error('Invalid timestamp: ' + this.timestamp);
        }
        month = parseInt(fields[1], 10)-1;
        day = parseInt(fields[2], 10);
    }
    year = parseInt(fields[3], 10);
    hours = parseInt(fields[4], 10);
    minutes = parseInt(fields[5], 10);
    seconds = parseInt(fields[6], 10);
    timezone = ((parseInt(fields[8], 10) * 3600) + (parseInt(fields[9], 10) * 60)) * 1000;
    if (fields[7] == '-') {
        timezone = -timezone;
    }
    this.time = Date.UTC(year, month, day, hours, minutes, seconds, 0);
    this.time -= timezone;

    return this;
};

exports.AccessLogEntry = AccessLogEntry;

