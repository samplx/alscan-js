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
var util = require("util");

// indicate AND of all operands
var AND_OP = 'and';
// indicate OR of all operands
var OR_OP = 'or';

// field recognizer constructor
// field is the name of the field to match.
// value is defined if an exact match is desired.
// pattern is defined if a RegExp pattern match is used.
// op is either AND_OP or OR_OP to create a collection of recognizers.
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
        throw new ValueError("Either func or op must be defined.");
    }
    return this;
}

// return true if this is a collection of recognizers.
Recognizer.prototype.isCollection = function() {
    return (this.op !== undefined);
}

Recognizer.prototype.addItem = function (field, item) {
    if (!this.isCollection()) {
        throw new ValueError("Cannot add to a non-collection recognizer.");
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
}

Recognizer.prototype.matches = function(record) {
    if (this.isCollection()) {
        if (this.op == AND_OP) {
            for (var n=0, length= this.operands.length; n < length; n++) {
                if (!this.operands[n].matches(record)) {
                    return false;
                }
            }
            return true;
        }
        if (this.op == OR_OP) {
            for (var n=0, length= this.operands.length; n < length; n++) {
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
}

var ipv4Pattern = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/);
var ipv4maskPattern = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?/);

function ipMatch(host, addressMask) {
//    console.log('ipMatch(host='+host+', addressMask='+addressMask+')');
    var hostMatch = ipv4Pattern.exec(host);
    if (hostMatch == null) {
//        console.log('hostMatch is null');
        return host == addressMask;       // only match numeric IPv4 (for now)
    }
    var addressMatch = ipv4maskPattern.exec(addressMask);
    if ((addressMatch == null) || (addressMatch[5] == undefined)) {
//        console.log('addressMatch is null');
        return host == addressMask;
    }
    var bits = parseInt(addressMatch[6], 10);
    if (Number.isNaN(bits) || (bits <= 0) || (bits >= 32)) {
//        console.log('bits is out of range');
        return host == addressMask;
    }
    var mask = 0;
    for (var n=32; n > bits; n--) {
        mask = (mask << 1) + 1;
//        console.log('n='+n+', mask='+mask.toString(16));
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
//    console.log("hostIP = 0x" + hostIP.toString(16));
//    console.log("address= 0x" + address.toString(16));
//    console.log("mask   = 0x" + mask.toString(16));
    return ((hostIP & mask) == (address & mask));
}

// singleton recognizer is an "and" collection.
var recognizer = new Recognizer(undefined, undefined, AND_OP);

module.exports = {
    // add an exact value match recognizer
    addValue : function (field, value) {
        var item = new Recognizer(field, function(v) { return (v == value); });
        recognizer.addItem(field, item);
    },
    
    // add a pattern match recognizer
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
    
    // add an IP recognizer
    addIP : function (addressMask) {
        var item = new Recognizer('host', function(v) { return ipMatch(v, addressMask); });
        recognizer.addItem('host', item);
    },
    
    // test if the input record matches.
    matches : function (record) {
        return recognizer.matches(record);
    },
    
    // return contents of recognizer as a string. (for debugging)
    dump : function () {
        return util.inspect(recognizer, { depth: null });
    },
    
    // clear the contents of the recognizer (for testing.)
    clear : function () {
        recognizer = new Recognizer(undefined, undefined, AND_OP);
    }
};

