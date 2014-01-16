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

var util = require("util");
var Transform = require("stream").Transform;
util.inherits(LineStream, Transform);

// new-line
var NL = 10;

/**
 *  @ctor LineStream constructor.
 *  @param options for Stream.
 */
function LineStream(options) {
    if (!(this instanceof LineStream)) {
        return new LineStream(options);
    }
    
    Transform.call(this, options);
    this._buffer = '';
}

/**
 *  Stream filter standard function.
 *  @param chunk block of data to translate.
 *  @param encoding of the stream.
 *  @param done callback.
 */
LineStream.prototype._transform = function(chunk, encoding, done) {
    var first = 0;
    for (var n=0; n < chunk.length; n++) {
        if (chunk[n] == NL) {
            var segment;
            if (first === 0) {
                segment = this._buffer + chunk.slice(0, n+1);
                this._buffer = '';
            } else {
                segment = chunk.slice(first, n+1);
            }
            this.push(segment);
            first = n+1;
        }
    }
    if (first < chunk.length) {
        this._buffer += chunk.slice(first);
    } 
    done();
};

/**
 *  Stream filter standard _flush function.
 *  @param done callback.
 */
LineStream.prototype._flush = function(done) {
    if (this._buffer.length > 0) {
        this.push(this._buffer);
    }
    done();
};

exports.LineStream = LineStream;

