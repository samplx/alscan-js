#!/usr/bin/env node
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014 James Burlingame
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
var util = require("util");

// indicate AND of all operands
var AND_OP = 'and';
// indicate OR of all operands
var OR_OP = 'or';

/**
 *  @ctor Recognizer constructor.
 *  @param field is the name of the field to match.
 *  @param func callback returns true on a match.
 *  @param op is either AND_OP or OR_OP to create a collection of recognizers.
 */
function Recognizer(field, func, op) {
    if (!(this instanceof Recognizer)) {
        return new Recognizer(field, func, op);
    }
    
    this.field = field;
    if (op) {
        this.op = op;
        this.operands = [];
    } else if (func) {
        this.func = func;
    } else {
        throw new TypeError("Either func or op must be defined.");
    }
    return this;
}

/** 
 *  Determine if this is a collection.
 *  @rtype Boolean. true if this is a collection of recognizers.
 */
Recognizer.prototype.isCollection = function() {
    return (this.op !== undefined);
};

/**
 *  Add criteria to this Recognizer.
 *  @param field to check.
 *  @param item.
 */
Recognizer.prototype.addItem = function (field, item) {
    if (!this.isCollection()) {
        throw new TypeError("Cannot add to a non-collection recognizer.");
    }
    
    for (var n=0, length= this.operands.length; n < length; n++) {
        if (this.operands[n].field == field) {
            if (!this.operands[n].isCollection()) {
                var old = this.operands[n];
                this.operands[n] = new Recognizer(field, undefined, OR_OP);
                this.operands[n].operands.push(old);
            }
            this.operands[n].operands.push(item);
            return;
        }
    }
    this.operands.push(item);
};

/**
 *  Determine if the record matches this Recognizer.
 *  @param record access log data.
 *  @rtype Boolean. true on a match.
 */
Recognizer.prototype.matches = function(record) {
    var n, length;
    if (this.isCollection()) {
        if (this.op == AND_OP) {
            for (n=0, length= this.operands.length; n < length; n++) {
                if (!this.operands[n].matches(record)) {
                    return false;
                }
            }
            return true;
        }
        if (this.op == OR_OP) {
            for (n=0, length= this.operands.length; n < length; n++) {
                if (this.operands[n].matches(record)) {
                    return true;
                }
            }
            return false;
        }
    } else if (this.func) {
        return this.func(record[this.field]);
    }
    return false;
};

/** Regular expression of an IPv4 dotted decimal address. */
var ipv4Pattern = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/);
/** Regular expression of an IPv4 dotted decimal address with CIDR mask. */
var ipv4maskPattern = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?/);

function ipMatch(host, addressMask) {
    var hostMatch = ipv4Pattern.exec(host);
    if (hostMatch === null) {
        return host == addressMask;       // only match numeric IPv4 (for now)
    }
    var addressMatch = ipv4maskPattern.exec(addressMask);
    if ((addressMatch === null) || (addressMatch[5] === undefined)) {
        return host == addressMask;
    }
    var bits = parseInt(addressMatch[6], 10);
    if (Number.isNaN(bits) || (bits <= 0) || (bits >= 32)) {
        return host == addressMask;
    }
    var mask = 0;
    for (var n=32; n > bits; n--) {
        mask = (mask << 1) + 1;
    }
    mask = ~mask;
    var hostIP = (parseInt(hostMatch[1], 10) * 16777216) +
                 (parseInt(hostMatch[2], 10) * 65536) +
                 (parseInt(hostMatch[3], 10) * 256) +
                  parseInt(hostMatch[4], 10);
    var address= (parseInt(addressMatch[1], 10) * 16777216) +
                 (parseInt(addressMatch[2], 10) * 65536) +
                 (parseInt(addressMatch[3], 10) * 256) +
                  parseInt(addressMatch[4], 10);
    return ((hostIP & mask) == (address & mask));
}

/** singleton recognizer is an "and" collection. */
var recognizer = new Recognizer(undefined, undefined, AND_OP);

module.exports = {
    /**
     *  Add an exact value match recognizer.
     *  @param field to match.
     *  @param value to match.
     */
    addValue : function (field, value) {
        var item = new Recognizer(field, function(v) { return (v == value); });
        recognizer.addItem(field, item);
    },
    
    /**
     *  Add an ignore case value match recognizer.
     *  @param field to match.
     *  @param value to match.
     */
    addValueNC : function (field, value) {
        var lcValue = value.toString().toLowerCase();
        var item = new Recognizer(field, function(v) { return (v.toLowerCase() == lcValue); });
        recognizer.addItem(field, item);
    },
    
    /**
     *  Add a pattern match recognizer.
     *  @param field to match.
     *  @param pattern RegExp to match.
     */
    addPattern : function (field, pattern) {
        var item;
        if (pattern instanceof RegExp) {
            item = new Recognizer(field, function(v) { return pattern.test(v); });
        } else {
            var re = new RegExp(pattern);
            item = new Recognizer(field, function(v) { return re.test(v); });
        }
        recognizer.addItem(field, item);
    },
    
    /**
     *  Add an IP recognizer.
     *  @param addressMask dotted decimal address with optional mask.
     */
    addIP : function (addressMask) {
        var item = new Recognizer('host', function(v) { return ipMatch(v, addressMask); });
        recognizer.addItem('host', item);
    },
    
    /**
     *  Test if the input record matches.
     *  @param record access log data to check.
     *  @rtype Boolean. true on a match.
     */
    matches : function (record) {
        return recognizer.matches(record);
    },
    
    /**
     *  Return contents of recognizer as a string.
     *  Used for debugging.
     */
    dump : function () {
        return util.inspect(recognizer, { depth: null });
    },
    
    /**
     *  Clear the contents of the recognizer.
     *  Used for testing.
     */
    clear : function () {
        recognizer = new Recognizer(undefined, undefined, AND_OP);
    }
};

