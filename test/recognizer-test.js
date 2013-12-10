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
var buster = require("buster");
var assert = buster.assert;
var refute = buster.refute;
var util = require("util");

var recognizer = require("../lib/recognizer.js");

buster.testCase("recognizer", {
    setUp: function () {
        this.r = recognizer;
        this.r.clear();
        
        this.record = {
            host : '174.202.255.23',
            ident : '-',
            user : '-',
            timestamp: '09/06/2012:11:53:32 -0000',
            time: 1346932412000,
            request: 'POST /login/?login_only=1 HTTP/1.1',
            method: 'POST',
            uri: '/login/?login_only=1',
            protocol: 'HTTP/1.1',
            status: '200',
            size: 1024,
            referer: 'https://174.122.54.92:2087/',
            agent: 'Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2'
        };
    },
    
    "test empty recognizer": function () {
        assert(this.r.matches(this.record));
    },
    
    "test matches method=POST": function () {
        this.r.addValueNC('method', 'post');
        
        assert(this.r.matches(this.record));
    },
    
    "test matches method=GET": function () {
        this.r.addValueNC('method', 'get');
        
        refute(this.r.matches(this.record));
    },
    
    "test matches method=GET|POST": function () {
        this.r.addValueNC('method', 'GET');
        this.r.addValueNC('method', 'POST');
        
        assert(this.r.matches(this.record));
    },
    
    "test matches uri pattern /login.*": function () {
        this.r.addPattern('uri', '/login.*');
        
        assert(this.r.matches(this.record));
    },
    
    "test matches IP 10.0.0.0/8": function () {
        this.r.addIP('10.0.0.0/8');
        
        refute(this.r.matches(this.record));
    },
    
    "test matches IP 174.202.255.23": function () {
        this.r.addIP('174.202.255.23');
        
        assert(this.r.matches(this.record));
    },
    
    "test matches IP samplx.org": function () {
        this.record.host = "samplx.org";
        this.r.addIP('174.202.255.23');
        
        refute(this.r.matches(this.record));
    },
    
    "test matches IP 174.202.255.0/24": function () {
        this.r.addIP('174.202.255.0/24');
        
        assert(this.r.matches(this.record));
    },
    
    "test matches IP 174.202.255.0/32": function () {
        this.r.addIP('174.202.255.0/32');
        
        refute(this.r.matches(this.record));
    },
    
    "test matches IP and method=POST": function () {
        this.r.addIP('174.202.255.0/24');
        this.r.addValue('method', 'POST');
        
        assert(this.r.matches(this.record));
    },
    
});

