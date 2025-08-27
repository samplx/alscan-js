#!/usr/bin/env node

// lib/alscan.ts
import * as fs5 from "node:fs";
import * as process3 from "node:process";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import sortOn2 from "sort-on";
import { Command, InvalidArgumentError, Option } from "@commander-js/extra-typings";

// lib/accesslog.ts
var AccessLogEntry = class _AccessLogEntry {
  /** full request string. */
  line;
  /** request host (IP address) */
  host;
  /** id of requesting system (almost always '-' for unknown) */
  ident;
  /** authenticated user id. '-' for an unknown user. */
  user;
  /** timestamp as a string. */
  timestamp;
  /** timestamp as a number. */
  time;
  /** full request line */
  request;
  /** request method (if exists) */
  method;
  /** uri = path + query string */
  uri;
  /** request protocol i.e. HTTP/1.0 or HTTP/1.1 */
  protocol;
  /** three digit status code. */
  status;
  /** number of bytes in result */
  size;
  /** referer sting if known, '-' if not. */
  referer;
  /** user-agent string if known, '-' if not. */
  agent;
  /** user-agent group */
  group;
  /** user-agent source */
  source;
  constructor() {
  }
  /** Regular expression for common log entry. */
  static commonRegExp = new RegExp(/^([^ ]+) ([^ ]+) ([^ ]+) \[([^\]]+)\] "([^"]*)" (\d+) ([-0-9]\d*)/);
  /** Regular expression for combined log entry. */
  static combinedRegExp = new RegExp(/^([^ ]+) ([^ ]+) ([^ ]+) \[([^\]]+)\] "([^"]*)" (\d+) ([-0-9]?\d*) "([^"]*)" "(.*)"/);
  /** Regular expression for the standard Apache timestamp. */
  static timestampRegExp = new RegExp(/(\d{1,2})\/(...)\/(\d\d\d\d):(\d\d):(\d\d):(\d\d) (.)(\d\d)(\d\d)/);
  /** Regular expression for the cPanel timestamp. */
  static cPanelTimestampRegExp = new RegExp(/(\d{1,2})\/(\d{1,2})\/(\d\d\d\d):(\d\d):(\d\d):(\d\d) (.)(\d\d)(\d\d)/);
  /** Regular expression for the "request line". */
  static requestRegExp = new RegExp(/([^ ]+) ([^ ]+) ([^ ]+)/);
  /** Text month names. These are not localized in Apache. */
  static monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  /**
   *  Extract log entry from string.
   *  @param str log entry.
   */
  parse(str) {
    this.line = str;
    this.host = void 0;
    this.ident = void 0;
    this.user = void 0;
    this.timestamp = void 0;
    this.time = void 0;
    this.request = void 0;
    this.method = void 0;
    this.uri = void 0;
    this.protocol = void 0;
    this.status = void 0;
    this.size = void 0;
    this.referer = void 0;
    this.agent = void 0;
    this.group = "Unknown";
    this.source = "Unknown";
    const combined = _AccessLogEntry.combinedRegExp.exec(str);
    if (combined !== null) {
      this.line = combined[0];
      this.host = combined[1];
      this.ident = combined[2];
      this.user = combined[3];
      this.timestamp = combined[4];
      this.request = combined[5];
      this.status = combined[6];
      if (combined[7] == "-") {
        this.size = 0;
      } else {
        this.size = parseInt(combined[7] ?? "");
      }
      this.referer = combined[8] || "-";
      this.agent = combined[9] || "-";
    } else {
      const common = _AccessLogEntry.commonRegExp.exec(str);
      if (common !== null) {
        this.line = common[0];
        this.host = common[1];
        this.ident = common[2];
        this.user = common[3];
        this.timestamp = common[4];
        this.request = common[5];
        this.status = common[6];
        if (common[7] == "-") {
          this.size = 0;
        } else {
          this.size = parseInt(common[7] ?? "");
        }
        this.referer = "-";
        this.agent = "-";
      } else {
        throw new Error("Invalid access log entry: " + str);
      }
    }
    const req = _AccessLogEntry.requestRegExp.exec(this.request ?? "");
    if (req !== null) {
      this.method = req[1];
      this.uri = req[2];
      this.protocol = req[3];
    }
    let timestamp = _AccessLogEntry.timestampRegExp.exec(this.timestamp ?? "");
    let day, month;
    if (timestamp !== null) {
      day = parseInt(timestamp[1] ?? "", 10);
      month = _AccessLogEntry.monthNames.indexOf(timestamp[2] ?? "");
      if (month < 0) {
        throw new Error(`Invalid month name: ${timestamp[2]}`);
      }
    } else {
      timestamp = _AccessLogEntry.cPanelTimestampRegExp.exec(this.timestamp ?? "");
      if (timestamp === null) {
        throw new Error(`Invalid timestamp: ${this.timestamp}`);
      }
      month = parseInt(timestamp[1] ?? "", 10) - 1;
      day = parseInt(timestamp[2] ?? "", 10);
    }
    const year = parseInt(timestamp[3] ?? "", 10);
    const hours = parseInt(timestamp[4] ?? "", 10);
    const minutes = parseInt(timestamp[5] ?? "", 10);
    const seconds = parseInt(timestamp[6] ?? "", 10);
    let timezone = (parseInt(timestamp[8] ?? "", 10) * 3600 + parseInt(timestamp[9] ?? "", 10) * 60) * 1e3;
    if (timestamp[7] == "-") {
      timezone = -timezone;
    }
    this.time = Date.UTC(year, month, day, hours, minutes, seconds, 0);
    this.time -= timezone;
  }
};

// lib/recognizer.ts
var AND_OP = "and";
var OR_OP = "or";
var Recognizer = class _Recognizer {
  field;
  op;
  operands;
  func;
  /**
   *  @ctor Recognizer constructor.
   *  @param field is the name of the field to match.
   *  @param func callback returns true on a match.
   *  @param op is either AND_OP or OR_OP to create a collection of recognizers.
   */
  constructor(field, func, op) {
    this.field = field;
    this.func = func;
    if (op) {
      this.op = op;
      this.operands = [];
    } else if (func) {
      this.func = func;
    } else {
      throw new Error(`Either func or op must be defined`);
    }
  }
  /**
   *  Determine if this is a collection.
   *  @returns true if this is a collection of recognizers.
   */
  isCollection() {
    return Array.isArray(this.operands);
  }
  /**
   *  Add criteria to this Recognizer.
   *  @param field to check.
   *  @param item.
   */
  addItem(field, item) {
    if (!this.isCollection() || !Array.isArray(this.operands)) {
      throw new TypeError("Cannot add to a non-collection recognizer.");
    }
    for (let n = 0; n < this.operands.length; n++) {
      if (this.operands[n].field == field) {
        if (!this.operands[n].isCollection()) {
          const old = this.operands[n];
          this.operands[n] = new _Recognizer(field, void 0, OR_OP);
          this.operands[n].operands.push(old);
        }
        this.operands[n].operands.push(item);
        return;
      }
    }
    this.operands.push(item);
  }
  /**
   *  Determine if the record matches this Recognizer.
   *  @param record access log data.
   */
  matches(record) {
    if (this.isCollection() && Array.isArray(this.operands)) {
      const match = (operand) => operand.matches(record);
      if (this.op == AND_OP) {
        return this.operands.every(match);
      }
      if (this.op == OR_OP) {
        return this.operands.some(match);
      }
      return false;
    }
    if (this.func && this.field !== "top") {
      return this.func(record[this.field]);
    }
    return false;
  }
  /**
   * clear existing operands (used for testing)
   */
  clear() {
    this.operands = [];
  }
  /** Regular expression of an IPv4 dotted decimal address. */
  static ipv4Pattern = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/);
  /** Regular expression of an IPv4 dotted decimal address with CIDR mask. */
  static ipv4maskPattern = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?$/);
  static ipMatch(host, addressMask) {
    const hostMatch = _Recognizer.ipv4Pattern.exec(host);
    if (hostMatch === null) {
      return host == addressMask;
    }
    const addressMatch = _Recognizer.ipv4maskPattern.exec(addressMask);
    if (addressMatch === null || addressMatch[5] === void 0 || addressMatch[6] === void 0) {
      return host == addressMask;
    }
    const bits = parseInt(addressMatch[6], 10);
    if (Number.isNaN(bits) || bits <= 0 || bits >= 32) {
      return host == addressMask;
    }
    var mask = 0;
    for (var n = 32; n > bits; n--) {
      mask = (mask << 1) + 1;
    }
    mask = ~mask;
    const hostIP = parseInt(hostMatch[1] ?? "", 10) * 16777216 + parseInt(hostMatch[2] ?? "", 10) * 65536 + parseInt(hostMatch[3] ?? "", 10) * 256 + parseInt(hostMatch[4] ?? "", 10);
    const address = parseInt(addressMatch[1] ?? "", 10) * 16777216 + parseInt(addressMatch[2] ?? "", 10) * 65536 + parseInt(addressMatch[3] ?? "", 10) * 256 + parseInt(addressMatch[4] ?? "", 10);
    return (hostIP & mask) == (address & mask);
  }
};
var recognizer = new Recognizer("top", void 0, AND_OP);
function addValue(field, value) {
  const item = new Recognizer(field, (v) => v == value);
  recognizer.addItem(field, item);
}
function addValueNC(field, value) {
  if (value) {
    const lcValue = value.toString().toLowerCase();
    const item = new Recognizer(
      field,
      (v) => v ? v.toString().toLowerCase() == lcValue : false
    );
    recognizer.addItem(field, item);
  }
}
function addPattern(field, pattern) {
  if (pattern instanceof RegExp) {
    const item = new Recognizer(field, (v) => pattern.test(v ? v.toString() : ""));
    recognizer.addItem(field, item);
  } else {
    const re = new RegExp(pattern);
    const item = new Recognizer(field, (v) => re.test(v ? v.toString() : ""));
    recognizer.addItem(field, item);
  }
}
function addIP(addressMask) {
  const item = new Recognizer("host", (v) => v ? Recognizer.ipMatch(v.toString(), addressMask) : false);
  recognizer.addItem("host", item);
}
function matches(record) {
  return recognizer.matches(record);
}

// lib/datetime.ts
import * as fs from "node:fs/promises";

// lib/scanfile.ts
import * as path from "node:path";
import * as process from "node:process";
function getRootPathname(filename) {
  if (filename == "-") {
    return "/dev/fd/0";
  }
  if (filename[0] == path.sep && process.env["ALSCAN_TESTING_ROOTDIR"]) {
    return path.normalize(path.join(process.env["ALSCAN_TESTING_ROOTDIR"], filename));
  }
  return path.normalize(filename);
}
var ScanFile = class {
  filename;
  pathname;
  domain;
  constructor(filename, pathname, domain) {
    if (filename) {
      this.filename = filename;
      if (pathname) {
        this.pathname = pathname;
      } else {
        this.pathname = getRootPathname(filename);
      }
    } else if (pathname) {
      this.pathname = pathname;
      if (process.env["ALSCAN_TESTING_ROOTDIR"] && pathname.substring(0, process.env["ALSCAN_TESTING_ROOTDIR"].length) == process.env["ALSCAN_TESTING_ROOTDIR"]) {
        this.filename = pathname.slice(process.env["ALSCAN_TESTING_ROOTDIR"].length);
      } else if (pathname == "/dev/fd/0") {
        this.filename = "-";
      } else {
        this.filename = pathname;
      }
    } else {
      throw new Error("Either filename or pathname must be defined.");
    }
    this.domain = domain;
  }
  /**
   *  @returns true if the file is compressed.
   */
  isCompressed() {
    return this.pathname.substring(this.pathname.length - 3) == ".gz";
  }
};

