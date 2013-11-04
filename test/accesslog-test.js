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

var accesslog = require("../lib/accesslog.js");

buster.testCase("accesslog", {
    setUp: function () {
        this.a = new accesslog.AccessLogEntry();
    },
    
    "test constructor": function () {
        refute.defined(this.a.line);
        refute.defined(this.a.host);
        refute.defined(this.a.ident);
        refute.defined(this.a.user);
        refute.defined(this.a.timestamp);
        refute.defined(this.a.time);
        refute.defined(this.a.request);
        refute.defined(this.a.method);
        refute.defined(this.a.uri);
        refute.defined(this.a.protocol);
        refute.defined(this.a.status);
        refute.defined(this.a.size);
        refute.defined(this.a.referer);
        refute.defined(this.a.agent);
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse(combined, size='-')": function () {
        var line = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 304 - "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"';
        this.a.parse(line);
        
        assert.defined(this.a.line);
        assert.equals(this.a.line, line);
        assert.defined(this.a.host);
        assert.equals(this.a.host, '180.76.6.26');
        assert.defined(this.a.ident);
        assert.equals(this.a.ident, '-');
        assert.defined(this.a.user);
        assert.equals(this.a.user, '-');
        assert.defined(this.a.timestamp);
        assert.equals(this.a.timestamp, '30/Nov/2012:06:17:35 -0600');
        var time = new Date(Date.UTC(2012, 10, 30, 6, 17, 35, 0));
        time.setTime(time.getTime() - (-6 * 60 * 60 * 1000));
        assert.defined(this.a.time);
        assert.equals(this.a.time, time.getTime());
        assert.defined(this.a.request);
        assert.equals(this.a.request, 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1');
        assert.defined(this.a.method);
        assert.equals(this.a.method, 'GET');
        assert.defined(this.a.uri);
        assert.equals(this.a.uri, '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0');
        assert.defined(this.a.protocol);
        assert.equals(this.a.protocol, 'HTTP/1.1');
        assert.defined(this.a.status);
        assert.equals(this.a.status, '304');
        assert.defined(this.a.size);
        assert.equals(this.a.size, 0);
        assert.defined(this.a.referer);
        assert.equals(this.a.referer, '-');
        assert.defined(this.a.agent);
        assert.equals(this.a.agent, 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)');
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse() clears previous contents": function () {
        var line = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 304 - "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"';
        this.a.parse(line);
        
        var e;
        try {
            this.a.parse('');
        } catch (e) {
        }
        
        refute.defined(this.a.line);
        refute.defined(this.a.host);
        refute.defined(this.a.ident);
        refute.defined(this.a.user);
        refute.defined(this.a.timestamp);
        refute.defined(this.a.time);
        refute.defined(this.a.request);
        refute.defined(this.a.method);
        refute.defined(this.a.uri);
        refute.defined(this.a.protocol);
        refute.defined(this.a.status);
        refute.defined(this.a.size);
        refute.defined(this.a.referer);
        refute.defined(this.a.agent);
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse(combined, size defined)": function () {
        var line = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"';
        this.a.parse(line);
        
        assert.defined(this.a.line);
        assert.equals(this.a.line, line);
        assert.defined(this.a.host);
        assert.equals(this.a.host, '180.76.6.26');
        assert.defined(this.a.ident);
        assert.equals(this.a.ident, '-');
        assert.defined(this.a.user);
        assert.equals(this.a.user, '-');
        assert.defined(this.a.timestamp);
        assert.equals(this.a.timestamp, '30/Nov/2012:06:17:35 -0600');
        var time = new Date(Date.UTC(2012, 10, 30, 6, 17, 35, 0));
        time.setTime(time.getTime() - (-6 * 60 * 60 * 1000));
        assert.defined(this.a.time);
        assert.equals(this.a.time, time.getTime());
        assert.defined(this.a.request);
        assert.equals(this.a.request, 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1');
        assert.defined(this.a.method);
        assert.equals(this.a.method, 'GET');
        assert.defined(this.a.uri);
        assert.equals(this.a.uri, '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0');
        assert.defined(this.a.protocol);
        assert.equals(this.a.protocol, 'HTTP/1.1');
        assert.defined(this.a.status);
        assert.equals(this.a.status, '200');
        assert.defined(this.a.size);
        assert.equals(this.a.size, 4000);
        assert.defined(this.a.referer);
        assert.equals(this.a.referer, '-');
        assert.defined(this.a.agent);
        assert.equals(this.a.agent, 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)');
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse(common, size='-')": function () {
        var line = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 304 -';
        this.a.parse(line);
        
        assert.defined(this.a.line);
        assert.equals(this.a.line, line);
        assert.defined(this.a.host);
        assert.equals(this.a.host, '180.76.6.26');
        assert.defined(this.a.ident);
        assert.equals(this.a.ident, '-');
        assert.defined(this.a.user);
        assert.equals(this.a.user, '-');
        assert.defined(this.a.timestamp);
        assert.equals(this.a.timestamp, '30/Nov/2012:06:17:35 -0600');
        var time = new Date(Date.UTC(2012, 10, 30, 6, 17, 35, 0));
        time.setTime(time.getTime() - (-6 * 60 * 60 * 1000));
        assert.defined(this.a.time);
        assert.equals(this.a.time, time.getTime());
        assert.defined(this.a.request);
        assert.equals(this.a.request, 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1');
        assert.defined(this.a.method);
        assert.equals(this.a.method, 'GET');
        assert.defined(this.a.uri);
        assert.equals(this.a.uri, '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0');
        assert.defined(this.a.protocol);
        assert.equals(this.a.protocol, 'HTTP/1.1');
        assert.defined(this.a.status);
        assert.equals(this.a.status, '304');
        assert.defined(this.a.size);
        assert.equals(this.a.size, 0);
        assert.defined(this.a.referer);
        assert.equals(this.a.referer, '-');
        assert.defined(this.a.agent);
        assert.equals(this.a.agent, '-');
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse(common, size defined)": function () {
        var line = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000';
        this.a.parse(line);
        
        assert.defined(this.a.line);
        assert.equals(this.a.line, line);
        assert.defined(this.a.host);
        assert.equals(this.a.host, '180.76.6.26');
        assert.defined(this.a.ident);
        assert.equals(this.a.ident, '-');
        assert.defined(this.a.user);
        assert.equals(this.a.user, '-');
        assert.defined(this.a.timestamp);
        assert.equals(this.a.timestamp, '30/Nov/2012:06:17:35 -0600');
        var time = new Date(Date.UTC(2012, 10, 30, 6, 17, 35, 0));
        time.setTime(time.getTime() - (-6 * 60 * 60 * 1000));
        assert.defined(this.a.time);
        assert.equals(this.a.time, time.getTime());
        assert.defined(this.a.request);
        assert.equals(this.a.request, 'GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1');
        assert.defined(this.a.method);
        assert.equals(this.a.method, 'GET');
        assert.defined(this.a.uri);
        assert.equals(this.a.uri, '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0');
        assert.defined(this.a.protocol);
        assert.equals(this.a.protocol, 'HTTP/1.1');
        assert.defined(this.a.status);
        assert.equals(this.a.status, '200');
        assert.defined(this.a.size);
        assert.equals(this.a.size, 4000);
        assert.defined(this.a.referer);
        assert.equals(this.a.referer, '-');
        assert.defined(this.a.agent);
        assert.equals(this.a.agent, '-');
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse(cPanel timestamp, size defined)": function () {
        var line = '174.202.255.23 - - [09/06/2012:11:53:32 -0000] "POST /login/?login_only=1 HTTP/1.1" 301 0 "https://174.122.54.92:2087/" "Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2"';
        this.a.parse(line);
        
        assert.defined(this.a.line);
        assert.equals(this.a.line, line);
        assert.defined(this.a.host);
        assert.equals(this.a.host, '174.202.255.23');
        assert.defined(this.a.ident);
        assert.equals(this.a.ident, '-');
        assert.defined(this.a.user);
        assert.equals(this.a.user, '-');
        assert.defined(this.a.timestamp);
        assert.equals(this.a.timestamp, '09/06/2012:11:53:32 -0000');
        var time = new Date(Date.UTC(2012, 8, 6, 11, 53, 32, 0));
        assert.defined(this.a.time);
        assert.equals(this.a.time, time.getTime());
        assert.defined(this.a.request);
        assert.equals(this.a.request, 'POST /login/?login_only=1 HTTP/1.1');
        assert.defined(this.a.method);
        assert.equals(this.a.method, 'POST');
        assert.defined(this.a.uri);
        assert.equals(this.a.uri, '/login/?login_only=1');
        assert.defined(this.a.protocol);
        assert.equals(this.a.protocol, 'HTTP/1.1');
        assert.defined(this.a.status);
        assert.equals(this.a.status, '301');
        assert.defined(this.a.size);
        assert.equals(this.a.size, 0);
        assert.defined(this.a.referer);
        assert.equals(this.a.referer, 'https://174.122.54.92:2087/');
        assert.defined(this.a.agent);
        assert.equals(this.a.agent, 'Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2');
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse(common, invalid request)": function () {
        var line = '23.20.104.105 - - [10/Sep/2012:20:17:28 -0500] "\\x16\\x03\\x01" 404 -';
        this.a.parse(line);
        
        assert.defined(this.a.line);
        assert.equals(this.a.line, line);
        assert.defined(this.a.host);
        assert.equals(this.a.host, '23.20.104.105');
        assert.defined(this.a.ident);
        assert.equals(this.a.ident, '-');
        assert.defined(this.a.user);
        assert.equals(this.a.user, '-');
        assert.defined(this.a.timestamp);
        assert.equals(this.a.timestamp, '10/Sep/2012:20:17:28 -0500');
        var time = new Date(Date.UTC(2012, 8, 10, 20, 17, 28, 0));
        time.setTime(time.getTime() - (-5 * 60 * 60 * 1000));
        assert.defined(this.a.time);
        assert.equals(this.a.time, time.getTime());
        assert.defined(this.a.request);
        assert.equals(this.a.request, '\\x16\\x03\\x01');
        refute.defined(this.a.method);
        refute.defined(this.a.uri);
        refute.defined(this.a.protocol);
        assert.defined(this.a.status);
        assert.equals(this.a.status, '404');
        assert.defined(this.a.size);
        assert.equals(this.a.size, 0);
        assert.defined(this.a.referer);
        assert.equals(this.a.referer, '-');
        assert.defined(this.a.agent);
        assert.equals(this.a.agent, '-');
        refute.defined(this.a.group);
        refute.defined(this.a.source);
    },
    
    "test parse(common, invalid month)": function () {
        var line = '23.20.104.105 - - [10/Bad/2012:20:17:28 -0500] "GET /missing HTTP/1.1" 404 -';

        assert.exception(function () {        
            this.a.parse(line);
        });
    },
    
    "test parse(common, invalid timestamp)": function () {
        var line = '23.20.104.105 - - [20:17:28 -0500] "GET /what HTTP/1.1" 404 -';

        assert.exception(function () {        
            this.a.parse(line);
        });
    },
    
    "test parse(invalid request)": function () {
        var line = '23.20.104.105 - -';

        assert.exception(function () {        
            this.a.parse(line);
        });
    },
    
   
});
    
/*
var entry = new accesslog.AccessLogEntry();

console.log(util.inspect(entry));

var result;

result= entry.parse('174.202.255.23 - - [09/06/2012:11:53:32 -0000] "POST /login/?login_only=1 HTTP/1.1" 301 0 "https://174.122.54.92:2087/" "Mozilla/5.0 (X11; Linux i686; rv:6.0.2) Gecko/20100101 Firefox/6.0.2"\n');
console.log("cPanel req, result=" + result + ", entry=" + util.inspect(entry));

result= entry.parse('70.253.70.61 - root [01/04/2013:17:43:28 -0000] "GET /cPanel_magic_revision_1346925313/themes/x/icons/ipfunctions_v2.gif HTTP/1.1" 200 0 "https://dru.druiddesigns.info:2087/cpsess4423355266/scripts/command?PFILE=main" "Mozilla/5.0 (X11; Linux x86_64; rv:17.0) Gecko/20100101 Firefox/17.0"\n');
console.log("cPanel root req, result=" + result + ", entry=" + util.inspect(entry));

result= entry.parse('91.191.174.60 - - [06/Sep/2012:06:09:10 -0500] "GET /w00tw00t.at.ISC.SANS.DFind:) HTTP/1.1" 400 422\n');
console.log("common req, result=" + result + ", entry=" + util.inspect(entry));

result= entry.parse('91.191.174.60 - - [06/Bad/2012:06:09:10 -0500] "GET /w00tw00t.at.ISC.SANS.DFind:) HTTP/1.1" 400 422\n');
console.log("bad month, result=" + result + ", entry=" + util.inspect(entry));

result= entry.parse('91.191.174.60 - - [06/Sep/12:06:09:10 -0500] "GET /w00tw00t.at.ISC.SANS.DFind:) HTTP/1.1" 400 422\n');
console.log("bad timestamp, result=" + result + ", entry=" + util.inspect(entry));

*/
