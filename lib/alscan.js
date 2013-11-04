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
var accesslog = require("./accesslog.js");
var fs = require("fs");
var lines = require("./lines.js");
var panels = require("./panels.js");
var recognizer = require("./recognizer.js");
var scanfile = require("./scanfile.js");
var underscore = require("underscore");
var util = require("util");
var when = require("when");
var zlib = require("zlib");

var Tick = require("./tick.js").Tick;
var datetime = require("./datetime.js");
var PartialDate = datetime.PartialDate;

// -------------------------------------------------------------------------
// singleton object for Application.
var alscan = {
    // current release
    VERSION : '0.3.0-alpha0',
    
    // current author
    MAINTAINER : 'jb@samplx.org',
    
    // where to find more information.
    HOME_PAGE : 'http://alscan.org',
    
    // where to report a bug, request an enhancement
    ISSUES_URL : 'http://github.com/samplx/alscan/issues',

    // array of accounts to search.
    accounts : [],
    
    // user-agent database.
    agentDB : undefined,
    
    // reporting category
    category : undefined,
    
    // configuration file pathname.
    configFile : undefined,
    
    // flag to enable debugging information.
    debug : false,
    
    // array of domains to search.
    domains : [],
    
    // how much feedback to provide during operation.
    feedbackLevel : 1,
    
    // function to call to get a tick item from the log record.
    getItem : undefined,
    
    // track ticks outside of start and stop time.
    keepOutside : undefined,
    
    // report engine: summary, terse, request, deny, downtime
    reporter : undefined,
    
    // bandwidth/downtime sample period (seconds)
    samplePeriod : undefined,
    
    // site configuration file pathname.
    siteConfig : undefined,
    
    // duration of summary slot (seconds).
    slotWidth : undefined,
    
    // start of reporting period (milliseconds since Epoch.)
    start : undefined,
    
    // stop of reporting period (milliseconds since Epoch.)
    stop : undefined,
    
    // unrecognized user-agent strings
    unknownAgents : [],
    
    // POST unknownAgents to URL
    unknownsUrl : undefined,
    
    // argv validation (partial) of an input date-time.
    validateTime : function () {
        return function (opt) {
            if (!opt.value) return;
            if (opt.value == 'reboot') return;
            if (PartialDate.isValidFormat(opt.value)) return;
            throw new Error(util.format("%s: %s is not a valid date-time.", opt.signature, opt.value));
        };
    },
    
    // Setup the command-line argument parser.
    initializeArgs : function (argvParser) {
        var args = argvParser.create({
            description : "An access log scanner.",
            epilog : "\nFor more information, please visit:\n" +
                     "    " + alscan.HOME_PAGE + "\n" +
                     "To report problems, use:\n" +
                     "    " + alscan.ISSUES_URL + "\n"
        });
        
        args.createOption(["--version", "-V"], {
            groupName : "General Options",
            description: "Print the release version and exit.",
        });
        
        args.createOption(["--help", "-h"], {
            description: "Print this message.",
        });
        
        args.createOption(["--debug"], {
            description: false,
        });
        
        args.createOption(["--verbose", "-v"], {
            description: "Increase the feedback provided.",
            allowMultiple: true
        });
        
        args.createOption(["--quiet", "-q"], {
            description: "Do not provide feedback.",
        });
        
        args.createOption(["--report-unknowns"], {
            hasValue : true,
            valueName : "URL",
//            defaultValue : "http://alscan.info/report-unknowns.php",
            description: "Report unknown user-agents to URL.\n",
        });
        
        var validCategories = [ "groups", "sources", "user-agents", "agents",
                                "uris", "urls", "codes", "referers", "referrers",
                                "domains", "methods", "protocols", "users", "ips" ];

        var domainCategory;
        if (panels.hasDomains()) {
            validCategories.push("domains");
            domainCategory = "domains, ";
        } else {
            domainCategory = "";
        }
        args.createOption(["--category"], {
            groupName : "Report Category Options",
            hasValue : true,
            requiresValue : true,
            valueName : "NAME",
            defaultValue : "groups",
            description : "Define the report category.\n" +
                          "Category can be one of:\n" +
                          " groups, sources, user-agents, agents,\n" +
                          " uris, urls, codes, referers, referrers\n" +
                          " " + domainCategory + "methods, requests, protocols,\n" +
                          " users or ips",
            validators: [ argvParser.validators.inEnum(validCategories) ],
        });

        args.addShorthand("--groups", ["--category", "groups"]);
        args.addShorthand("--sources", ["--category", "sources"]);
        args.addShorthand("--user-agents", ["--category", "user-agents"]);
        args.addShorthand("--agents", ["--category", "user-agents"]);
        args.addShorthand("--uris", ["--category", "uris"]);
        args.addShorthand("--urls", ["--category", "uris"]);
        args.addShorthand("--codes", ["--category", "codes"]);
        args.addShorthand("--referers", ["--category", "referers"]);
        args.addShorthand("--referrers", ["--category", "referers"]);
        if (panels.hasDomains()) {
            args.addShorthand("--domains", ["--category", "domains"]);
        }
        args.addShorthand("--methods", ["--category", "methods"]);
        args.addShorthand("--requests", ["--category", "requests"]);
        args.addShorthand("--protocols", ["--category", "protocols"]);
        args.addShorthand("--users", ["--category", "users"]);
        args.addShorthand("--ips", ["--category", "ips"]);

        args.createOption(["--start"], {
            groupName : "Time Options",
            hasValue : true,
            valueName: 'DATE-TIME',
            description : "Start of the detailed scan period.",
            validators : [ alscan.validateTime() ],
        });
        
        args.addShorthand("--begin", ["--start"]);
        args.addShorthand("--reboot", ["--start", "reboot"]);
        
        args.createOption(["--stop"], {
            hasValue : true,
            valueName : 'DATE-TIME',
            description : "End of the detailed scan period.",
            validators : [ alscan.validateTime() ],
        });
        
        args.addShorthand("--end", ["--stop"]);
        
        args.createOption(["--time-slot"], {
            hasValue : true,
            valueName : 'SECONDS',
            defaultValue : "3600",
            description :  "Duration of a time-slot (seconds).",
            validators : [ argvParser.validators.positiveInteger() ],
            transform : function (value) { 
                if (value == 'Infinity') {
                    return Infinity;
                }
                return parseInt(value, 10);
            },
        });
        
        args.addShorthand("--minutes", ["--time-slot", "60"]);
        args.addShorthand("--hours", ["--time-slot", "3600"]);
        args.addShorthand("--days", ["--time-slot", "86400"]);
        args.addShorthand("-1", ["--time-slot", "Infinity"]);
        args.addShorthand("--one", ["--time-slot", "Infinity"]);

        /* FIXME
        args.createOption(["--sample"], {
            hasValue : true,
            valueName : 'SECONDS',
            defaultValue : 1,
            description : "Duration of a bandwidth sample (seconds)."
        });
        */
        
        args.createOption(["--file"], {
            groupName : "Access log options.",
            hasValue : true,
            valueName : 'PATHNAME',
            description : "Scan log file.",
            validators : [ argvParser.validators.file() ],
            allowMultiple : true
        });

        args.createOption(["--directory", "--dir"], {
            hasValue : true,
            valueName : "DIRECTORY",
            description : "Scan access logs in directory.",
            validators : [ argvParser.validators.directory() ],
            allowMultiple : true
        });

        var hasAllLogs = false;
        
        if (panels.hasAccounts()) {        
            args.createOption(["--account"], {
                hasValue : true,
                valueName : 'ACCOUNT',
                description : "Scan logs for named account.",
                allowMultiple : true
            });
            hasAllLogs = true;
        }

        if (panels.hasArchives()) {       
            args.createOption(["--archive"], {
                description : "Include archived logs."
            });
        }
        
        if (panels.hasDomains()) {        
            args.createOption(["--domain"], {
                hasValue : true,
                valueName : 'domain.tld',
                description : "Scan log of named domain.",
                allowMultiple : true
            });

            args.createOption(["--domlogs", "--vhosts"], {
                description : "Scan all vhost access logs."
            });
            hasAllLogs = true;
        }
        
        if (panels.hasMainLog()) {
            args.createOption(["--main"], {
                description : "Scan default (no vhost) access log."
            });
            hasAllLogs = true;
        }
        
        if (panels.hasPanelLog()) {
            args.createOption(["--panel"], {
                description : "Scan panel access log."
            });
            hasAllLogs = true;
        }
        
        if (hasAllLogs) {
            args.createOption(["--alllogs"], {
                description : "Scan all known access logs (vhosts, main, panel.)"
            });
        }
        
        args.createOption(["--deny"], {
            groupName : "Report Format Options",
            description : "Enable deny report."
        });

        args.createOption(["--downtime"], {
            description : "Enable downtime report."
        });
        
        args.createOption(["--request"], {
            description : "Enable request (grep-like) report."
        });

        args.createOption(["--terse", "-t"], {
            description : "Enable terse summary report."
        });
        
        args.createOption(["--fs", "-F"], {
            hasValue : true,
            valueName : "SEP",
            description : "Define terse report field separator.",
            defaultValue : '|'
        });
        
        var sortOptions = [ 'title', 'item', 'count', 'bandwidth', 'peak', 'peak-bandwidth' ];
        args.createOption(["--sort"], {
            hasValue : true,
            valueName : "ORDER",
            description : "Sort results by order. Order is one of:\n" +
                          " title, item, count, bandwidth, peak, or \n" + 
                          " peak-bandwidth",
            validators : [ argvParser.validators.inEnum(sortOptions) ],
            defaultValue : 'count'
        });
        
        args.createOption(["--top"], {
            hasValue : true,
            valueName : 'NUMBER',
            description :  "Maximum number of items to report.",
            defaultValue : 'Infinity',
            validators : [ argvParser.validators.positiveInteger() ],
            transform : function (value) { 
                if (value == 'Infinity') {
                    return Infinity;
                }
                return parseInt(value, 10);
            },
        });

        args.createOption(["--outside"], {
            description : "Include summary of requests outside of start and stop times."
        });
        
        args.createOption(["--agent"], {
            groupName : "Search Options",
            hasValue : true,
            allowMultiple : true,
            valueName : 'STRING',
            description : "Match exact user-agent string."
        });
        
        args.addShorthand("--ua", ["--agent"]);
        args.addShorthand("--user-agent", ["--agent"]);
        
        args.createOption(["--match-agent"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "REGEXP",
            description : "Match user-agent regular expression."
        });
        
        args.addShorthand("--match-ua", [ "--match-agent" ]);
        args.addShorthand("--match-user-agent", [ "--match-agent" ]);
        
        args.createOption(["--code"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "STATUS",
            description : "Match HTTP status code."
        });
        
        args.createOption(["--group"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "NAME",
            description : "Match User-agent group name."
        });
        
        args.createOption(["--ip"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "IP[/mask]",
            description : "Match request IP address."
        });
        
        args.createOption(["--method"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "METHOD",
            description : "Match request method name."
        });
        
        args.createOption(["--referer"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "URI",
            description : "Match exact referer string."
        });
        
        args.addShorthand("--referrer", ["--referer"]);
        
        args.createOption(["--match-referer"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "REGEXP",
            description : "Match referer regular expression."
        });
        
        args.addShorthand("--match-referrer", ["--match-referer"]);
        
        args.createOption(["--source"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "NAME",
            description : "Match User-agent source name."
        });
        
        args.createOption(["--uri"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "STRING",
            description : "Match exact URL string."
        });
        args.addShorthand("--url", ["--uri"]);
        
        args.createOption(["--match-uri"], {
            hasValue : true,
            allowMultiple : true,
            valueName : "REGEXP",
            description : "Match URL regular expression."
        });
        args.addShorthand("--match-url", ["--match-uri"]);
/*
        args.createOption(["--site-config"], {
            hasValue : true,
            valueName : "FILENAME",
            groupName : "Configuration options",
            description : "Read site default options from file.",
            validators : [ argvParser.validators.file() ],
            allowOverride : true
        });
        
        args.createOption(["--config"], {
            hasValue : true,
            valueName : "FILENAME",
            description : "Read user default options from file.\n",
            defaultValue : process.env.HOME + "/.config/alscan/config"
        });
*/        
        args.createOperand("filename", {
            description : "Optional list of files to scan.",
            greedy : true
        });
        
        return args;
    },
    
    // add an unknown user-agent to the list
    addUnknown : function (agent) {
        if (alscan.unknownAgents.indexOf(agent) < 0) {
            alscan.unknownAgents.push(agent);
        }
    },

    // update the unknowns
    updateUnknowns : function () {
        if (alscan.agentDB && alscan.unknownsUrl &&
            (alscan.unknownAgents.length > 0)) {
            alscan.agentDB.reportUnknowns(alscan.unknownAgents, alscan.unknownsUrl);
        }
    },
        
    // scan a single ScanFile
    scanFile : function(deferred, file) {
        var entry = new accesslog.AccessLogEntry();
        var ticks = [];
        var baseStream = fs.createReadStream(file.pathname);
        var inputStream = new lines.LineStream();
        var agentInfo;
        var tick;
        
        inputStream.on('data', function (chunk) {
            entry.parse(chunk);
            if (alscan.agentDB) {
                agentInfo = alscan.agentDB.lookup(entry.agent);
                entry.group = agentInfo.group;
                entry.source = agentInfo.source;
                if (agentInfo.group == 'unknown') {
                    alscan.addUnknown(entry.agent);
                }
            }
            if (recognizer.matches(entry)) {
                if ((entry.time <= alscan.stop) && (entry.time >= alscan.start)) {
                    tick = new Tick(entry.time, entry.size, alscan.getItem(entry, file));
                } else if (alscan.keepOutside) {
                    tick = new Tick(entry.time, entry.size, undefined);
                } else {
                    tick = null;
                }
                if (tick) {
//                    console.log('adding tick[' +ticks.length + ']=' + util.inspect(tick));
                    ticks.push(tick);
                }
            }
        });
        
        inputStream.on('end', function () {
            // console.log('scanFile: hit EOF');
            deferred.resolve(ticks);
        });
        
        inputStream.on('error', function (err) {
            // console.error('scanFile: error: ' + err);
            deferred.reject(err);
        });
        if (file.isCompressed()) {
            var gunzipStream = zlib.createGunzip();
            baseStream.pipe(gunzipStream).pipe(inputStream);
        } else {
            baseStream.pipe(inputStream);
        }
    },
    
    // scan the log files
    scanFiles : function (files) {
        if (files.length == 0) {
            var d = when.defer();
            // console.error("scanFiles: No files to scan.");
            d.reject(new Error("No files to scan."));
            return d.promise;
        }
//        console.log("scanFiles(files=" + util.inspect(files) + ")");
        var promises = [];
        files.forEach(function (file) {
            var d = when.defer();
            alscan.scanFile(d, file);
            promises.push(d.promise);
        });
        return when.all(promises);
    },

    flattenAndSort : function (ticksArrays) {
        var ticks = underscore.flatten(ticksArrays);
        var sorted = underscore.sortBy(ticks, 'time');
        // console.log("sorted:"); console.dir(sorted);
        return when(sorted);
    },

    report : function (ticks) {
        alscan.reporter.report(ticks);
    },
    
    reportError : function (error) {
        alscan.reporter.reportError(error);
    },
            
    // command-line entry point.
    main: function () {
    
        panels.load();
        
        var argvParser = require('samplx-argv-parser');
        
        var args = this.initializeArgs(argvParser);

//        console.log(util.inspect(args, { depth: null, showHidden: true, colors: true }));

        args.parse(process.argv.slice(2), function (errors, options) {
            if (errors) {
                args.printUsage(errors);
                process.exit(2);
            }
            if (options["--debug"].isSet) {
                alscan.debug = true;
            }
            if (options["--quiet"].isSet) {
                alscan.feedbackLevel = 0;
            } else if (options["--verbose"].isSet) {
                alscan.feedbackLevel += options["--verbose"].timesSet;
            }
            if (options["--help"].isSet) {
                // alscan.printHelp(args);
                args.printHelp();
                process.exit(0);
            }
            if (options["--version"].isSet) {
                args.printVersion(alscan.VERSION, (alscan.feedbackLevel > 1));
                process.exit(0);
            }
            if (options["--report-unknowns"].isSet) {
                alscan.unknownsUrl = options["--report-unknowns"].value;
            }
            alscan.slotWidth = options["--time-slot"].value;
            
            alscan.keepOutside = false;
            var reporter;
            if (options["--deny"].isSet) {
                var DenyReport = require("./deny.js").DenyReport;
                reporter = new DenyReport();
//                console.log("new DenyReport =" + util.inspect(reporter, { depth: null, showHidden: true }));
//                console.log("new DenyReport.prototype =" + util.inspect(DenyReport.prototype, { depth: null, showHidden: true }));
                reporter.limit = options["--top"].value;
                reporter.order = options["--sort"].value;
            } else if (options["--downtime"].isSet) {
                var DowntimeReport = require("./downtime.js").DowntimeReport;
                reporter = new DowntimeReport();
                if (!options["--time-slot"].isSet) {
                    // default for downtime report is one minute.
                    reporter.slotWidth = 60;
                } else {
                    reporter.slotWidth = alscan.slotWidth;
                }
            } else if (options["--request"].isSet) {
                reporter = require("./request.js");
            } else {
                var SummaryReport = require("./summary.js").SummaryReport;
                reporter = new SummaryReport();
                reporter.slotWidth = alscan.slotWidth;
                // reporter.sampleSize = options["--sample"].value;
                reporter.order = options["--sort"].value;
                reporter.limit = options["--top"].value;
                if (options["--terse"].isSet || options["--fs"].isSet) {
                    reporter.terse = true;
                    reporter.fieldSep = options["--fs"].value;
                }
                reporter.keepOutside = alscan.keepOutside = options["--outside"].isSet;
            }
            reporter.debug = alscan.debug;
            reporter.feedbackLevel = alscan.feedbackLevel;
            
            var haveStart;
            var haveStop = when.defer();
            var haveStartStop = when.defer();
            if (options["--start"].isSet) {
                haveStart = datetime.parsePartialDate(options["--start"].value, true);
            } else {
                haveStart = when(new PartialDate());
            }
            haveStart.then(function(start) {
//                console.log("start=" + util.inspect(start));
                if (options["--stop"].isSet) {
//                    console.log("calling parseParialDate("+options["--stop"].value+", false)");
                    datetime.parsePartialDate(options["--stop"].value, false).then(function (stop) {
                        haveStop.resolve(stop);
                    });
                } else {
                    haveStop.resolve(new PartialDate());
                }
                haveStop.promise.then(function (stop) {
//                    console.log("stop=" + util.inspect(stop));
                    haveStartStop.resolve(datetime.calculateStartStop(start, stop, alscan.slotWidth));
                });
            });
            haveStartStop.promise.then(function (startStop) {
//                console.log("startStop=" + util.inspect(startStop));
                if (startStop.errors) {
                    startStop.errors.forEach(function(err) {
                        console.error("ERROR: " + err.message);
                    });
                    process.exit(2);
                }
                alscan.start = startStop.start.getTime();
                reporter.start = startStop.start;
                alscan.stop  = startStop.stop.getTime();
                reporter.stop = startStop.stop;
            });
            
            // configure category settings
            var needAgentDB = false;
            reporter.category = alscan.category = options["--category"].value;
//            console.log("category=" + alscan.category);
           if (options["--deny"].isSet) {
                alscan.getItem = function (record) { return record.host; };
            } else if (options["--downtime"].isSet) {
                alscan.getItem = function () { return undefined; };
            } else if (options["--request"].isSet) {
                alscan.getItem = function (record) { return record.line; };
            } else if (alscan.category == "groups") {
                needAgentDB = true;
                alscan.getItem = function (record) { return record.group; };
            } else if (alscan.category == "sources") {
                needAgentDB = true;
                alscan.getItem = function (record) { return record.source; };
            } else if ((alscan.category == "user-agents") || (alscan.category == "agents")) {
                alscan.getItem = function (record) { return record.agent; };
            } else if ((alscan.category == "uris") || (alscan.category == "urls")) {
                alscan.getItem = function (record) { return record.uri; };
            } else if (alscan.category == "codes") {
                alscan.getItem = function (record) { return record.status; };
            } else if ((alscan.category == "referers") || (alscan.category == "referrers")) {
                alscan.getItem = function (record) { return record.referer; };
            } else if (alscan.category == "domains") {
                alscan.getItem = function (record, file) { return file.domain; };
            } else if (alscan.category == "methods") {
                alscan.getItem = function (record) { return record.method; };
            } else if (alscan.category == "requests") {
                alscan.getItem = function (record) { return record.request; };
            } else if (alscan.category == "protocols") {
                alscan.getItem = function (record) { return record.protocol; };
            } else if (alscan.category == "users") {
                alscan.getItem = function (record) { return record.user; };
            } else if (alscan.category == "ips") {
                alscan.getItem = function (record) { return record.host; };
            } else {
                throw new Error("Unrecognized category: " + alscan.category);
            }
            if ((options["--group"].isSet) || (options["--source"].isSet)) {
                needAgentDB = true;
            }
//            console.log("needAgentDB=" + needAgentDB);
            if (needAgentDB) {
                alscan.agentDB = require("samplx-agentdb");
            }

            // setup recognizer
            if (options["--agent"].isSet) {
                options["--agent"].value.forEach(function (value) {
                    recognizer.addValue('agent', value);
                });
            }
            if (options["--match-agent"].isSet) {
                options["--match-agent"].value.forEach(function (re) {
                    recognizer.addPattern('agent', re);
                });
            }
            if (options["--code"].isSet) {
                options["--code"].value.forEach(function (value) {
                    recognizer.addValue('status', value);
                });
            }
            if (options["--ip"].isSet) {
                options["--ip"].value.forEach(function (value) {
                    recognizer.addIP(value);
                });
            }
            if (options["--method"].isSet) {
                options["--method"].value.forEach(function (value) {
                    recognizer.addValue('method', value);
                });
            }
            if (options["--referer"].isSet) {
                options["--referer"].value.forEach(function (value) {
                    recognizer.addValue('referer', value);
                });
            }
            if (options["--match-referer"].isSet) {
                options["--match-referer"].value.forEach(function (re) {
                    recognizer.addPattern('referer', re);
                });
            }
            if (options["--uri"].isSet) {
                options["--uri"].value.forEach(function (value) {
                    recognizer.addValue('uri', value);
                });
            }
            if (options["--match-uri"].isSet) {
                options["--match-uri"].value.forEach(function (re) {
                    recognizer.addPattern('uri', re);
                });
            }
            if (options["--group"].isSet) {
                options["--group"].value.forEach(function (value) {
                    recognizer.addValue('group', value);
                });
            }
            if (options["--source"].isSet) {
                options["--source"].value.forEach(function (value) {
                    recognizer.addValue('source', value);
                });
            }

            haveStartStop.promise.then(function (startStop) {            
//                console.log("startStop=" + util.inspect(startStop));
                // setup log files
                var fileOptions = {
                    files       : options["--file"].value || [],
                    directories : options["--directory"].value || [],
                    main        : panels.hasMainLog() && options["--main"].isSet,
                    panel       : panels.hasPanelLog() && options["--panel"].isSet,
                    start       : startStop.start,
                    stop        : startStop.stop
                };
                if (panels.hasAccounts()) {
                    fileOptions.accounts = options["--account"].value || [];
                } else {
                    fileOptions.accounts = [];
                }
                if (panels.hasArchives()) {
                    fileOptions.archives = options["--archive"].isSet;
                } else {
                    fileOptions.archives = false;
                }
                if (panels.hasDomains()) {
                    fileOptions.domains = options["--domain"].value || [];
                    fileOptions.domlogs = options["--domlogs"].isSet;
                } else {
                    options.domlogs = false;
                }
                if (options["--alllogs"] && options["--alllogs"].isSet) {
                    fileOptions.domlogs = fileOptions.main = fileOptions.panel = true;
                }
                if (options["filename"].value) {
                    fileOptions.files = fileOptions.files.concat(options["filename"].value);
                }

    //            var agentdb = require('samplx-agentdb');
    //            console.dir(agentdb.lookup(''));
    //            console.dir(agentdb.lookup('Mozilla/5.0 (X11; Linux x86_64; rv:24.0) Gecko/20100101 Firefox/24.0'));
    //            console.log("options = " + util.inspect(options, { depth : null, showHidden: true }));
    //            console.log("fileOptions = " + util.inspect(fileOptions, { depth : null, showHidden: true }));
                alscan.reporter = reporter;
                var files = panels.findScanFiles(fileOptions);
                files.then(alscan.scanFiles)
                     .then(alscan.flattenAndSort)
                     .then(alscan.report, alscan.reportError)
                     .then(alscan.updateUnknowns);
            });
//            console.log("module.children=" + util.inspect(module.children, { depth: null, showHidden: true }));

//            agentdb.reportUnknowns(['agentdb']);
//            console.log("process.env"); console.dir(process.env);
//            console.dir(options);
        });
    },
    
};

// define module as alscan singleton.
exports = module.exports = alscan;