// lib/datetime.ts
var PartialDate = class _PartialDate {
  year;
  month;
  day;
  hours;
  minutes;
  seconds;
  timezone;
  /**
   * PartialDate constructor @ctor.
   * A PartialDate is used to define date-time option which allows some values
   * to be determined by additional information.
   * i.e. the start time may have fields defined based upon the stop time, and
   * the stop time may have fields defined based upon the current time.
   */
  constructor() {
    this.year = void 0;
    this.month = void 0;
    this.day = void 0;
    this.hours = void 0;
    this.minutes = void 0;
    this.seconds = void 0;
    this.timezone = void 0;
  }
  /**
   *  Define the PartialDate object based upon a milliseconds since start of epoch timestamp.
   *  @arg timestamp is a Number of milliseconds since the start of the Epoch.
   *  @rtype PartialDate is a reference to the object.
   */
  setTime(timestamp) {
    const time = new Date(timestamp);
    this.year = time.getUTCFullYear();
    this.month = time.getUTCMonth();
    this.day = time.getUTCDate();
    this.hours = time.getUTCHours();
    this.minutes = time.getUTCMinutes();
    this.seconds = time.getUTCSeconds();
    this.timezone = 0;
    return this;
  }
  /** RegExp to recognize seconds since start of Unix epoch. */
  static secondsSinceEpoch = new RegExp(/^@(\d+)$/);
  /** RegExp to recognize time stamp only. */
  static hhmmss = new RegExp(/^(\d{1,2})((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
  /** RegExp to recognize date and time pattern. */
  static yyyymmdd_hhmmss = new RegExp(/^((\d\d\d\d)([-/]))?((\d{1,2})([-/]))?(\d{1,2})(T|\s|:)?(\d{1,2})?((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
  /** RegExp for year first named month date-time pattern. */
  static yyyyMMMdd_hhmmss = new RegExp(/^((\d\d\d\d)(?:[-/]))?(([A-Za-z]+)(?:[-/]))?(\d{1,2})(?:T|\s|:)?(\d{1,2})?((:?)(\d\d))?((:?)(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
  /** RegExp for day first named month date-time pattern. */
  static ddMMMyyyy_hhmmss = new RegExp(/^(\d{1,2})[-/]([A-Za-z]+)([-/](\d\d\d\d))?(T|\s|:)?(\d{1,2})?(:?(\d\d))?(:?(\d\d)(\.\d\d\d)?)?\s*(Z|(\+|-|\s)(\d\d)(\d\d)?)?$/);
  /** Array of Full month names in lower-case English. */
  static fullMonthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ];
  /** Array of three-letter month names in lower-case English. */
  static monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
  ];
  /**
   *  Determine if string date is valid.
   *  @arg value is the date-time as a string.
   */
  static isValidFormat(value) {
    if (_PartialDate.hhmmss.test(value) || _PartialDate.yyyymmdd_hhmmss.test(value) || _PartialDate.secondsSinceEpoch.test(value) || _PartialDate.yyyyMMMdd_hhmmss.test(value) || _PartialDate.ddMMMyyyy_hhmmss.test(value)) {
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
  parse(timestamp, roundDown) {
    if (this.parseHHMMSS(timestamp, roundDown) != null || this.parseSecondSinceEpoch(timestamp, roundDown) != null || this.parseYYYYMMDD_HHMMSS(timestamp, roundDown) != null || this.parseYYYYMMMDD_HHMMSS(timestamp, roundDown) != null || this.parseDDMMMYYYY_HHMMSS(timestamp, roundDown) != null) {
      return this;
    }
    throw new Error(`invalid timestamp: ${timestamp}`);
  }
  parseHHMMSS(timestamp, roundDown) {
    const pattern = _PartialDate.hhmmss.exec(timestamp);
    if (pattern === null) {
      return null;
    }
    this.hours = parseInt(pattern[1] ?? "", 10);
    if (pattern[4] === void 0) {
      this.minutes = roundDown ? 0 : 59;
    } else {
      this.minutes = parseInt(pattern[4], 10);
    }
    if (pattern[7] === void 0) {
      this.seconds = roundDown ? 0 : 59;
    } else {
      this.seconds = parseInt(pattern[7], 10);
    }
    let zone;
    if (pattern[9] !== void 0) {
      if (pattern[9] == "Z") {
        zone = 0;
      } else {
        if (pattern[12] === void 0) {
          zone = 0;
        } else {
          zone = parseInt(pattern[12], 10) * 6e4;
        }
        zone += parseInt(pattern[11] ?? "", 10) * 36e5;
        if (pattern[10] == "-") {
          zone = -zone;
        }
      }
      this.timezone = zone;
    }
    return this;
  }
  parseSecondSinceEpoch(timestamp, _roundDown) {
    const pattern = _PartialDate.secondsSinceEpoch.exec(timestamp);
    if (pattern !== null) {
      this.setTime(1e3 * parseInt(pattern[1] ?? "", 10));
      return this;
    }
    return null;
  }
  parseYYYYMMDD_HHMMSS(timestamp, roundDown) {
    const pattern = _PartialDate.yyyymmdd_hhmmss.exec(timestamp);
    if (pattern !== null) {
      if (pattern[2] !== void 0) {
        this.year = parseInt(pattern[2], 10);
      }
      if (pattern[5] !== void 0) {
        this.month = parseInt(pattern[5], 10) - 1;
      }
      this.day = parseInt(pattern[7] ?? "", 10);
      if (pattern[9] === void 0) {
        this.hours = roundDown ? 0 : 23;
      } else {
        this.hours = parseInt(pattern[9], 10);
      }
      if (pattern[12] === void 0) {
        this.minutes = roundDown ? 0 : 59;
      } else {
        this.minutes = parseInt(pattern[12], 10);
      }
      if (pattern[15] === void 0) {
        this.seconds = roundDown ? 0 : 59;
      } else {
        this.seconds = parseInt(pattern[15], 10);
      }
      let zone;
      if (pattern[17] !== void 0) {
        if (pattern[17] == "Z") {
          zone = 0;
        } else {
          if (pattern[20] === void 0) {
            zone = 0;
          } else {
            zone = parseInt(pattern[20], 10) * 6e4;
          }
          zone += parseInt(pattern[19] ?? "", 10) * 36e5;
          if (pattern[18] == "-") {
            zone = -zone;
          }
        }
        this.timezone = zone;
      }
      return this;
    }
    return null;
  }
  parseYYYYMMMDD_HHMMSS(timestamp, roundDown) {
    const pattern = _PartialDate.yyyyMMMdd_hhmmss.exec(timestamp);
    if (pattern !== null) {
      if (pattern[2] !== void 0) {
        this.year = parseInt(pattern[2], 10);
      }
      if (pattern[4] !== void 0) {
        this.month = _PartialDate.monthNames.indexOf(pattern[4].toLowerCase());
        if (this.month < 0) {
          this.month = _PartialDate.fullMonthNames.indexOf(pattern[4].toLowerCase());
          if (this.month < 0) {
            this.month = void 0;
          }
        }
      }
      this.day = parseInt(pattern[5] ?? "", 10);
      if (pattern[6] === void 0) {
        this.hours = roundDown ? 0 : 23;
      } else {
        this.hours = parseInt(pattern[6], 10);
      }
      if (pattern[9] === void 0) {
        this.minutes = roundDown ? 0 : 59;
      } else {
        this.minutes = parseInt(pattern[9], 10);
      }
      if (pattern[12] === void 0) {
        this.seconds = roundDown ? 0 : 59;
      } else {
        this.seconds = parseInt(pattern[12], 10);
      }
      let zone;
      if (pattern[14] !== void 0) {
        if (pattern[14] == "Z") {
          zone = 0;
        } else {
          if (pattern[17] === void 0) {
            zone = 0;
          } else {
            zone = parseInt(pattern[17], 10) * 6e4;
          }
          if (pattern[16] !== void 0) {
            zone += parseInt(pattern[16], 10) * 36e5;
          }
          if (pattern[15] == "-") {
            zone = -zone;
          }
        }
        this.timezone = zone;
      }
      return this;
    }
    return null;
  }
  parseDDMMMYYYY_HHMMSS(timestamp, roundDown) {
    const pattern = _PartialDate.ddMMMyyyy_hhmmss.exec(timestamp);
    if (pattern !== null) {
      if (pattern[4] !== void 0) {
        this.year = parseInt(pattern[4], 10);
      }
      if (pattern[2] !== void 0) {
        this.month = _PartialDate.monthNames.indexOf(pattern[2].toLowerCase());
        if (this.month < 0) {
          this.month = _PartialDate.fullMonthNames.indexOf(pattern[2].toLowerCase());
          if (this.month < 0) {
            this.month = void 0;
          }
        }
      }
      this.day = parseInt(pattern[1] ?? "", 10);
      if (pattern[6] === void 0) {
        this.hours = roundDown ? 0 : 23;
      } else {
        this.hours = parseInt(pattern[6], 10);
      }
      if (pattern[8] === void 0) {
        this.minutes = roundDown ? 0 : 59;
      } else {
        this.minutes = parseInt(pattern[8], 10);
      }
      if (pattern[10] === void 0) {
        this.seconds = roundDown ? 0 : 59;
      } else {
        this.seconds = parseInt(pattern[10], 10);
      }
      if (pattern[12] !== void 0) {
        let zone;
        if (pattern[12] == "Z") {
          zone = 0;
        } else {
          if (pattern[15] === void 0) {
            zone = 0;
          } else {
            zone = parseInt(pattern[15], 10) * 6e4;
          }
          if (pattern[14] !== void 0) {
            zone += parseInt(pattern[14], 10) * 36e5;
          }
          if (pattern[13] == "-") {
            zone = -zone;
          }
        }
        this.timezone = zone;
      }
      return this;
    }
    return null;
  }
};
var lastDayNonLeap = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var lastDayLeap = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function validateDateSettings(timestamp, year, month, day, hours, minutes, seconds, timezone) {
  const errs = [];
  if (isNaN(year)) {
    errs.push(new Error("Invalid " + timestamp + " year is not a number."));
  } else if (year < 1970) {
    errs.push(new RangeError("Invalid " + timestamp + " year (expected year > 1970): " + year));
  }
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  if (isNaN(month)) {
    errs.push(new Error("Invalid " + timestamp + " month is not a number."));
  } else if (month < 0 || month > 11) {
    errs.push(new RangeError("Invalid " + timestamp + " month is out of range."));
  } else {
    const lastDay = (isLeap ? lastDayLeap[month] : lastDayNonLeap[month]) ?? 31;
    if (!isNaN(day) && (day < 1 || day > lastDay)) {
      errs.push(new RangeError("Invalid " + timestamp + " day of month (expected 1 <= day <= " + lastDay + "): " + day));
    }
  }
  if (isNaN(day)) {
    errs.push(new Error("Invalid " + timestamp + " day of month is not a number."));
  }
  if (isNaN(hours)) {
    errs.push(new Error("Invalid " + timestamp + " hours is not a number."));
  } else if (hours < 0 || hours > 23) {
    errs.push(new RangeError("Invalid " + timestamp + " hour (expected 0 <= hours <= 23): " + hours));
  }
  if (isNaN(minutes)) {
    errs.push(new Error("Invalid " + timestamp + " minutes is not a number."));
  } else if (minutes < 0 || minutes > 59) {
    errs.push(new RangeError("Invalid " + timestamp + " minutes (expected 0 <= minutes <= 59): " + minutes));
  }
  if (isNaN(seconds)) {
    errs.push(new Error("Invalid " + timestamp + " seconds is not a number."));
  } else if (seconds < 0 || seconds > 59) {
    errs.push(new RangeError("Invalid " + timestamp + " seconds (expected 0 <= seconds <= 59): " + seconds));
  }
  if (timezone !== void 0) {
    if (isNaN(timezone)) {
      errs.push(new Error("Invalid " + timestamp + " timezone is not a number."));
    } else if (timezone <= -864e5 || timezone >= 864e5) {
      errs.push(new RangeError("Invalid " + timestamp + " timezone is out of range."));
    }
  }
  return errs;
}
async function lastReboot() {
  const result = new PartialDate();
  try {
    const pathname = getRootPathname("/proc/uptime");
    const contents = await fs.readFile(pathname, { encoding: "utf8" });
    const split = contents.split(" ");
    if (split.length === 2 && typeof split[0] === "string") {
      const uptimeSeconds = parseFloat(split[0]);
      if (!isNaN(uptimeSeconds) && uptimeSeconds > 0) {
        const rebootTime = Date.now() - uptimeSeconds * 1e3;
        result.setTime(rebootTime);
      }
    }
  } catch (e) {
  }
  return result;
}
function calcTimezone(startTimezone, stopTimezone) {
  if (startTimezone === void 0) {
    if (stopTimezone === void 0) {
      return [false, void 0, void 0];
    }
    return [true, stopTimezone, stopTimezone];
  }
  if (stopTimezone === void 0) {
    return [true, startTimezone, startTimezone];
  }
  return [true, startTimezone, stopTimezone];
}
function calcYear(stopYear, useUTC, now) {
  if (stopYear !== void 0) {
    return stopYear;
  }
  if (useUTC) {
    return now.getUTCFullYear();
  }
  return now.getFullYear();
}
function calcMonth(stopMonth, useUTC, now) {
  if (stopMonth !== void 0) {
    return stopMonth;
  }
  if (useUTC) {
    return now.getUTCMonth();
  }
  return now.getMonth();
}
function calcDay(stopDay, useUTC, now) {
  if (stopDay !== void 0) {
    return stopDay;
  }
  if (useUTC) {
    return now.getUTCDate();
  }
  return now.getDate();
}
function calcHours(stopHours, slotWidth, useUTC, now) {
  if (stopHours !== void 0) {
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
function calcMinutes(stopMinutes, slotWidth, useUTC, now) {
  if (stopMinutes !== void 0) {
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
function calcSeconds(stopSeconds) {
  if (stopSeconds !== void 0) {
    return stopSeconds;
  }
  return 59;
}
function dateFactory(year, month, day, hours, minutes, seconds, timezone, useUTC) {
  if (useUTC) {
    const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds, 0));
    date.setTime(date.getTime() - (timezone ?? 0));
    return date;
  }
  return new Date(year, month, day, hours, minutes, seconds, 0);
}
function calcStartDate(start, stopDate, year, month, day, hours, minutes, seconds, timezone, useUTC) {
  const startDate = dateFactory(year, month, day, hours, minutes, seconds, timezone, useUTC);
  const diff = Math.abs(stopDate.getTime() - startDate.getTime());
  if (diff <= 999) {
    return dateFactory(2001, 0, 1, 0, 0, 0, 0, useUTC);
  }
  if (startDate.getTime() < stopDate.getTime()) {
    return startDate;
  }
  if (start.day === void 0 && diff < 24 * 60 * 60 * 1e3) {
    startDate.setTime(startDate.getTime() - 24 * 60 * 60 * 1e3);
    return startDate;
  }
  if (start.month === void 0) {
    const backOneMonth = month === 0 ? dateFactory(year - 1, 11, day, hours, minutes, seconds, timezone, useUTC) : dateFactory(year, month - 1, day, hours, minutes, seconds, timezone, useUTC);
    startDate.setTime(backOneMonth.getTime());
  }
  if (startDate.getTime() > stopDate.getTime() && start.year === void 0) {
    const backOneYear = dateFactory(year - 1, month, day, hours, minutes, seconds, timezone, useUTC);
    startDate.setTime(backOneYear.getTime());
  }
  return startDate;
}
function calculateStartStopNow(start, stop, slotWidth, now) {
  const [useUTC, startTimezone, stopTimezone] = calcTimezone(start.timezone, stop.timezone);
  const stopYear = calcYear(stop.year, useUTC, now);
  const stopMonth = calcMonth(stop.month, useUTC, now);
  const stopDay = calcDay(stop.day, useUTC, now);
  const stopHours = calcHours(stop.hours, slotWidth, useUTC, now);
  const stopMinutes = calcMinutes(stop.minutes, slotWidth, useUTC, now);
  const stopSeconds = calcSeconds(stop.seconds);
  const stopErrors = validateDateSettings("stop", stopYear, stopMonth, stopDay, stopHours, stopMinutes, stopSeconds, stopTimezone ?? 0);
  if (stopErrors.length !== 0) {
    return { start: void 0, stop: void 0, errors: stopErrors };
  }
  const stopDate = dateFactory(stopYear, stopMonth, stopDay, stopHours, stopMinutes, stopSeconds, stopTimezone ?? 0, useUTC);
  const startYear = start.year !== void 0 ? start.year : stopYear;
  const startMonth = start.month !== void 0 ? start.month : stopMonth;
  const startDay = start.day !== void 0 ? start.day : stopDay;
  const startHours = start.hours !== void 0 ? start.hours : stopHours;
  const startMinutes = start.minutes !== void 0 ? start.minutes : stopMinutes;
  const startSeconds = start.seconds !== void 0 ? start.seconds : stopSeconds;
  const startErrors = validateDateSettings("start", startYear, startMonth, startDay, startHours, startMinutes, startSeconds, startTimezone ?? 0);
  if (startErrors.length !== 0) {
    return { start: void 0, stop: void 0, errors: startErrors };
  }
  const startDate = calcStartDate(start, stopDate, startYear, startMonth, startDay, startHours, startMinutes, startSeconds, startTimezone ?? 0, useUTC);
  if (startDate.getTime() > stopDate.getTime()) {
    return { start: startDate, stop: stopDate, errors: [new RangeError("Start time (" + startDate + ") is after stop time (" + stopDate + ").")] };
  }
  return { start: startDate, stop: stopDate, errors: [] };
}
function calculateStartStop(start, stop, slotWidth) {
  const now = /* @__PURE__ */ new Date();
  return calculateStartStopNow(start, stop, slotWidth, now);
}

// lib/tick.ts
var Tick = class {
  time;
  size;
  item;
  constructor(time, size, item) {
    this.time = time;
    if (typeof size == "number") {
      this.size = size;
    } else if (size === void 0) {
      this.size = 0;
    } else {
      this.size = parseInt(size, 10);
      if (isNaN(this.size)) {
        this.size = 0;
      }
    }
    this.item = item;
  }
};

// lib/reporter.ts
var Reporter = class _Reporter {
  /** what type of report */
  id = void 0;
  /** reporting category. */
  category = void 0;
  /** number of items to include in a report. */
  limit = void 0;
  output = (s) => console.log(s);
  /** sort order of report results. */
  order = void 0;
  /** size of time-slots in seconds. */
  slotWidth = void 0;
  /** beginning of reporting period (Date) */
  start = void 0;
  /** end of reporting period (Date) */
  stop = void 0;
  /** Bytes order of magnitudes. */
  static bytesSuffix = [" B", "kB", "MB", "GB", "TB", "PB", "XB"];
  /** Strings used to convert a category option to the title for the report. */
  static categoryLookup = {
    "groups": "Group",
    "sources": "Source",
    "user-agents": "User Agent",
    "agents": "User Agent",
    "uris": "URI",
    "urls": "URL",
    "codes": "HTTP Status",
    "referers": "Referer",
    "referrers": "Referrer",
    "methods": "Method",
    "requests": "Request",
    "protocols": "Protocol",
    "users": "User",
    "ips": "IP",
    "domains": "Domain",
    "undefined": "Unknown"
  };
  /** Names of the months. To match Apache should not be localized. */
  static monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  /**
   *  Zero pad a number to a given width.
   *  @param number to display.
   *  @param width of field.
   *  @rtype String.
   */
  padZero(n, width) {
    const s = n.toString();
    return s.padStart(width, "0");
  }
  /**
   *  Pad a string on left with spaces until it is width characters (right justify).
   *  @param field to pad.
   *  @param width of field.
   */
  padField(field, width) {
    let s = "";
    if (field !== null && field !== void 0) {
      s = field.toString();
    }
    return s.padStart(width, " ");
  }
  /**
   *  Pad a string on right with spaces until it is width characters (left justify).
   *  @param field to pad.
   *  @param width of field.
   */
  padFieldRight(field, width) {
    let s = "";
    if (field !== null && field !== void 0) {
      s = field.toString();
    }
    return s.padEnd(width, " ");
  }
  /**
   *  Returns a milliseconds since Epoch time as an Apache log format.
   *  @param time in milliseconds since Epoch number.
   */
  getTimestamp(time) {
    const date = new Date(time);
    return this.getDatestamp(date);
  }
  /**
   *  Returns a JavaScript Date in Apache log format.
   *  @param date to be converted.
   */
  getDatestamp(date) {
    const timestamp = [];
    const timezoneOffset = date.getTimezoneOffset();
    const sign = timezoneOffset <= 0 ? "+" : "-";
    const timezone = timezoneOffset <= 0 ? -timezoneOffset : timezoneOffset;
    const ZZ = Math.floor(timezone / 60);
    const zz = timezone - ZZ * 60;
    timestamp.push(this.padZero(date.getDate(), 2));
    timestamp.push("/");
    timestamp.push(_Reporter.monthNames[date.getMonth()]);
    timestamp.push("/");
    timestamp.push(date.getFullYear());
    timestamp.push(":");
    timestamp.push(this.padZero(date.getHours(), 2));
    timestamp.push(":");
    timestamp.push(this.padZero(date.getMinutes(), 2));
    timestamp.push(":");
    timestamp.push(this.padZero(date.getSeconds(), 2));
    timestamp.push(" " + sign);
    timestamp.push(this.padZero(ZZ, 2));
    timestamp.push(this.padZero(zz, 2));
    return timestamp.join("");
  }
  /**
   *  Create a time stamp header.
   *  @param start time (milliseconds since Epoch).
   *  @param first time (milliseconds since Epoch).
   *  @param last time (milliseconds since Epoch).
   *  @param stop time (milliseconds since Epoch).
   *  @param title String.
   */
  getTimestampHeader(start, first, last, stop, title) {
    const startTS = this.getTimestamp(start);
    let firstTS = this.getTimestamp(first);
    let lastTS = this.getTimestamp(last);
    let stopTS = this.getTimestamp(stop);
    let timezone = this.tzSuffix(startTS);
    if (timezone == this.tzSuffix(firstTS) && timezone == this.tzSuffix(lastTS) && timezone == this.tzSuffix(stopTS)) {
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
    const header = startTS + " [" + firstTS + "] - [" + lastTS + "] " + stopTS + " " + title + "\n";
    return header;
  }
  /**
   *  Return number of bytes scaled by suffix.
   *  @param nBytes Number.
   */
  getBytesString(nBytes) {
    let radix = 0;
    let exponent = 1;
    let scaled = nBytes;
    while (scaled > 5120) {
      scaled = scaled / 1024;
      radix += 1;
      exponent *= 1024;
    }
    if (radix === 0) {
      return this.padField(nBytes.toString(), 4) + "     B";
    }
    return this.padField((nBytes / exponent).toFixed(3), 8) + _Reporter.bytesSuffix[radix];
  }
  /**
   *  Return number of bytes per second as a scaled 11 character string.
   *  @param nBytes Number of bytes.
   *  @param elapsed seconds.
   */
  getBPS(nBytes, elapsed) {
    if (elapsed === 0) {
      return "    NaN    ";
    }
    var radix = 0;
    var exponent = 1;
    var scaled = Math.floor(nBytes / elapsed);
    while (scaled > 5120) {
      scaled = scaled / 1024;
      radix += 1;
      exponent *= 1024;
    }
    const bps = nBytes / elapsed / exponent;
    return this.padField(bps.toFixed(2), 7) + _Reporter.bytesSuffix[radix] + "/s";
  }
  /**
   *  Report an error message.
   *  @param error.
   */
  reportError(err) {
    console.error("ERROR: " + err.message);
  }
  /**
   *  Create report (override).
   *  @param ticks data to report.
   */
  async report(_ticks) {
  }
  /**
   * Extract the timezone from a timestamp string.
   * @param s timestamp string
   * @returns last 5 characters (timezone portion)
   */
  tzSuffix(s) {
    if (s.length < 5) {
      return "";
    }
    return s.substring(s.length - 5);
  }
};

// lib/timeslot.ts
import sortOn from "sort-on";
var SlotItem = class {
  title;
  count;
  currentCount;
  peakCount;
  bandwidth;
  currentBandwidth;
  peakBandwidth;
  first;
  last;
  lastTime;
  constructor(tick) {
    this.title = tick.item;
    this.count = this.currentCount = this.peakCount = 1;
    this.bandwidth = this.currentBandwidth = this.peakBandwidth = tick.size;
    this.first = this.last = this.lastTime = tick.time;
  }
  /**
   *  Increment the item by the tick.
   *  @arg tick seen.
   */
  inc(tick) {
    this.count += 1;
    this.bandwidth += tick.size;
    if (this.last < tick.time) {
      this.last = tick.time;
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
};
var TimeSlot = class _TimeSlot {
  ticks;
  firstIndex;
  lastIndex;
  startTime;
  stopTime;
  firstTime;
  lastTime;
  options;
  items;
  totals;
  constructor(ticks, firstIndex, lastIndex, startTime, stopTime, options) {
    this.ticks = ticks;
    this.firstIndex = firstIndex;
    this.lastIndex = lastIndex;
    this.startTime = startTime;
    if (firstIndex < 0 || firstIndex >= ticks.length) {
      throw new RangeError(`firstIndex must be in range`);
    }
    if (lastIndex < 0 || lastIndex >= ticks.length || lastIndex < firstIndex) {
      throw new RangeError(`lastIndex must be in range`);
    }
    this.firstTime = ticks[firstIndex].time;
    this.stopTime = stopTime;
    this.lastTime = ticks[lastIndex].time;
    this.options = options;
    this.totals = void 0;
    this.items = [];
  }
  /**
   *  Find an item which matches the item value of the tick.
   *  @arg tick to locate.
   *  @returns Index of tick in items array. -1 if not found.
   */
  find(tick) {
    for (let n = 0; n < this.items.length; n++) {
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
  inc(index, tick) {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError("index is out-of-bounds.");
    }
    this.items[index].inc(tick);
  }
  /** Table used to convert a sort option to the field to sort upon. */
  static sortFieldLookup = {
    "title": "title",
    "item": "title",
    "count": "count",
    "bandwidth": "bandwidth",
    "peak": "peakCount",
    "peak-bandwidth": "peakBandwidth"
  };
  /**
   *  Process all of the ticks in this time slot to generate summary data.
   */
  scan() {
    for (let n = this.firstIndex; n <= this.lastIndex; n++) {
      const tick = this.ticks[n];
      if (!tick) {
        continue;
      }
      if (n == this.firstIndex) {
        this.totals = new SlotItem(tick);
      } else if (this.totals != null) {
        this.totals.inc(tick);
      }
      const index = this.find(tick);
      if (index < 0) {
        this.items.push(new SlotItem(tick));
      } else {
        this.inc(index, tick);
      }
    }
    if (this.options.order) {
      let field = "count";
      if (_TimeSlot.sortFieldLookup[this.options.order]) {
        field = _TimeSlot.sortFieldLookup[this.options.order] ?? "title";
      }
      if (field == "title") {
        this.items = sortOn(this.items, field);
      } else {
        this.items = sortOn(this.items, `-${field}`);
      }
    }
  }
  /**
   *  Perform a totals only scan of the TimeSlot.
   */
  totalScan() {
    for (let n = this.firstIndex; n <= this.lastIndex; n++) {
      const tick = this.ticks[n];
      if (n == this.firstIndex) {
        this.totals = new SlotItem(tick);
      } else if (this.totals != null) {
        this.totals.inc(tick);
      }
    }
  }
  /**
   *  @returns the number of items in the TimeSlot.
   */
  nItems() {
    return this.items.length;
  }
  /**
   *  Access an item in the TimeSlot.
   *  @arg n index of the item.
   */
  getItem(n) {
    if (n < 0 || n >= this.items.length) {
      throw new RangeError("Index is out-of-bounds.");
    }
    return this.items[n];
  }
  /**
   *  Access the totals associated with this TimeSlot.
   */
  getTotals() {
    return this.totals;
  }
};

// lib/deny.ts
var DenyReport = class extends Reporter {
  constructor() {
    super();
    this.id = "deny";
  }
  /**
   *  Create Deny report.
   *  @param ticks data to create report.
   */
  async report(ticks) {
    if (ticks.length === 0 || this.start === void 0 || this.stop === void 0 || this.limit === void 0) {
      return;
    }
    const slot = new TimeSlot(ticks, 0, ticks.length - 1, this.start.getTime(), this.stop.getTime(), this);
    slot.scan();
    const ips = [];
    for (let n = 0; n < slot.nItems() && n < this.limit; n++) {
      const title = slot.getItem(n).title;
      if (title) {
        ips.push(title);
      }
    }
    const sorted = ips.sort();
    for (const ip of sorted) {
      this.output(`deny from ${ip}`);
    }
  }
};

// lib/downtime.ts
var DowntimeReport = class extends Reporter {
  /**
   *  Create Downtime report.
   *  @param ticks data for the report.
   */
  async report(ticks) {
    if (ticks.length === 0 || this.start === void 0 || this.stop === void 0 || this.slotWidth === void 0 || this.limit === void 0) {
      this.output("No entires match search criteria.");
      return;
    }
    const firstTime = ticks[0].time;
    const firstTS = this.getTimestamp(firstTime);
    const lastTime = ticks[ticks.length - 1].time;
    const lastTS = this.getTimestamp(lastTime);
    let tsFirst = 0;
    let tsLast = 26;
    if (this.tzSuffix(firstTS) == this.tzSuffix(lastTS)) {
      tsLast = 20;
    }
    if (firstTS.substring(0, 12) == lastTS.substring(0, 12)) {
      tsFirst = 12;
    }
    const stopTimeMS = this.stop.getTime();
    this.output(this.getTimestampHeader(this.start, firstTime, lastTime, stopTimeMS, "Downtime"));
    let row;
    row = this.padFieldRight("Time", tsLast - tsFirst) + " ";
    row += " Count  Bandwidth";
    this.output(row);
    const slotWidthMS = this.slotWidth * 1e3;
    let currentTime = Math.floor(ticks[0].time / slotWidthMS) * slotWidthMS;
    let nextTime = currentTime - 1e3;
    let count = 0;
    let bandwidth = 0;
    let n = 0;
    while (n < ticks.length && ticks[n].time <= stopTimeMS) {
      nextTime += slotWidthMS;
      while (n < ticks.length && ticks[n].time <= nextTime) {
        count += 1;
        bandwidth += ticks[n].size;
        n += 1;
      }
      row = this.getTimestamp(currentTime).substring(tsFirst, tsLast);
      row += this.padField(count, 7);
      if (count === 0) {
        row += "    -";
      } else {
        row += this.padField(this.getBytesString(bandwidth), 9);
      }
      currentTime += slotWidthMS;
      this.output(row);
      count = 0;
      bandwidth = 0;
    }
  }
};

// lib/lines.ts
import * as stream from "node:stream";
var NL = 10;
var LineStream = class extends stream.Transform {
  _buffer;
  /**
   *  @ctor LineStream constructor.
   *  @param options for Stream.
   */
  constructor(options) {
    super(options);
    this._buffer = "";
  }
  /**
   *  Stream filter standard function.
   *  @param chunk block of data to translate.
   *  @param encoding of the stream.
   *  @param done callback.
   */
  _transform(chunk, _encoding, done) {
    let first = 0;
    for (let n = 0; n < chunk.length; n++) {
      if (chunk[n] == NL) {
        let segment;
        if (first === 0) {
          segment = this._buffer + chunk.slice(0, n + 1);
          this._buffer = "";
        } else {
          segment = chunk.slice(first, n + 1);
        }
        this.push(segment);
        first = n + 1;
      }
    }
    if (first < chunk.length) {
      this._buffer += chunk.slice(first);
    }
    done();
  }
  /**
   *  Stream filter standard _flush function.
   *  @param done callback.
   */
  _flush(done) {
    if (this._buffer.length > 0) {
      this.push(this._buffer);
    }
    done();
  }
};

// lib/panel-access.ts
import * as fs2 from "node:fs/promises";
import * as path2 from "node:path";
var PanelAccess = class {
  /** Identifier of the panel interface. */
  id = "default";
  /** Does this panel support --accounts option. */
  hasAccounts = false;
  /** Does this panel support --archives option. */
  hasArchives = false;
  /** Does this panel support --domains option. */
  hasDomains = false;
  /** Does this panel support --panel option. */
  hasPanelLog = false;
  /** Does this panel support --main option. */
  hasMainLog = false;
  /**
    * Determine if the panel is installed.
    */
  async isActive() {
    return true;
  }
  /**
   *  Find all available log files.
   */
  async findAllLogFiles() {
    return [];
  }
  /**
   *  Find all log files associated with an account.
   *  @arg account name.
   */
  async findAccountLogFiles(_account) {
    return [];
  }
  /**
   *  Find log files associated with a single domain.
   *  @arg domain name.
   */
  async findDomainLogFiles(_domain) {
    return [];
  }
  /**
   *  Find the main (no vhost) log files.
   */
  async findMainLogFiles() {
    return [];
  }
  /**
   *  Find the log files associated with the panel itself.
   */
  async findPanelLogFiles() {
    return [];
  }
  /**
   *  Find all archived log files between the start and stop Date's.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findAllArchiveFiles(_start, _stop) {
    return [];
  }
  /**
   *  Find all archived log files for an account.
   *  @arg account name.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findAccountArchiveFiles(_account, _start, _stop) {
    return [];
  }
  /**
   *  Find all archived log files for a domain.
   *  @arg domain name.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findDomainArchiveFiles(_domain, _start, _stop) {
    return [];
  }
  /**
   *  Find all archived main log files.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findMainArchiveFiles(_start, _stop) {
    return [];
  }
  /**
   *  Find all archived panel log files.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findPanelArchiveFiles(_start, _stop) {
    return [];
  }
  /**
   *  Find a single log file.
   *  @arg filename - name of the log file.
   */
  async findLogFile(filename) {
    const pathname = getRootPathname(filename);
    if (pathname === "/dev/fd/0") {
      return [new ScanFile(filename, pathname, "file")];
    }
    try {
      const stats = await fs2.stat(pathname);
      if (stats.isFile()) {
        return [new ScanFile(filename, pathname, "file")];
      }
    } catch {
    }
    try {
      const stats = await fs2.stat(filename);
      if (stats.isFile()) {
        return [new ScanFile(filename, filename, "file")];
      }
    } catch {
    }
    return [];
  }
  /**
   *  Find all log files in a directory.
   *  @arg dir directory name.
   */
  async findLogFilesInDirectory(dir) {
    const dirpath = getRootPathname(dir);
    try {
      const files = await fs2.readdir(dirpath);
      const result = [];
      for (const name of files) {
        try {
          const pathname = path2.join(dirpath, name);
          const filename = path2.join(dir, name);
          const stats = await fs2.stat(pathname);
          if (stats.isFile()) {
            result.push(new ScanFile(filename, pathname, "directory"));
          }
        } catch {
        }
      }
      return result;
    } catch {
      return [];
    }
  }
};

// lib/panels/50-cpanel.ts
import * as fs3 from "node:fs/promises";
import * as path3 from "node:path";
import yaml from "js-yaml";
var CPANEL_MAIN_LOG = "/usr/local/apache/logs/access_log";
var CPANEL_PANEL_LOG = "/usr/local/cpanel/logs/access_log";
var CPANEL_PREFIX = "/usr/local/apache/domlogs";
var CPANEL_USERDATA_DIR = "/var/cpanel/userdata";
var CPANEL_USERDOMAINS = "/etc/userdomains";
var CPANEL_VERSION_FILE = "/usr/local/cpanel/version";
var MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
var mains = {};
async function loadAccountMain(account) {
  if (!mains[account]) {
    const pathname = getRootPathname(path3.join(CPANEL_USERDATA_DIR, account, "main"));
    try {
      const source = await fs3.readFile(pathname, { encoding: "utf8", flag: "r" });
      const contents = yaml.load(source, { filename: pathname });
      ;
      if (contents) {
        mains[account] = contents;
      }
    } catch (_) {
    }
  }
}
async function getAccountHomeDirectory(account) {
  await loadAccountMain(account);
  if (mains[account]) {
    const main2 = mains[account];
    let contents;
    if (main2 && typeof main2 === "object" && "main_domain" in main2 && main2["main_domain"] && typeof main2["main_domain"] === "string") {
      const pathname = getRootPathname(path3.join(CPANEL_USERDATA_DIR, account, main2["main_domain"]));
      const domain = await fs3.readFile(pathname, { encoding: "utf8", flag: "r" });
      contents = null;
      try {
        contents = yaml.load(domain, { filename: pathname });
      } catch (e) {
      }
    }
    if (contents && typeof contents === "object" && "homedir" in contents && contents.homedir && typeof contents.homedir === "string") {
      return getRootPathname(contents.homedir);
    } else {
      return getRootPathname("/home/" + account);
    }
  }
  ;
  return void 0;
}
async function getAllAccounts() {
  const dir = getRootPathname(CPANEL_USERDATA_DIR);
  const dirs = await fs3.readdir(dir);
  const accounts = [];
  for (const name of dirs) {
    if (name != "nobody") {
      accounts.push(name);
    }
  }
  return accounts;
}
async function getAccountLogFiles(account) {
  const files = [];
  const domains = [];
  await loadAccountMain(account);
  if (mains[account]) {
    const contents = mains[account];
    if (contents && typeof contents === "object") {
      if ("main_domain" in contents && contents["main_domain"] && typeof contents["main_domain"] === "string") {
        domains.push({ "domain": contents["main_domain"], "subdomain": contents["main_domain"] });
      }
      if ("addon_domains" in contents && contents["addon_domains"] && typeof contents["addon_domains"] === "object") {
        const addon_domains = contents["addon_domains"];
        for (const domain in contents["addon_domains"]) {
          const addon = addon_domains[domain] ?? domain;
          domains.push({ "domain": domain, "subdomain": addon });
        }
      }
      if ("sub_domains" in contents && contents["sub_domains"] && Array.isArray(contents["sub_domains"])) {
        contents["sub_domains"].forEach((name) => {
          const found = domains.some((domain) => domain.subdomain == name);
          if (!found) {
            domains.push({ "domain": name, "subdomain": name });
          }
        });
      }
      for (const entry of domains) {
        const filename = path3.join(CPANEL_PREFIX, entry.subdomain);
        const pathname = getRootPathname(filename);
        try {
          const stats = await fs3.stat(pathname);
          if (stats.isFile()) {
            files.push(new ScanFile(filename, pathname, entry.domain));
            const sslFilename = filename + "-ssl_log";
            const sslPathname = pathname + "-ssl_log";
            const ssl = await fs3.stat(sslPathname);
            if (ssl.isFile()) {
              files.push(new ScanFile(sslFilename, sslPathname, entry.domain));
            }
          }
        } catch {
        }
      }
    }
  }
  return files;
}
function getArchiveMonths(start, stop) {
  var months = [];
  var month, year;
  year = start.getFullYear();
  if (year == stop.getFullYear()) {
    month = start.getMonth();
  } else {
    for (month = start.getMonth(); month < 12; month++) {
      months.push(MONTH_NAMES[month] + "-" + year);
    }
    for (year += 1; year < stop.getFullYear(); year++) {
      for (month = 0; month < 12; month++) {
        months.push(MONTH_NAMES[month] + "-" + year);
      }
    }
    year = stop.getFullYear();
    month = 0;
  }
  for (; month <= stop.getMonth(); month++) {
    months.push(MONTH_NAMES[month] + "-" + year);
  }
  return months;
}
async function getAccountArchiveFiles(account, months) {
  const files = [];
  const homedir = await getAccountHomeDirectory(account);
  if (homedir) {
    const logsdir = path3.join(homedir, "logs");
    await loadAccountMain(account);
    if (mains[account]) {
      const contents = mains[account];
      let domains = [];
      if (contents && typeof contents === "object" && "main_domain" in contents && typeof contents["main_domain"] == "string") {
        domains.push({ "domain": contents["main_domain"], "subdomain": contents["main_domain"] });
      }
      if (contents && typeof contents === "object" && "addon_domains" in contents && contents["addon_domains"] && typeof contents["addon_domains"] === "object") {
        const addon_domains = contents["addon_domains"];
        for (const domain in addon_domains) {
          if (typeof domain === "string" && domain in addon_domains && typeof addon_domains[domain] === "string") {
            domains.push({ "domain": domain, "subdomain": addon_domains[domain] });
          }
        }
      }
      if (contents && typeof contents === "object" && "sub_domains" in contents && contents["sub_domains"] && Array.isArray(contents["sub_domains"])) {
        contents["sub_domains"].forEach((name) => {
          const found = domains.some((domain) => domain.subdomain == name);
          if (!found) {
            domains.push({ "domain": name, "subdomain": name });
          }
        });
      }
      try {
        const logfiles = await fs3.readdir(logsdir);
        domains.forEach(function(entry) {
          months.forEach(function(month) {
            const filename = entry.subdomain + "-" + month + ".gz";
            if (logfiles.indexOf(filename) >= 0) {
              const pathname = path3.join(logsdir, filename);
              files.push(new ScanFile(void 0, pathname, entry.domain));
            }
            const sslFilename = entry.subdomain + "-ssl_log-" + month + ".gz";
            if (logfiles.indexOf(sslFilename) >= 0) {
              const pathname = path3.join(logsdir, sslFilename);
              files.push(new ScanFile(void 0, pathname, entry.domain));
            }
          });
        });
      } catch {
      }
    }
  }
  return files;
}
async function getDomainLogFiles(domain, canonical) {
  const files = [];
  const filename = path3.join(CPANEL_PREFIX, domain);
  const pathname = getRootPathname(filename);
  try {
    const stats = await fs3.stat(pathname);
    if (stats.isFile()) {
      files.push(new ScanFile(filename, pathname, canonical));
      const sslFilename = filename + "-ssl_log";
      const sslPathname = pathname + "-ssl_log";
      const ssl = await fs3.stat(sslPathname);
      if (ssl.isFile()) {
        files.push(new ScanFile(sslFilename, sslPathname, canonical));
      }
    }
  } catch {
  }
  return files;
}
var userDomains = "";
async function getUserDomains() {
  if (userDomains === "") {
    try {
      userDomains = await fs3.readFile(getRootPathname(CPANEL_USERDOMAINS), { encoding: "utf8" });
    } catch (_) {
      userDomains = "";
    }
  }
  return userDomains;
}
async function getDomainOwner(domain) {
  const contents = await getUserDomains();
  const pattern = new RegExp("^" + domain + ": (.*)$", "im");
  const find = pattern.exec(contents);
  if (find) {
    return find[1];
  }
  return void 0;
}
async function getSubdomainName(domain) {
  const owner = await getDomainOwner(domain);
  if (!owner) {
    return void 0;
  }
  await loadAccountMain(owner);
  if (mains[owner]) {
    const contents = mains[owner];
    if (contents && typeof contents === "object" && "addon_domains" in contents && contents["addon_domains"] && typeof contents["addon_domains"] === "object") {
      const addon_domains = contents["addon_domains"];
      if (domain in addon_domains) {
        return addon_domains[domain];
      }
    }
  }
  return void 0;
}
var CPanelAccess = class extends PanelAccess {
  constructor() {
    super();
    this.id = "cPanel";
    this.hasAccounts = true;
    this.hasArchives = true;
    this.hasDomains = true;
    this.hasMainLog = true;
    this.hasPanelLog = true;
  }
  /**
    * Determine if the panel is installed.
    * @return Use cPanel version file to check installation.
    */
  async isActive() {
    const pathname = getRootPathname(CPANEL_VERSION_FILE);
    try {
      const stats = await fs3.stat(pathname);
      if (stats.isFile()) {
        return true;
      }
    } catch {
    }
    return false;
  }
  /**
   *  Find all available log files for accounts and domains.
   *  @returns promise for an Array of ScanFile.
   */
  async findAllLogFiles() {
    const files = [];
    const accounts = await getAllAccounts();
    for (const account of accounts) {
      const each = await getAccountLogFiles(account);
      files.push(...each);
    }
    return files;
  }
  /**
   *  Find all log files associated with an account.
   *  @arg account name.
   *  @returns promise for an Array of ScanFile.
   */
  async findAccountLogFiles(account) {
    return await getAccountLogFiles(account);
  }
  /**
   *  Find log files associated with a single domain.
   *  @arg domain name.
   *  @returns promise for an Array of ScanFile.
   */
  async findDomainLogFiles(domain) {
    const files = [];
    const subdomain = await getSubdomainName(domain);
    if (subdomain) {
      const perSubdomain = await getDomainLogFiles(subdomain, domain);
      files.push(...perSubdomain);
    }
    const perDomain = await getDomainLogFiles(domain, domain);
    files.push(...perDomain);
    return files;
  }
  /**
   *  Find the main (no vhost) log files.
   *  @returns promise for an Array of ScanFile.
   */
  async findMainLogFiles() {
    const pathname = getRootPathname(CPANEL_MAIN_LOG);
    try {
      const stats = await fs3.stat(pathname);
      if (stats.isFile()) {
        return [new ScanFile(CPANEL_MAIN_LOG, pathname, "main")];
      }
    } catch {
    }
    return [];
  }
  /**
   *  Find the log files associated with the panel itself.
   *  @returns promise for an Array of ScanFile.
   */
  async findPanelLogFiles() {
    const pathname = getRootPathname(CPANEL_PANEL_LOG);
    try {
      const stats = await fs3.stat(pathname);
      if (stats.isFile()) {
        return [new ScanFile(CPANEL_PANEL_LOG, pathname, "panel")];
      }
    } catch {
    }
    return [];
  }
  /**
   *  Find all archived log files between the start and stop Date's.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   *  @returns promise for an Array of ScanFile.
   */
  async findAllArchiveFiles(start, stop) {
    const months = getArchiveMonths(start, stop);
    const accounts = await getAllAccounts();
    const files = [];
    for (const account of accounts) {
      const perAccount = await getAccountArchiveFiles(account, months);
      files.push(...perAccount);
    }
    return files;
  }
  /**
   *  Find all archived log files for an account.
   *  @arg account name.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   *  @returns promise for an Array of ScanFile.
   */
  async findAccountArchiveFiles(account, start, stop) {
    const months = getArchiveMonths(start, stop);
    return await getAccountArchiveFiles(account, months);
  }
  /**
   *  Find all archived log files for a domain.
   *  @arg domain name.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   *  @returns promise for an Array of ScanFile.
   */
  async findDomainArchiveFiles(domain, start, stop) {
    const account = await getDomainOwner(domain);
    if (!account) {
      return [];
    }
    const subdomain = await getSubdomainName(domain);
    const homedir = await getAccountHomeDirectory(account);
    if (!homedir) {
      return [];
    }
    const logsdir = path3.join(homedir, "logs");
    const months = getArchiveMonths(start, stop);
    const files = [];
    try {
      const logfiles = await fs3.readdir(logsdir);
      for (const month of months) {
        const filename = `${domain}-${month}.gz`;
        if (logfiles.includes(filename)) {
          const pathname = path3.join(logsdir, filename);
          files.push(new ScanFile(void 0, pathname, domain));
        } else if (subdomain) {
          const filename2 = `${subdomain}-${month}.gz`;
          if (logfiles.includes(filename2)) {
            const pathname = path3.join(logsdir, filename2);
            files.push(new ScanFile(void 0, pathname, domain));
          }
        }
        const sslFilename = `${domain}-ssl_log-${month}.gz`;
        if (logfiles.includes(sslFilename)) {
          const pathname = path3.join(logsdir, sslFilename);
          files.push(new ScanFile(void 0, pathname, domain));
        } else if (subdomain) {
          const sslFilename2 = `${subdomain}-ssl_log-${month}.gz`;
          if (logfiles.includes(sslFilename2)) {
            const pathname = path3.join(logsdir, sslFilename2);
            files.push(new ScanFile(void 0, pathname, domain));
          }
        }
      }
    } catch {
      return [];
    }
    return files;
  }
  /**
   *  Find all archived main log files.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   *  @returns promise for an (empty) Array of ScanFile.
   */
  async findMainArchiveFiles(_start, _stop) {
    return [];
  }
  /**
   *  Find all archived panel log files.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   *  @returns promise for an (empty) Array of ScanFile.
   */
  async findPanelArchiveFiles(_start, _stop) {
    return [];
  }
};

// lib/panels/60-cpanel-user.ts
import * as fs4 from "node:fs/promises";
import * as path4 from "node:path";
import * as process2 from "node:process";
var CPANEL_DIRECTORY = ".cpanel";
function getHomeDirectory() {
  if (process2.env["ALSCAN_TESTING_HOME"]) {
    return getRootPathname(process2.env["ALSCAN_TESTING_HOME"]);
  }
  if (process2.env["HOME"]) {
    return getRootPathname(process2.env["HOME"]);
  }
  return ".";
}
var IGNORED_FILENAME = [
  "ftpxferlog",
  "ftpxferlog.offset",
  "ftpxferlog.offsetftpsep"
];
var IGNORED_SUFFIX = [
  "-bytes_log",
  "-bytes_log.offset",
  "-ftp_log",
  "-ftp_log.offsetftpbytes",
  "-ftp_log.offset",
  ".bkup",
  ".bkup2"
];
var IGNORED_PATTERN = [
  new RegExp(/-ftp_log-...-\d\d\d\d\.gz$/)
];
var MONTH_NAMES2 = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function getArchiveMonths2(start, stop) {
  const months = [];
  let month;
  let year = start.getFullYear();
  if (year == stop.getFullYear()) {
    month = start.getMonth();
  } else {
    for (month = start.getMonth(); month < 12; month++) {
      months.push(MONTH_NAMES2[month] + "-" + year);
    }
    for (year += 1; year < stop.getFullYear(); year++) {
      for (month = 0; month < 12; month++) {
        months.push(MONTH_NAMES2[month] + "-" + year);
      }
    }
    year = stop.getFullYear();
    month = 0;
  }
  for (; month <= stop.getMonth(); month++) {
    months.push(MONTH_NAMES2[month] + "-" + year);
  }
  return months;
}
async function getDomainLogFiles2(domain) {
  const files = [];
  const pathname = path4.join(getHomeDirectory(), "access-logs", domain);
  try {
    const stats = await fs4.stat(pathname);
    if (stats.isFile()) {
      files.push(new ScanFile(void 0, pathname, domain));
    }
  } catch (_) {
  }
  const sslPathname = pathname + "-ssl_log";
  try {
    const stats = await fs4.stat(sslPathname);
    if (stats.isFile()) {
      files.push(new ScanFile(void 0, sslPathname, domain));
    }
  } catch (_) {
  }
  return files;
}
function isIgnoredFilename(filename) {
  return IGNORED_FILENAME.indexOf(filename) >= 0;
}
function isIgnoredSuffix(filename) {
  return IGNORED_SUFFIX.some((suffix) => suffix.length < filename.length && suffix == filename.substring(filename.length - suffix.length));
}
function isIgnoredPattern(filename) {
  return IGNORED_PATTERN.some((pattern) => pattern.test(filename));
}
function isIgnoredFile(filename) {
  return isIgnoredFilename(filename) || isIgnoredSuffix(filename) || isIgnoredPattern(filename);
}
var CPanelUserAccess = class _CPanelUserAccess extends PanelAccess {
  constructor() {
    super();
    this.id = "cPanelUser";
    this.hasAccounts = false;
    this.hasArchives = true;
    this.hasDomains = true;
    this.hasMainLog = false;
    this.hasPanelLog = false;
  }
  /** Pattern used to recognize an archived log file. */
  static archivePattern = new RegExp(/^(.*?)(-ssl_log)?-(...-\d\d\d\d)\.gz/);
  /** Pattern used to extract domain name from filename. */
  static domainPattern = new RegExp(/^(.*?)(-ssl_log)?$/);
  /**
    * Determine if the panel is installed.
    * @return Use cPanel version file to check installation.
    */
  async isActive() {
    const pathname = path4.join(getHomeDirectory(), CPANEL_DIRECTORY);
    try {
      const stats = await fs4.stat(pathname);
      if (stats.isFile()) {
        return true;
      }
    } catch (_) {
    }
    return false;
  }
  /**
   *  Find all available log files for accounts and domains.
   */
  async findAllLogFiles() {
    const logdir = path4.join(getHomeDirectory(), "access-logs");
    const files = [];
    try {
      const list = await fs4.readdir(logdir);
      for (const name of list) {
        if (!isIgnoredFile(name)) {
          const check = _CPanelUserAccess.domainPattern.exec(name);
          if (check) {
            const pathname = path4.join(logdir, name);
            files.push(new ScanFile(void 0, pathname, check[1]));
          }
        }
      }
    } catch {
    }
    return files;
  }
  /**
   *  Find all log files associated with an account.
   *  @arg account name.
   */
  async findAccountLogFiles(_account) {
    return [];
  }
  /**
   *  Find log files associated with a single domain.
   *  @arg domain name.
   */
  async findDomainLogFiles(domain) {
    return getDomainLogFiles2(domain);
  }
  /**
   *  Find the main (no vhost) log files.
   */
  async findMainLogFiles() {
    return [];
  }
  /**
   *  Find the log files associated with the panel itself.
   */
  async findPanelLogFiles() {
    return [];
  }
  /**
   *  Find all archived log files between the start and stop Date's.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findAllArchiveFiles(start, stop) {
    const logdir = path4.join(getHomeDirectory(), "logs");
    const months = getArchiveMonths2(start, stop);
    const files = [];
    try {
      const list = await fs4.readdir(logdir);
      for (const name of list) {
        const check = _CPanelUserAccess.archivePattern.exec(name);
        if (check && months.indexOf(check[3] ?? "") >= 0 && !isIgnoredFile(name)) {
          const pathname = path4.join(logdir, name);
          files.push(new ScanFile(void 0, pathname, check[1]));
        }
      }
    } catch {
    }
    return files;
  }
  /**
   *  Find all archived log files for an account.
   *  @arg account name.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findAccountArchiveFiles(_account, _start, _stop) {
    return [];
  }
  /**
   *  Find all archived log files for a domain.
   *  @arg domain name.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findDomainArchiveFiles(domain, start, stop) {
    const logdir = path4.join(getHomeDirectory(), "logs");
    const months = getArchiveMonths2(start, stop);
    const files = [];
    try {
      const list = await fs4.readdir(logdir);
      for (const name of list) {
        for (const month of months) {
          if (name == `${domain}-${month}.gz` || name == `${domain}-ssl_log-${month}.gz`) {
            const pathname = path4.join(logdir, name);
            files.push(new ScanFile(void 0, pathname, domain));
          }
        }
      }
    } catch {
    }
    return files;
  }
  /**
   *  Find all archived main log files.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findMainArchiveFiles(_start, _stop) {
    return [];
  }
  /**
   *  Find all archived panel log files.
   *  @arg start first Date of archives.
   *  @arg stop last Date of archives.
   */
  async findPanelArchiveFiles(_start, _stop) {
    return [];
  }
};

// lib/panels.ts
var Panels = class {
  /** Current panel. */
  panel;
  /** Does the current panel support Archives. */
  hasArchives() {
    return this.panel !== void 0 && this.panel.hasArchives;
  }
  /** Does the current panel support Accounts. */
  hasAccounts() {
    return this.panel !== void 0 && this.panel.hasAccounts;
  }
  /** Does current panel support Domains. */
  hasDomains() {
    return this.panel !== void 0 && this.panel.hasDomains;
  }
  /** Does the current panel have a Panel access log. */
  hasPanelLog() {
    return this.panel !== void 0 && this.panel.hasPanelLog;
  }
  /** Does the current panel have a default (main) access log. */
  hasMainLog() {
    return this.panel !== void 0 && this.panel.hasMainLog;
  }
  /** Load panel interfaces. */
  async load() {
    const cPanel = new CPanelAccess();
    const hasCPanel = await cPanel.isActive();
    if (hasCPanel) {
      this.panel = cPanel;
    } else {
      const cPanelUser = new CPanelUserAccess();
      const hasUser = await cPanelUser.isActive();
      if (hasUser) {
        this.panel = cPanelUser;
      } else {
        this.panel = new PanelAccess();
      }
    }
  }
  /**
   *  Find the log files based upon the options.
   *  @arg options object.
   */
  async findScanFiles(options) {
    if (this.panel === void 0) {
      return [];
    }
    const list = [];
    if (options.domlogs && this.hasDomains()) {
      const files = await this.panel.findAllLogFiles();
      list.push(...files);
      if (this.hasArchives() && options.archive && options.start && options.stop) {
        const archives = await this.panel.findAllArchiveFiles(options.start, options.stop);
        list.push(...archives);
      }
    } else {
      if (Array.isArray(options.accounts) && this.hasAccounts()) {
        for (const account of options.accounts) {
          const files = await this.panel.findAccountLogFiles(account);
          list.push(...files);
          if (this.hasArchives() && options.archive && options.start && options.stop) {
            const archives = await this.panel.findAccountArchiveFiles(account, options.start, options.stop);
            list.push(...archives);
          }
        }
      }
      if (Array.isArray(options.domains) && this.hasAccounts()) {
        for (const domain of options.domains) {
          const files = await this.panel.findDomainLogFiles(domain);
          list.push(...files);
          if (this.hasArchives() && options.archive && options.start && options.stop) {
            const archives = await this.panel.findDomainArchiveFiles(domain, options.start, options.stop);
            list.push(...archives);
          }
        }
      }
    }
    if (Array.isArray(options.files)) {
      for (const file of options.files) {
        const scans = await this.panel.findLogFile(file);
        list.push(...scans);
      }
    }
    if (Array.isArray(options.directories)) {
      for (const dir of options.directories) {
        const files = await this.panel.findLogFilesInDirectory(dir);
        list.push(...files);
      }
    }
    if (options.main && this.hasMainLog()) {
      const files = await this.panel.findMainLogFiles();
      list.push(...files);
      if (this.hasArchives() && options.archive && options.start && options.stop) {
        const archives = await this.panel.findMainArchiveFiles(options.start, options.stop);
        list.push(...archives);
      }
    }
    if (options.panel && this.hasPanelLog()) {
      const files = await this.panel.findPanelLogFiles();
      list.push(...files);
      if (this.hasArchives() && options.archive && options.start && options.stop) {
        const archives = await this.panel.findPanelArchiveFiles(options.start, options.stop);
        list.push(...archives);
      }
    }
    return list;
  }
};

// package.json
var package_default = {
  name: "alscan-js",
  version: "0.5.2",
  description: "An access log scanner.",
  homepage: "https://samplx.org/alscan/",
  type: "module",
  author: {
    name: "Jim Burlingame"
  },
  contributors: [
    {
      name: "Jim Burlingame",
      email: "jb@samplx.org"
    }
  ],
  maintainers: [
    {
      name: "Jim Burlingame",
      email: "jb@samplx.org"
    }
  ],
  main: "./bin/alscan-cli.js",
  repository: {
    type: "git",
    url: "git+https://github.com/samplx/alscan-js.git"
  },
  license: "Apache-2.0",
  bin: {
    alscan: "bin/alscan-cli.js",
    "alscan-js": "bin/alscan-cli.js"
  },
  preferGlobal: true,
  scripts: {
    build: "esbuild bin/alscan-cli.ts --bundle --platform=neutral --packages=external --target=node22.0 > bin/alscan-cli.js",
    test: "node --test"
  },
  directories: {
    lib: "./lib",
    bin: "./bin",
    test: "./__tests__"
  },
  dependencies: {
    "@commander-js/extra-typings": "^14.0.0",
    "@tsconfig/node22": "^22.0.2",
    "@tsconfig/strictest": "^2.0.5",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.15.30",
    commander: "^14.0.0",
    esbuild: "^0.25.9",
    "js-yaml": "4.1.0",
    "sort-on": "^6.1.0",
    typescript: "^5.9.2"
  },
  engines: {
    node: ">= 22.18"
  },
  devDependencies: {
    "@tsconfig/node-ts": "^23.6.1"
  },
  readmeFilename: "README.md",
  bugs: {
    url: "https://github.com/samplx/alscan-js/issues",
    email: "bugs@samplx.org"
  }
};

// lib/request.ts
var RequestReport = class extends Reporter {
  constructor() {
    super();
    this.id = "request";
  }
  /**
   *  Create Request report.
   *  @param ticks data to create report.
   */
  async report(ticks) {
    for (const tick of ticks) {
      if (tick.item) {
        this.output(tick.item);
      }
    }
  }
};

// lib/summary.ts
var SummaryReport = class extends Reporter {
  before;
  after;
  totals;
  slots;
  // terse report option
  terse;
  // used to separate fields in terse output
  fieldSep;
  keepOutside;
  constructor(terse = false, fieldSep = "|", keepOutside = true) {
    super();
    this.id = "summary";
    this.terse = terse;
    this.fieldSep = fieldSep;
    this.keepOutside = keepOutside;
    this.slots = [];
  }
  async report(ticks) {
    if (ticks.length === 0 || this.start === void 0 || this.stop === void 0 || this.slotWidth === void 0 || this.limit === void 0) {
      if (!this.terse) {
        this.output("No entires match search criteria.");
      }
      return;
    }
    const firstIndex = this.getFirstIndex(ticks);
    const lastIndex = this.getLastIndex(ticks);
    let nSlots;
    if (this.slotWidth == Infinity) {
      nSlots = 1;
    } else if (firstIndex < lastIndex) {
      const duration = (ticks[lastIndex].time - ticks[firstIndex].time) / 1e3;
      nSlots = Math.ceil(duration / this.slotWidth);
    } else if (firstIndex === lastIndex) {
      nSlots = 1;
    } else {
      nSlots = 0;
    }
    this.allocateSlots(nSlots, ticks, firstIndex, lastIndex);
    if (this.before) {
      this.totalReport("Before", this.before);
    }
    for (const slot of this.slots) {
      slot.scan();
      this.slotReport(slot);
    }
    if (this.after) {
      this.totalReport("After", this.after);
    }
    if (this.totals) {
      this.totalReport("Grand Totals", this.totals);
    }
  }
  /**
   *  Allocate slots for report.
   *  @param nSlots number of slots.
   *  @param ticks report data items.
   *  @firstIndex index of first tick in report.
   *  @lastIndex index of last tick in report.
   */
  allocateSlots(nSlots, ticks, firstIndex, lastIndex) {
    if (firstIndex !== 0) {
      let stopTime;
      if (firstIndex < ticks.length) {
        stopTime = ticks[firstIndex].time - 1;
      } else {
        stopTime = ticks[ticks.length - 1].time;
      }
      this.before = new TimeSlot(ticks, 0, firstIndex - 1, ticks[0].time, stopTime, this);
      this.before.totalScan();
    }
    if (lastIndex != ticks.length - 1) {
      this.after = new TimeSlot(
        ticks,
        lastIndex + 1,
        ticks.length - 1,
        ticks[lastIndex + 1].time,
        ticks[ticks.length - 1].time,
        this
      );
      this.after.totalScan();
    }
    if (this.start === void 0 || this.stop === void 0 || this.slotWidth === void 0) {
      return;
    }
    if (nSlots == 1) {
      this.slots.push(new TimeSlot(
        ticks,
        firstIndex,
        lastIndex,
        this.start.getTime(),
        this.stop.getTime(),
        this
      ));
    } else if (nSlots > 1) {
      this.totals = new TimeSlot(
        ticks,
        firstIndex,
        lastIndex,
        this.start.getTime(),
        this.stop.getTime(),
        this
      );
      this.totals.totalScan();
      const slotWidthMS = this.slotWidth * 1e3;
      var startTime = Math.floor(ticks[firstIndex].time / slotWidthMS) * slotWidthMS;
      var nextTime = startTime - 1e3;
      var first = firstIndex;
      var last = -1;
      var length = ticks.length;
      while (nextTime < this.stop.getTime()) {
        nextTime += slotWidthMS;
        for (var n = first; n < length; n++) {
          if (ticks[n].time >= nextTime) {
            break;
          }
          last = n;
        }
        if (last >= first) {
          const slot = new TimeSlot(ticks, first, last, startTime, nextTime, this);
          this.slots.push(slot);
          first = last + 1;
        }
        startTime = nextTime + 1e3;
      }
    }
  }
  /**
   *  Return the column header line of a verbose report.
   *  @param title of the section.
   */
  getColumnHeader(title) {
    return `Requests  Ave/sec Peak/sec  Bandwidth   Bytes/sec Peak Bytes ${title}`;
  }
  /**
   *  Return a single row of data for the verbose summary report.
   *  @param item of data.
   */
  getItemRow(item) {
    var row;
    var elapsed = Math.floor((item.last - item.first + 1e3) / 1e3);
    var perSecond = item.count / elapsed;
    row = this.padField(item.count.toString(), 8);
    row += this.padField(perSecond.toFixed(3), 9);
    row += this.padField(item.peakCount, 9) + " ";
    row += this.getBytesString(item.bandwidth) + " ";
    row += this.getBPS(item.bandwidth, elapsed) + " ";
    row += this.getBytesString(item.peakBandwidth) + " ";
    row += item.title;
    return row;
  }
  /**
   *  Return a single row of a terse report.
   *  @param item of data.
   *  @param sep String to separate fields.
   *  @param start time of row (milliseconds since Epoch).
   *  @param stop time of row (milliseconds since Epoch).
   */
  getTerseItemRow(item, sep2, start, stop) {
    var row = "";
    var elapsed = Math.floor((item.last - item.first + 1e3) / 1e3);
    var countPerSecond = item.count / elapsed;
    var bytesPerSecond = item.bandwidth / elapsed;
    row += this.getTimestamp(start) + sep2;
    row += Math.floor(start / 1e3).toString() + sep2;
    row += this.getTimestamp(item.first) + sep2;
    row += Math.floor(item.first / 1e3).toString() + sep2;
    row += this.getTimestamp(item.last) + sep2;
    row += Math.floor(item.last / 1e3).toString() + sep2;
    row += this.getTimestamp(stop) + sep2;
    row += Math.floor(stop / 1e3).toString() + sep2;
    row += item.count.toString() + sep2;
    row += countPerSecond.toString() + sep2;
    row += item.peakCount.toString() + sep2;
    row += item.bandwidth.toString() + sep2;
    row += bytesPerSecond.toString() + sep2;
    row += item.peakBandwidth.toString() + sep2;
    row += item.title;
    return row;
  }
  /**
   *  Return index of first tick after start.
   *  @param ticks data for report.
   */
  getFirstIndex(ticks) {
    if (this.keepOutside && this.start) {
      for (let n = 0; n < ticks.length; n++) {
        if (ticks[n].time >= this.start.getTime()) {
          return n;
        }
      }
      return ticks.length;
    } else {
      return 0;
    }
  }
  /**
   *  Return index of last tick before stop.
   *  @param ticks report data.
   */
  getLastIndex(ticks) {
    if (this.keepOutside && this.stop) {
      let last = -1;
      for (let n = 0; n < ticks.length; n++) {
        if (ticks[n].time > this.stop.getTime()) {
          break;
        }
        last = n;
      }
      return last;
    } else {
      return ticks.length - 1;
    }
  }
  /**
   *  Write the total section of a terse report.
   *  @param title String.
   *  @param slot total summary data.
   */
  terseTotalReport(title, slot) {
    const total = slot.getTotals();
    if (total) {
      total.title = title;
      const row = this.getTerseItemRow(total, this.fieldSep, slot.startTime, slot.stopTime);
      this.output(row);
    }
  }
  /**
   *  Write out the total section of a verbose report.
   *  @param title String.
   *  @param slot of total summary data.
   */
  verboseTotalReport(title, slot) {
    const total = slot.getTotals();
    if (total) {
      this.output(this.getTimestampHeader(slot.startTime, slot.firstTime, slot.lastTime, slot.stopTime, ""));
      this.output(this.getColumnHeader(title));
      total.title = "";
      const row = this.getItemRow(total);
      this.output(row);
    }
  }
  /**
   *  Report on a total.
   *  @param title String.
   *  @param total slot data.
   */
  totalReport(title, total) {
    if (this.terse) {
      this.terseTotalReport(title, total);
    } else {
      this.verboseTotalReport(title, total);
    }
  }
  /**
   *  Single slot report section in terse format.
   *  @param slot data.
   */
  terseSlotReport(slot) {
    let length = slot.nItems();
    if (this.limit && this.limit < length) {
      length = this.limit;
    }
    for (let n = 0; n < length; n++) {
      const row = this.getTerseItemRow(slot.getItem(n), this.fieldSep, slot.startTime, slot.stopTime);
      this.output(row);
    }
    const total = slot.getTotals();
    if (total) {
      total.title = "Totals";
      const row = this.getTerseItemRow(total, this.fieldSep, slot.startTime, slot.stopTime);
      this.output(row);
    }
  }
  /**
   *  Single slot report section in verbose format.
   *  @param slot data.
   */
  verboseSlotReport(slot) {
    const title = Reporter.categoryLookup[this.category ?? "undefined"];
    this.output(this.getTimestampHeader(slot.startTime, slot.firstTime, slot.lastTime, slot.stopTime, "Slot"));
    this.output(this.getColumnHeader(title ?? ""));
    let length = slot.nItems();
    if (this.limit && this.limit < length) {
      length = this.limit;
    }
    for (let n = 0; n < length; n++) {
      const row = this.getItemRow(slot.getItem(n));
      this.output(row);
    }
    if (length != 1) {
      const total = slot.getTotals();
      if (total) {
        total.title = "Totals";
        const row = this.getItemRow(total);
        this.output(row);
      }
    }
    this.output("");
  }
  /**
   *  Generate a report section on a single slot.
   *  @param slot data.
   */
  slotReport(slot) {
    if (this.terse) {
      this.terseSlotReport(slot);
    } else {
      this.verboseSlotReport(slot);
    }
  }
};

// lib/alscan.ts
function getGetItem(options, category) {
  if (!!options["deny"]) {
    return (record, _domain) => record.host;
  }
  if (!!options["downtime"]) {
    return (_record) => void 0;
  }
  if (!!options["request"]) {
    return (record) => record.line;
  }
  if (category === "groups") {
    return (record, _domain) => record.group;
  }
  if (category === "sources") {
    return (record, _domain) => record.source;
  }
  if (category === "agents") {
    return (record, _domain) => record.agent;
  }
  if (category === "urls") {
    return (record, _domain) => record.uri;
  }
  if (category === "codes" || category === void 0) {
    return (record, _domain) => record.status;
  }
  if (category === "referers") {
    return (record, _domain) => record.referer;
  }
  if (category === "domains") {
    return (_record, domain) => domain;
  }
  if (category === "methods") {
    return (record, _domain) => record.method;
  }
  if (category === "requests") {
    return (record, _domain) => record.request;
  }
  if (category === "protocols") {
    return (record, _domain) => record.protocol;
  }
  if (category === "users") {
    return (record, _domain) => record.user;
  }
  if (category === "ips") {
    return (record, _domain) => record.host;
  }
  throw new Error(`Unrecognized category: ${category}`);
}
function reporterFactory(alscanOptions, options) {
  let reporter;
  if (!!options["deny"]) {
    reporter = new DenyReport();
  } else if (!!options["downtime"]) {
    reporter = new DowntimeReport();
  } else if (!!options["request"]) {
    reporter = new RequestReport();
  } else {
    const summaryReport = new SummaryReport();
    reporter = summaryReport;
    if (typeof options["fs"] === "string") {
      summaryReport.fieldSep = options["fs"];
    }
    summaryReport.keepOutside = !!alscanOptions.keepOutside;
    summaryReport.terse = !!options["terse"];
  }
  reporter.category = alscanOptions.category;
  if (typeof options["top"] === "number") {
    reporter.limit = options["top"];
  }
  if (typeof options["sort"] === "string") {
    reporter.order = options["sort"];
  }
  reporter.slotWidth = alscanOptions.timeSlot;
  reporter.start = alscanOptions.start;
  reporter.stop = alscanOptions.stop;
  return reporter;
}
function setupRecognizer(options) {
  if (Array.isArray(options["userAgent"])) {
    for (const value of options["userAgent"]) {
      addValue("agent", value);
    }
  }
  if (Array.isArray(options["matchUserAgent"])) {
    for (const value of options["matchUserAgent"]) {
      addPattern("agent", value);
    }
  }
  if (Array.isArray(options["code"])) {
    for (const value of options["code"]) {
      addValue("status", value);
    }
  }
  if (Array.isArray(options["ip"])) {
    for (const value of options["ip"]) {
      addIP(value);
    }
  }
  if (Array.isArray(options["method"])) {
    for (const value of options["method"]) {
      addValueNC("method", value);
    }
  }
  if (Array.isArray(options["referer"])) {
    for (const value of options["referer"]) {
      addValue("referer", value);
    }
  }
  if (Array.isArray(options["matchReferer"])) {
    for (const value of options["matchReferer"]) {
      addPattern("referer", value);
    }
  }
  if (Array.isArray(options["url"])) {
    for (const value of options["url"]) {
      addValue("uri", value);
    }
  }
  if (Array.isArray(options["matchUrl"])) {
    for (const value of options["matchUrl"]) {
      addPattern("uri", value);
    }
  }
  if (Array.isArray(options["group"])) {
    for (const value of options["group"]) {
      addValueNC("group", value);
    }
  }
  if (Array.isArray(options["source"])) {
    for (const value of options["source"]) {
      addValueNC("source", value);
    }
  }
}
function scanStream(baseStream, isCompressed, domain, start, stop, keepOutside, getItem) {
  const entry = new AccessLogEntry();
  const ticks = [];
  const inputStream = new LineStream({});
  return new Promise((resolve, reject) => {
    inputStream.on("data", function(chunk) {
      entry.parse(chunk);
      if (matches(entry) && entry.time) {
        if (entry.time <= stop && entry.time >= start) {
          ticks.push(new Tick(entry.time, entry.size, getItem(entry, domain)));
        } else if (keepOutside) {
          ticks.push(new Tick(entry.time, entry.size, void 0));
        }
      }
    });
    inputStream.on("end", function() {
      resolve(ticks);
    });
    inputStream.on("error", function(err) {
      reject(err);
    });
    if (isCompressed) {
      baseStream.pipe(createGunzip()).pipe(inputStream);
    } else {
      baseStream.pipe(inputStream);
    }
  });
}
async function scanFile(file, start, stop, keepOutside, getItem) {
  const baseStream = fs5.createReadStream(file.pathname);
  return await scanStream(
    baseStream,
    file.isCompressed(),
    file.domain ?? "",
    start.getTime(),
    stop.getTime(),
    keepOutside,
    getItem
  );
}
async function scanFiles(files, start, stop, keepOutside, getItem, verbose) {
  const ticks = [];
  let width = 10;
  for (const file of files) {
    if (width < file.filename.length) {
      width = file.filename.length;
    }
  }
  width += 2;
  if (verbose) {
    console.log(`  filename${" ".repeat(width - 8)}    count`);
    console.log(`${"-".repeat(width)}   --------`);
  }
  for (const file of files) {
    const each = await scanFile(file, start, stop, keepOutside, getItem);
    if (verbose) {
      let line;
      const spaces = " ".repeat(width - file.filename.length);
      line = `> ${file.filename}${spaces} ${each.length.toString().padStart(8)}`;
      console.log(line);
    }
    ticks.push(...each);
  }
  if (verbose) {
    console.log("\n".repeat(5));
  }
  return sortOn2(ticks, "time");
}
function determineCategory(options) {
  if (typeof options["category"] === "string") {
    return options["category"];
  }
  if (!!options["agents"]) {
    return "agents";
  }
  if (!!options["codes"]) {
    return "codes";
  }
  if (!!options["domains"]) {
    return "domains";
  }
  if (!!options["groups"]) {
    return "groups";
  }
  if (!!options["ips"]) {
    return "ips";
  }
  if (!!options["methods"]) {
    return "methods";
  }
  if (!!options["protocols"]) {
    return "protocols";
  }
  if (!!options["requests"]) {
    return "requests";
  }
  if (!!options["sources"]) {
    return "sources";
  }
  if (!!options["urls"]) {
    return "urls";
  }
  if (!!options["users"]) {
    return "users";
  }
  return "codes";
}
var fullCategoryList = [
  "agents",
  "category",
  "codes",
  "domains",
  "groups",
  "ips",
  "methods",
  "protocols",
  "requests",
  "sources",
  "urls",
  "users"
];
function categoryList(hasDomains) {
  if (hasDomains) {
    return fullCategoryList.filter((n) => n != "category");
  }
  return fullCategoryList.filter((n) => n != "category" && n != "domains");
}
function otherCategories(me) {
  return fullCategoryList.filter((n) => n != me);
}
var fullTimeSlotList = [
  "days",
  "hours",
  "minutes",
  "one",
  "timeSlot"
];
function otherTimeSlots(me) {
  return fullTimeSlotList.filter((n) => n != me);
}
var fullReportList = [
  "deny",
  "downtime",
  "request",
  "terse"
];
function otherReports(me) {
  return fullReportList.filter((n) => n != me);
}
function collectValues(value, previous) {
  return previous.concat([value]);
}
function collectIPValues(value, previous) {
  const hostMatch = Recognizer.ipv4maskPattern.exec(value);
  if (hostMatch === null) {
    throw new InvalidArgumentError(`${value} is not in IP xxx.xxx.xxx.xxx/nn format`);
  }
  return previous.concat([value]);
}
function parseTimeSlot(value, _previous) {
  const n = parseInt(value);
  if (isNaN(n) || n < 1) {
    throw new InvalidArgumentError(`value must be a positive integer (Seconds)`);
  }
  return n;
}
function parseTop(value, _previous) {
  const n = parseInt(value);
  if (isNaN(n) || n < 1) {
    throw new InvalidArgumentError(`value must be a positive integer`);
  }
  return n;
}
function validateTime(value, _dummyPrevious) {
  if (value == "reboot" || PartialDate.isValidFormat(value)) {
    return value;
  }
  throw new InvalidArgumentError(`${value} is not a valid date-time.`);
}
function cliOptions(hasDomains) {
  return {
    // General Options
    verbose: new Option("--verbose", "Increase information provided").conflicts("quiet"),
    quiet: new Option("--quiet", "Do not provide progress information").conflicts("verbose"),
    // Category Options
    agents: new Option("--agents", "User-agent strings").conflicts(otherCategories("agents")),
    category: new Option("--category <name>", "select category").choices(categoryList(hasDomains)).conflicts(otherCategories("category")),
    codes: new Option("--codes", "HTTP result code").conflicts(otherCategories("codes")),
    domains: new Option("--domains", "domains").conflicts(otherCategories("domains")),
    groups: new Option("--groups", "(deprecated) User-agent groups").conflicts(otherCategories("groups")),
    ips: new Option("--ips", "IP address").conflicts(otherCategories("ips")),
    methods: new Option("--methods", "HTTP method").conflicts(otherCategories("methods")),
    protocols: new Option("--protocols", "Protocol used").conflicts(otherCategories("protocols")),
    referers: new Option("--referers", "Referer").conflicts(otherCategories("referer")),
    requests: new Option("--requests", "Request line").conflicts(otherCategories("requests")),
    sources: new Option("--sources", "(deprecated) User-agent sources").conflicts(otherCategories("sources")),
    urls: new Option("--uris, --urls", "URI").conflicts(otherCategories("urls")),
    users: new Option("--users", "Authenticated users").conflicts(otherCategories("users")),
    // Time Options
    days: new Option("--days", "24 hour time slots").conflicts(otherTimeSlots("days")),
    hours: new Option("--hours", "sixty minute time slots").conflicts(otherTimeSlots("hours")),
    minutes: new Option("--minutes", "sixty second time slots").conflicts(otherTimeSlots("minutes")),
    one: new Option("-1, --one", "only a single time slot").conflicts([...otherTimeSlots("one"), "outside"]),
    outside: new Option("--outside", "include data for before and after time slots").conflicts("one"),
    reboot: new Option("--reboot", "same as --start=reboot").conflicts("start"),
    start: new Option("--start <date-time>", "define when to start the report").argParser(validateTime).conflicts("reboot"),
    stop: new Option("--stop <date-time>", "define when to end the report").argParser(validateTime),
    timeSlot: new Option("--time-slot <seconds>", "arbitrary number of seconds time slots").conflicts(otherTimeSlots("timeSlot")).argParser(parseTimeSlot).default(3600),
    // Report Format Options
    deny: new Option("--deny", "report is a list of deny directives").conflicts(otherReports("deny")),
    downtime: new Option("--downtime", "enable downtime report").conflicts(otherReports("downtime")),
    fieldSep: new Option("-F, --fs <sep>", "define the field separator for a terse report").implies({ terse: true }).default("|"),
    request: new Option("--request", "grep-like match of requests").conflicts(otherReports("request")),
    sort: new Option("--sort <by>", "how to sort records").choices([
      "bandwidth",
      "count",
      "item",
      "peak-bandwidth",
      "title"
    ]).default("count"),
    terse: new Option("-t, --terse", "computer friendly single-line per record format").conflicts(otherReports("terse")),
    top: new Option("--top <number>", "Maximum number of items to report").argParser(parseTop).default(Infinity),
    // Search Options
    agent: new Option("--agent, --user-agent <name>", "Match exact user-agent string").argParser(collectValues).default([], "none"),
    code: new Option("--code <value>", "Match HTTP status code").argParser(collectValues).default([], "none"),
    group: new Option("--group <name>", "(deprecated) Match User-agent group name").argParser(collectValues).default([], "none"),
    ip: new Option("--ip <addr>", "Match request IP address").argParser(collectIPValues).default([], "none"),
    matchAgent: new Option("--match-agent, --match-user-agent <regexp>", "Match user-agent regular expression").argParser(collectValues).default([], "none"),
    matchReferer: new Option("--match-referrer, --match-referer <regexp>", "Match referer regular expression").argParser(collectValues).default([], "none"),
    matchUrl: new Option("--match-uri, --match-url <regexp>", "Match URL regular expression").argParser(collectValues).default([], "none"),
    method: new Option("--method <name>", "Match request method name").argParser(collectValues).default([], "none"),
    referer: new Option("--referer <referer>", "Match exact referer string").argParser(collectValues).default([], "none"),
    source: new Option("--source <name>", "(deprecated) Match User-agent source name").argParser(collectValues).default([], "none"),
    url: new Option("--uri, --url <url>", "Match exact URL string").argParser(collectValues).default([], "none"),
    // Log Selection Options
    account: new Option("--account <name>", "Scan logs for named account").argParser(collectValues).default([], "none"),
    alllogs: new Option("--alllogs", "Scan all known access logs (vhosts, main, panel)"),
    archive: new Option("--archive", "Include archived logs"),
    directory: new Option("--dir, --directory <name>", "Scan access logs in directory").argParser(collectValues).default([]),
    domain: new Option("--domain <name>", "Scan log of named domain").argParser(collectValues).default([], "none"),
    domlogs: new Option("--vhosts, --domlogs", "Scan all vhost access logs"),
    file: new Option("--file <name>", "Scan log file").argParser(collectValues).default([], "none"),
    main: new Option("--main", "Scan default (no vhost) access log"),
    panel: new Option("--panel", "Scan panel access log"),
    // Feedback (deprecated) Options
    feedbackType: new Option("--feedback-type <name>", "(deprecated) ignored option").hideHelp(),
    feedbackUrl: new Option("--feedback-url <url>", "(deprecated) ignored option").hideHelp()
  };
}
var defaultPanels = new Panels();
function createParser(panels = defaultPanels) {
  const options = cliOptions(panels.hasDomains());
  if (!panels.hasAccounts()) {
    options.account.hidden = true;
  }
  if (!panels.hasArchives()) {
    options.archive.hidden = true;
  }
  if (!panels.hasDomains()) {
    options.domain.hidden = true;
    options.domains.hidden = true;
  }
  if (!panels.hasMainLog()) {
    options.main.hidden = true;
    options.domlogs.hidden = true;
    options.alllogs.hidden = true;
  }
  if (!panels.hasPanelLog()) {
    options.panel.hidden = true;
  }
  const cli = new Command().description(`alscan - ${package_default.description}`).optionsGroup("General Options").helpOption("-h, --help").version(package_default.version).addOption(options.quiet).addOption(options.verbose).optionsGroup("Report Category Options").addOption(options.category).addOption(options.groups).addOption(options.sources).addOption(options.agents).addOption(options.urls).addOption(options.codes).addOption(options.referers).addOption(options.domains).addOption(options.methods).addOption(options.requests).addOption(options.protocols).addOption(options.users).addOption(options.ips).optionsGroup("Time Options").addOption(options.reboot).addOption(options.start).addOption(options.stop).optionsGroup("Time Slot Options").addOption(options.timeSlot).addOption(options.minutes).addOption(options.hours).addOption(options.days).addOption(options.one).optionsGroup("Access Log Options").addOption(options.file).addOption(options.directory).addOption(options.account).addOption(options.archive).addOption(options.domain).addOption(options.domlogs).addOption(options.main).addOption(options.panel).addOption(options.alllogs).optionsGroup("Report Format Options").addOption(options.deny).addOption(options.downtime).addOption(options.request).addOption(options.terse).addOption(options.fieldSep).addOption(options.sort).addOption(options.top).addOption(options.outside).optionsGroup("Search Options").addOption(options.agent).addOption(options.matchAgent).addOption(options.code).addOption(options.ip).addOption(options.method).addOption(options.referer).addOption(options.matchReferer).addOption(options.url).addOption(options.matchUrl).addOption(options.group).addOption(options.source).argument("[name...]", "optional list of files to scan").addHelpText("afterAll", `

For more information, please visit:
    ${package_default.homepage}

To report problems, use:
    ${package_default.bugs.url}
`);
  return cli;
}
async function gatherAlscanOptions(names, options, panels = defaultPanels) {
  const panelOptions = {
    alllogs: panels.hasMainLog() && !!options["alllogs"],
    archive: panels.hasArchives() && !!options["archive"],
    domlogs: panels.hasMainLog() && !!options["domlogs"],
    files: names,
    keepOutside: !!options["outside"],
    main: panels.hasMainLog() && !!options["main"],
    panel: panels.hasPanelLog() && !!options["panel"]
  };
  if (panels.hasAccounts() && "account" in options && Array.isArray(options["account"])) {
    panelOptions.accounts = options["account"];
  }
  if ("directory" in options && Array.isArray(options["directory"])) {
    panelOptions.directories = options["directory"];
  }
  if (panels.hasDomains() && "domain" in options && Array.isArray(options["domain"])) {
    panelOptions.domains = options["domain"];
  }
  if ("file" in options && Array.isArray(options["file"])) {
    if (!panelOptions.files) {
      panelOptions.files = [];
    }
    panelOptions.files.push(...options["file"]);
  }
  let partialStart = new PartialDate();
  if (!!options["reboot"]) {
    partialStart = await lastReboot();
  } else if (typeof options["start"] === "string") {
    const setting = options["start"];
    if (setting === "reboot") {
      partialStart = await lastReboot();
    } else {
      partialStart.parse(options["start"], true);
    }
  }
  let partialStop = new PartialDate();
  if (typeof options["stop"] === "string") {
    partialStop.parse(options["stop"], false);
  }
  if (!!options["one"]) {
    panelOptions.timeSlot = Infinity;
  } else if (!!options["days"]) {
    panelOptions.timeSlot = 24 * 60 * 60;
  } else if (!!options["hours"]) {
    panelOptions.timeSlot = 60 * 60;
  } else if (!!options["minutes"]) {
    panelOptions.timeSlot = 60;
  } else if (!!options["downtime"]) {
    panelOptions.timeSlot = 60;
  } else if (typeof options["timeSlot"] === "number") {
    panelOptions.timeSlot = options["timeSlot"];
  }
  const sse = calculateStartStop(partialStart, partialStop, panelOptions.timeSlot ?? 3600);
  if (sse.errors.length > 0) {
    for (const err of sse.errors) {
      console.error(err.message);
    }
    panelOptions.error = true;
  }
  panelOptions.start = sse.start;
  panelOptions.stop = sse.stop;
  panelOptions.category = determineCategory(options);
  return panelOptions;
}
async function run(names, options, _command) {
  const alscanOptions = await gatherAlscanOptions(names, options);
  if (!!alscanOptions.error || !alscanOptions.start || !alscanOptions.stop) {
    console.error(`Sorry, unable to continue.`);
    return;
  }
  setupRecognizer(options);
  const files = await defaultPanels.findScanFiles(alscanOptions);
  if (files.length === 0) {
    console.error(`No files to scan.`);
    return;
  }
  if (!options["quiet"]) {
    console.log(`Total number of files to scan: ${files.length}`);
  }
  const getItem = getGetItem(options, alscanOptions.category);
  const reporter = reporterFactory(alscanOptions, options);
  const verbose = !!options["verbose"];
  const ticks = await scanFiles(
    files,
    alscanOptions.start,
    alscanOptions.stop,
    !!alscanOptions.keepOutside,
    getItem,
    verbose
  );
  await reporter.report(ticks);
}
async function main() {
  await defaultPanels.load();
  const cli = createParser().action(run);
  await cli.parseAsync();
  return 0;
}
if (process3.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const exitCode = await main();
    process3.exit(exitCode);
  } catch (e) {
    console.error(`Exception: ${e}`);
    process3.exit(86);
  }
}

// bin/alscan-cli.ts
await main();
