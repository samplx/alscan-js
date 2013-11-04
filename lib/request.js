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

var request = module.exports = {
    // report id
    id : 'request',

    // report category (not used)
    category : undefined,
        
    // debug flag
    debug : undefined,
    
    // feedback level
    feedbackLevel : undefined,
    
    // sort order
    order : undefined,
    
    // bandwidth sample size in seconds.
    sampleSize : undefined,
    
    // size of time-slot in seconds.
    slotWidth : undefined,
    
    // begining of reporting period (Date)
    start : undefined,
    
    // end of reporting period (Date)
    stop : undefined,
    
    // scan progress handler
    progress : function () {
    },
    
    // scan report handler
    report : function(results) {
        results.forEach(function (record) {
            if (record.item) {
                console.log(record.item);
            }
        });
    },
    
    // scan error handler
    reportError : function (error) {
        console.error("ERROR: " + error.message);
    }
};

