#!/usr/bin/env node
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018, 2020, 2025 James Burlingame
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

// // enable JavaScript strict mode.
// 'use strict';

// // module imports
// const _ = require('lodash');
// const fs = require('fs');
// const util = require('util');
// const when = require('when');
// const zlib = require('zlib');

// const accesslog = require('./accesslog.js');
// const argvParser = require('samplx-argv-parser');
// const datetime = require('./datetime.js');
// const lines = require('./lines.js');
// const panels = require('./panels.js');
// const recognizer = require('./recognizer.js');
// const tick = require('./tick.js');

import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { AccessLogEntry } from "./accesslog.ts";
import { Command, InvalidArgumentError, Option } from "@commander-js/extra-typings";
import { PartialDate } from "./datetime.ts";
import { LineStream } from "./lines.ts";
import { Panels } from "./panels.ts";
import { matches } from "./recognizer.ts";
import { Tick } from "./tick.ts";
import packageJson from "../package.json" with { type: 'json'};
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import type { Stream } from "node:stream";

const HOME_PAGE = packageJson.homepage;
const ISSUES_URL = packageJson.bugs.url;
const VERSION = packageJson.version;

/**
 * Return a validator function used to validate partial date parameters.
 */
function validateTime(value: string, _dummyPrevious: string): string {
    if ((value == 'reboot') || PartialDate.isValidFormat(value)) {
        return value;
    }
    throw new InvalidArgumentError(`${value} is not a valid date-time.`);
}

// /**
//  * Create an empty command-line parser with a set of properties.
//  * @param {module} argvParser
//  */
// function createArgs(argvParser) {
//     const args = argvParser.create({
//         description : 'An access log scanner.',
//         epilog : '\nFor more information, please visit:\n' +
//                  '    ' + HOME_PAGE + '\n' +
//                  'To report problems, use:\n' +
//                  '    ' + ISSUES_URL + '\n'
//     });
//     return args;
// }

// /**
//  * Setup the argvParser to handle the defined options.
//  * @param {object} args command-line parser.
//  * @param {object} validators default validators for command-line options.
//  * @param {boolean} hasAccounts flag indicates the panel supports account specific files.
//  * @param {boolean} hasArchives flag indicates the panel supports archive files.
//  * @param {boolean} hasDomains flag indicates the panel supports domain specific files.
//  * @param {boolean} hasMainLog flag indicates the panel has a main log file.
//  * @param {boolean} hasPanelLog flag indicates the panel has a separate log file for the panel itself.
//  */
// function setupArgvParser(args, validators, hasAccounts, hasArchives, hasDomains, hasMainLog, hasPanelLog) {
//     args.createOption(['--version', '-V'], {
//         groupName : 'General Options',
//         description: 'Print the release version and exit.',
//     });

//     args.createOption(['--help', '-h'], {
//         description: 'Print this message.',
//     });

//     args.createOption(['--debug'], {
//         description: false,
//     });

//     args.createOption(['--verbose', '-v'], {
//         description: 'Increase the information provided.',
//         allowMultiple: true
//     });

//     args.createOption(['--quiet', '-q'], {
//         description: 'Do not provide progress information.',
//     });

//     const validCategories = [ 'groups', 'sources', 'user-agents', 'agents',
//         'uris', 'urls', 'codes', 'referers', 'referrers', 'requests',
//         'domains', 'methods', 'protocols', 'users', 'ips' ];

//     const domainCategory = hasDomains ? 'domains, ' : '';
//     if (hasDomains) {
//         validCategories.push('domains');
//     }
//     args.createOption(['--category'], {
//         groupName : 'Report Category Options',
//         hasValue : true,
//         requiresValue : true,
//         valueName : 'NAME',
//         defaultValue : 'groups',
//         description : 'Define the report category.\n' +
//                       'Category can be one of:\n' +
//                       ' groups, sources, user-agents, agents,\n' +
//                       ' uris, urls, codes, referers, referrers\n' +
//                       ' ' + domainCategory + 'methods, requests, protocols,\n' +
//                       ' users or ips',
//         validators: [ validators.inEnum(validCategories) ],
//     });

//     args.addShorthand('--groups', ['--category', 'groups']);
//     args.addShorthand('--sources', ['--category', 'sources']);
//     args.addShorthand('--user-agents', ['--category', 'user-agents']);
//     args.addShorthand('--agents', ['--category', 'user-agents']);
//     args.addShorthand('--uris', ['--category', 'uris']);
//     args.addShorthand('--urls', ['--category', 'uris']);
//     args.addShorthand('--codes', ['--category', 'codes']);
//     args.addShorthand('--referers', ['--category', 'referers']);
//     args.addShorthand('--referrers', ['--category', 'referers']);
//     if (hasDomains) {
//         args.addShorthand('--domains', ['--category', 'domains']);
//     }
//     args.addShorthand('--methods', ['--category', 'methods']);
//     args.addShorthand('--requests', ['--category', 'requests']);
//     args.addShorthand('--protocols', ['--category', 'protocols']);
//     args.addShorthand('--users', ['--category', 'users']);
//     args.addShorthand('--ips', ['--category', 'ips']);

//     args.createOption(['--start'], {
//         groupName : 'Time Options',
//         hasValue : true,
//         valueName: 'DATE-TIME',
//         description : 'Start of the detailed scan period.',
//         validators : [ validateTime() ],
//     });

//     args.addShorthand('--begin', ['--start']);
//     args.addShorthand('--reboot', ['--start', 'reboot']);

//     args.createOption(['--stop'], {
//         hasValue : true,
//         valueName : 'DATE-TIME',
//         description : 'End of the detailed scan period.',
//         validators : [ validateTime() ],
//     });

//     args.addShorthand('--end', ['--stop']);

//     args.createOption(['--time-slot'], {
//         hasValue : true,
//         valueName : 'SECONDS',
//         defaultValue : '3600',
//         description :  'Duration of a time-slot (seconds).',
//         validators : [ validators.positiveInteger() ],
//         transform : function (value) {
//             if (value == 'Infinity') {
//                 return Infinity;
//             }
//             return parseInt(value, 10);
//         },
//     });

//     args.addShorthand('--minutes', ['--time-slot', '60']);
//     args.addShorthand('--hours', ['--time-slot', '3600']);
//     args.addShorthand('--days', ['--time-slot', '86400']);
//     args.addShorthand('-1', ['--time-slot', 'Infinity']);
//     args.addShorthand('--one', ['--time-slot', 'Infinity']);

//     args.createOption(['--file'], {
//         groupName : 'Access log options.',
//         hasValue : true,
//         valueName : 'PATHNAME',
//         description : 'Scan log file.',
//         validators : [ validators.file() ],
//         allowMultiple : true
//     });

//     args.createOption(['--directory', '--dir'], {
//         hasValue : true,
//         valueName : 'DIRECTORY',
//         description : 'Scan access logs in directory.',
//         validators : [ validators.directory() ],
//         allowMultiple : true
//     });

//     const hasAllLogs = hasAccounts || hasDomains || hasMainLog || hasPanelLog;

//     if (hasAccounts) {
//         args.createOption(['--account'], {
//             hasValue : true,
//             valueName : 'ACCOUNT',
//             description : 'Scan logs for named account.',
//             allowMultiple : true
//         });
//     }

//     if (hasArchives) {
//         args.createOption(['--archive'], {
//             description : 'Include archived logs.'
//         });
//     }

//     if (hasDomains) {
//         args.createOption(['--domain'], {
//             hasValue : true,
//             valueName : 'domain.tld',
//             description : 'Scan log of named domain.',
//             allowMultiple : true
//         });

//         args.createOption(['--domlogs', '--vhosts'], {
//             description : 'Scan all vhost access logs.'
//         });
//     }

//     if (hasMainLog) {
//         args.createOption(['--main'], {
//             description : 'Scan default (no vhost) access log.'
//         });
//     }

//     if (hasPanelLog) {
//         args.createOption(['--panel'], {
//             description : 'Scan panel access log.'
//         });
//     }

//     if (hasAllLogs) {
//         args.createOption(['--alllogs'], {
//             description : 'Scan all known access logs (vhosts, main, panel.)'
//         });
//     }

//     args.createOption(['--deny'], {
//         groupName : 'Report Format Options',
//         description : 'Enable deny report.'
//     });

//     args.createOption(['--downtime'], {
//         description : 'Enable downtime report.'
//     });

//     args.createOption(['--request'], {
//         description : 'Enable request (grep-like) report.'
//     });

//     args.createOption(['--terse', '-t'], {
//         description : 'Enable terse summary report.'
//     });

//     args.createOption(['--fs', '-F'], {
//         hasValue : true,
//         valueName : 'SEP',
//         description : 'Define terse report field separator.',
//         defaultValue : '|'
//     });

//     const sortOptions = [ 'title', 'item', 'count', 'bandwidth', 'peak', 'peak-bandwidth' ];
//     args.createOption(['--sort'], {
//         hasValue : true,
//         valueName : 'ORDER',
//         description : 'Sort results by order. Order is one of:\n' +
//                       ' title, item, count, bandwidth, peak, or \n' +
//                       ' peak-bandwidth',
//         validators : [ validators.inEnum(sortOptions) ],
//         defaultValue : 'count'
//     });

//     args.createOption(['--top'], {
//         hasValue : true,
//         valueName : 'NUMBER',
//         description :  'Maximum number of items to report.',
//         defaultValue : 'Infinity',
//         validators : [ validators.positiveInteger() ],
//         transform : function (value) {
//             if (value == 'Infinity') {
//                 return Infinity;
//             }
//             return parseInt(value, 10);
//         },
//     });

//     args.createOption(['--outside'], {
//         description : 'Include summary of requests outside of start and stop times.'
//     });

//     args.createOption(['--agent'], {
//         groupName : 'Search Options',
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'STRING',
//         description : 'Match exact user-agent string.'
//     });

//     args.addShorthand('--ua', ['--agent']);
//     args.addShorthand('--user-agent', ['--agent']);

//     args.createOption(['--match-agent'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'REGEXP',
//         description : 'Match user-agent regular expression.'
//     });

//     args.addShorthand('--match-ua', [ '--match-agent' ]);
//     args.addShorthand('--match-user-agent', [ '--match-agent' ]);

//     args.createOption(['--code'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'STATUS',
//         description : 'Match HTTP status code.'
//     });

//     args.createOption(['--group'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'NAME',
//         description : 'Match User-agent group name.'
//     });

//     args.createOption(['--ip'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'IP[/mask]',
//         description : 'Match request IP address.'
//     });

//     args.createOption(['--method'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'METHOD',
//         description : 'Match request method name.'
//     });

//     args.createOption(['--referer'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'URI',
//         description : 'Match exact referer string.'
//     });

//     args.addShorthand('--referrer', ['--referer']);

//     args.createOption(['--match-referer'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'REGEXP',
//         description : 'Match referer regular expression.'
//     });

//     args.addShorthand('--match-referrer', ['--match-referer']);

//     args.createOption(['--source'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'NAME',
//         description : 'Match User-agent source name.'
//     });

//     args.createOption(['--uri'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'STRING',
//         description : 'Match exact URL string.'
//     });
//     args.addShorthand('--url', ['--uri']);

//     args.createOption(['--match-uri'], {
//         hasValue : true,
//         allowMultiple : true,
//         valueName : 'REGEXP',
//         description : 'Match URL regular expression.'
//     });
//     args.addShorthand('--match-url', ['--match-uri']);

//     args.createOperand('filename', {
//         description : 'Optional list of files to scan.',
//         greedy : true
//     });

//     return args;
// }

// /**
//  * Setup the command-line argument parser.
//  * @param hasAccounts flag indicates the panel has account specific files.
//  * @param hasArchives flag indicates the panel has archived files.
//  * @param hasDomains flag indicates the panel has domain specific files.
//  * @param hasMainLog flag indicates the panel has a main log file.
//  * @param hasPanelLog flag indicates the panel has a panel specific log file.
//  */
// function initializeArgs(
//     hasAccounts: boolean,
//     hasArchives: boolean,
//     hasDomains: boolean,
//     hasMainLog: boolean,
//     hasPanelLog: boolean
// ): Command {
//     const program = new Command();

//     return program;
// }

// /**
//  * Return a getItem function depending upon the options and category.
//  * @param {object} options parsed options from command-line.
//  * @param {string} category category of the requested report.
//  */
// function getGetItem(options, category) {
//     var getItem;
//     if (options['--deny'].isSet) {
//         getItem = (record) => record.host;
//     } else if (options['--downtime'].isSet) {
//         getItem = () => undefined;
//     } else if (options['--request'].isSet) {
//         getItem = (record) => record.line;
//     } else if (category == 'groups') {
//         getItem = (record) => record.group;
//     } else if (category == 'sources') {
//         getItem = (record) => record.source;
//     } else if ((category == 'user-agents') || (category == 'agents')) {
//         getItem = (record) => record.agent;
//     } else if ((category == 'uris') || (category == 'urls')) {
//         getItem = (record) => record.uri;
//     } else if (category == 'codes') {
//         getItem = (record) => record.status;
//     } else if ((category == 'referers') || (category == 'referrers')) {
//         getItem = (record) => record.referer;
//     } else if (category == 'domains') {
//         getItem = (record, domain) => domain;
//     } else if (category == 'methods') {
//         getItem = (record) => record.method;
//     } else if (category == 'requests') {
//         getItem = (record) => record.request;
//     } else if (category == 'protocols') {
//         getItem = (record) => record.protocol;
//     } else if (category == 'users') {
//         getItem = (record) => record.user;
//     } else if (category == 'ips') {
//         getItem = (record) => record.host;
//     } else {
//         throw new Error('Unrecognized category: ' + category);
//     }
//     return getItem;
// }

// /**
//  * Determine how verbose we should be while processing data.
//  * @param {object} options parsed command-line options.
//  */
// function getVerboseLevel(options) {
//     if (options['--quiet'].isSet) {
//         return 0;
//     }
//     if (options['--verbose'].isSet) {
//         return 1 + options['--verbose'].timesSet;
//     }
//     return 1;
// }

// /**
//  * Setup a specific reporter based upon options, category, etc.
//  * @param {object} options
//  * @param {boolean} debug
//  * @param {number} verboseLevel
//  * @param {string} category
//  */
// function getReporter(options, debug, verboseLevel, category) {
//     var reporter;
//     if (options['--deny'].isSet) {
//         const DenyReport = require('./deny.js').DenyReport;
//         reporter = new DenyReport();
//         reporter.limit = options['--top'].value;
//         reporter.order = options['--sort'].value;
//     } else if (options['--downtime'].isSet) {
//         const DowntimeReport = require('./downtime.js').DowntimeReport;
//         reporter = new DowntimeReport();
//         if (options['--time-slot'].isSet) {
//             reporter.slotWidth = options['--time-slot'].value;
//         } else {
//             // default for downtime report is one minute.
//             reporter.slotWidth = 60;
//         }
//     } else if (options['--request'].isSet) {
//         const RequestReport = require('./request.js').RequestReport;
//         reporter = new RequestReport();
//     } else {
//         const SummaryReport = require('./summary.js').SummaryReport;
//         reporter = new SummaryReport();
//         reporter.slotWidth = options['--time-slot'].value;
//         reporter.order = options['--sort'].value;
//         reporter.limit = options['--top'].value;
//         if (options['--terse'].isSet || options['--fs'].isSet) {
//             reporter.terse = true;
//             reporter.fieldSep = options['--fs'].value;
//         }
//         reporter.keepOutside = options['--outside'].isSet;
//     }
//     reporter.debug = debug;
//     reporter.verboseLevel = verboseLevel;
//     reporter.category = category;
//     return reporter;
// }

// /**
//  * Return an AgentDB object if it is needed based upon options and category.
//  * @param {object} options parsed command-line options.
//  * @param {string} category given category of the requested report.
//  */
// function getAgentDB(options, category) {
//     if (options['--group'].isSet || options['--source'].isSet || (category == 'groups') || (category == 'sources')) {
//         const agentDB = require('samplx-agentdb');
//         return agentDB;
//     }
//     return undefined;
// }

// /**
//  * Add matchers to the recognizer based upon command-line options.
//  * @param {object} options parsed command-line options.
//  */
// function setupRecognizer(options) {
//     if (options['--agent'].isSet) {
//         options['--agent'].value.forEach((value) => recognizer.addValue('agent', value));
//     }
//     if (options['--match-agent'].isSet) {
//         options['--match-agent'].value.forEach((re) => recognizer.addPattern('agent', re));
//     }
//     if (options['--code'].isSet) {
//         options['--code'].value.forEach((value) =>recognizer.addValue('status', value));
//     }
//     if (options['--ip'].isSet) {
//         options['--ip'].value.forEach((v) => recognizer.addIP(v));
//     }
//     if (options['--method'].isSet) {
//         options['--method'].value.forEach((value) => recognizer.addValueNC('method', value));
//     }
//     if (options['--referer'].isSet) {
//         options['--referer'].value.forEach((value) => recognizer.addValue('referer', value));
//     }
//     if (options['--match-referer'].isSet) {
//         options['--match-referer'].value.forEach((re) => recognizer.addPattern('referer', re));
//     }
//     if (options['--uri'].isSet) {
//         options['--uri'].value.forEach((value) => recognizer.addValue('uri', value));
//     }
//     if (options['--match-uri'].isSet) {
//         options['--match-uri'].value.forEach((re) => recognizer.addPattern('uri', re));
//     }
//     if (options['--group'].isSet) {
//         options['--group'].value.forEach((value) => recognizer.addValueNC('group', value));
//     }
//     if (options['--source'].isSet) {
//         options['--source'].value.forEach((value) => recognizer.addValueNC('source', value));
//     }
// }

/**
 * Scan a single file/stream. Resolves to an array of Ticks. Rejects to an error.
 * @param {stream} baseStream contents to scan
 * @param {boolean} isCompressed flag indicates if stream is gz compressed.
 * @param {string} domain domain associated with the stream.
 * @param {number} start timestamp indicating the start of interesting information.
 * @param {number} stop timestamp indicating the stop of interesting information.
 * @param {boolean} keepOutside flag indicates to record events that are outside of start and stop.
 * @param {function} getItem function used to extract information from each record.
 */
// async function scanStream(
//     baseStream: Stream,
//     isCompressed: boolean,
//     domain: string,
//     start: number,
//     stop: number,
//     keepOutside: boolean,
//     getItem: Function) {
//     const entry = new AccessLogEntry();
//     const ticks: Array<Tick> = [];
//     const inputStream = new LineStream({});

//     inputStream.on('data', function (chunk) {
//         entry.parse(chunk);
//         if (matches(entry) && entry.time) {
//             if ((entry.time <= stop) && (entry.time >= start)) {
//                 ticks.push(new Tick(entry.time, entry.size, getItem(entry, domain)));
//             } else if (keepOutside) {
//                 ticks.push(new Tick(entry.time, entry.size, undefined));
//             }
//         }
//     });

//     inputStream.on('end', function () {
//         deferred.resolve(ticks);
//     });

//     inputStream.on('error', function (err) {
//         deferred.reject(err);
//     });

//     if (isCompressed) {
//         baseStream.pipe(createGunzip()).pipe(inputStream);
//     } else {
//         baseStream.pipe(inputStream);
//     }
// }

// /**
//  * Process the contents of a single log file.
//  * @param {promise} deferred resolved when file has been processed.
//  * @param {ScanFile} file information about the log file.
//  * @param {Date} start when a log entry becomes 'interesting'.
//  * @param {Date} stop when a log entry is no longer 'interesting'.
//  * @param {boolean} keepOutside process log entries before start and after stop.
//  * @param {function} getItem function to call to extract information from a record.
//  * @param {object} agentDB used to lookup a user-agent's group and source.
//  */
// function scanFile(deferred, file, start, stop, keepOutside, getItem, agentDB) {
//     const baseStream = fs.createReadStream(file.pathname);
//     scanStream(deferred, baseStream, file.isCompressed(), file.domain, start, stop, keepOutside, getItem, agentDB);
// }

// /**
//  * Process the contents of a group of log files.
//  * @param {Array} files array of ScanFile entires.
//  * @param {Date} start when a log entry becomes 'interesting'.
//  * @param {Date} stop when a log entry is no longer 'interesting'.
//  * @param {boolean} keepOutside process log entries before start and after stop.
//  * @param {function} getItem function to call to extract information from a log record.
//  * @param {object} agentDB used to lookup a user-agents group and source.
//  */
// function scanFiles(files, start, stop, keepOutside, getItem, agentDB) {
//     if (files.length === 0) {
//         const d = when.defer();
//         d.reject(new Error('No files to scan.'));
//         return d.promise;
//     }
//     const promises = [];
//     files.forEach((file) => {
//         const d = when.defer();
//         scanFile(d, file, start, stop, keepOutside, getItem, agentDB);
//         promises.push(d.promise);
//     });
//     return when.all(promises);
// }

// /**
//  * Process the source array of arrays of Tick entries,
//  * return a flattened and sorted array of Tick entries.
//  * @param {Array} ticksArrays source array of arrays of Tick entries.
//  */
// function flattenAndSort(ticksArrays) {
//     var ticks = _.flatten(ticksArrays);
//     var sorted = _.sortBy(ticks, 'time');
//     return when(sorted);
// }

// /**
//  * Determine the starting and stop time from the command-line arguments.
//  * @param {object} options parsed command-line options.
//  * @param {*} slotWidth how wide in seconds each 'bucket' is.
//  */
// function getStartStop(options, slotWidth) {
//     const haveStart = options['--start'].isSet ? datetime.parsePartialDate(options['--start'].value, true) : when(new PartialDate());
//     const haveStop = when.defer();
//     const haveStartStop = when.defer();
//     haveStart.then(start => {
//         if (options['--stop'].isSet) {
//             datetime.parsePartialDate(options['--stop'].value, false).then((stop) => {
//                 haveStop.resolve(stop);
//             });
//         } else {
//             haveStop.resolve(new PartialDate());
//         }
//         haveStop.promise.then((stop) => {
//             haveStartStop.resolve(datetime.calculateStartStop(start, stop, slotWidth));
//         });
//     });
//     return haveStartStop;
// }

// /**
//  * Determine how the files will be gathered and processed.
//  * @param {object} options parsed command-line options.
//  * @param {object} startStop boundaries of 'interesting' log events.
//  */
// function getFileOptions(options, startStop) {
//     const fileOptions = {
//         accounts    : [],
//         domains     : [],
//         domlogs     : false,
//         files       : options['--file'].value || [],
//         directories : options['--directory'].value || [],
//         main        : panels.hasMainLog() && options['--main'].isSet,
//         panel       : panels.hasPanelLog() && options['--panel'].isSet,
//         start       : startStop.start,
//         stop        : startStop.stop
//     };
//     if (panels.hasAccounts()) {
//         fileOptions.accounts = options['--account'].value || [];
//     }
//     fileOptions.archives = panels.hasArchives() && options['--archive'].isSet;
//     if (panels.hasDomains()) {
//         fileOptions.domains = options['--domain'].value || [];
//         fileOptions.domlogs = options['--domlogs'].isSet;
//     }
//     if (options['--alllogs'] && options['--alllogs'].isSet) {
//         fileOptions.domlogs = fileOptions.main = fileOptions.panel = true;
//     }
//     if (options.filename.value) {
//         fileOptions.files = fileOptions.files.concat(options.filename.value);
//     }
//     return fileOptions;
// }

// /**
//  * Process files according to the given command-line arguments.
//  * @param {object} args command-line parser.
//  * @param {Array} errors array of errors.
//  * @param {object} options parsed command-line.
//  */
// async function processFiles(args, errors, options): Promise<void> {
//     const d = when.defer();
//     if (errors) {
//         args.printUsage(errors);
//         d.resolve(2);
//     } else if (options['--help'].isSet) {
//         args.printHelp();
//         d.resolve(0);
//     } else {
//         const verboseLevel = getVerboseLevel(options);
//         if (options['--version'].isSet) {
//             args.printVersion(VERSION, (verboseLevel > 1));
//             d.resolve(0);
//         } else {
//             const debug = options['--debug'].isSet;
//             const category = options['--category'].value;
//             const reporter = getReporter(options, debug, verboseLevel, category);
//             const getItem = getGetItem(options, category);
//             const agentDB = getAgentDB(options, category);
//             setupRecognizer(options);
//             const report = (ticks) => {
//                 reporter.report(ticks);
//                 d.resolve(0);
//             };
//             const reportError = (error) => {
//                 reporter.reportError(error);
//                 d.resolve(1);
//             };
//             const haveStartStop = getStartStop(options, reporter.slotWidth);
//             haveStartStop.promise.then((startStop) => {
//                 if (startStop.errors) {
//                     startStop.errors.forEach((error) => reportError(error));
//                     d.resolve(2);
//                 } else {
//                     reporter.start = startStop.start;
//                     reporter.stop = startStop.stop;
//                     const fileOptions = getFileOptions(options, startStop);
//                     const fileScanner = (files) => scanFiles(files, startStop.start, startStop.stop, reporter.keepOutside, getItem, agentDB);
//                     const files = panels.findScanFiles(fileOptions);
//                     files
//                         .then(fileScanner)
//                         .then(flattenAndSort)
//                         .then(report, reportError);
//                 }
//             });
//         }
//     }
//     return d.promise;
// }

// // -------------------------------------------------------------------------
// /**
//  * Singleton object for Application.
//  * main is the only useful entry point.
//  * Other functions are exposed to simplify unit tests.
//  */
// const alscan = {
//     validateTime : validateTime,

//     initializeArgs : initializeArgs,

//     scanStream: scanStream,

//     scanFile : scanFile,

//     scanFiles : scanFiles,

//     flattenAndSort : flattenAndSort,

//     getVerboseLevel : getVerboseLevel,

//     getReporter : getReporter,

//     getGetItem: getGetItem,

//     getAgentDB: getAgentDB,

//     setupRecognizer : setupRecognizer,

//     getStartStop: getStartStop,

//     getFileOptions: getFileOptions,

//     processFiles: processFiles,

//     /**
//      * Command-line entry point.
//      * @param {Array} command-line arguments.
//      */
//     main: function (argv) {

//         panels.load();

//         const args = initializeArgs(argvParser, panels.hasAccounts(), panels.hasArchives(), panels.hasDomains(), panels.hasMainLog(), panels.hasPanelLog());

//         const callback = (errors, options) => {
//             processFiles(args, errors, options).then((code) => {
//                 process.exitCode = code;
//             });
//         };

//         args.parse(argv.slice(2), callback);
//     },

// };


interface CliOptions {
    // General Options
    quiet: Option;
    verbose: Option;

    // Category Options
    agents: Option;
    category: Option;
    codes: Option;
    domains: Option;
    groups: Option;
    ips: Option;
    methods: Option;
    protocols: Option;
    referers: Option;
    requests: Option;
    sources: Option;
    urls: Option;
    users: Option;

    // Time Options
    days: Option;
    hours: Option;
    minutes: Option;
    one: Option;
    outside: Option;
    reboot: Option;
    start: Option;
    stop: Option;
    timeSlot: Option;

    // Report Format Options
    deny: Option;
    downtime: Option;
    fieldSep: Option;
    request: Option;
    sort: Option;
    terse: Option;
    top: Option;

    // Search Options
    account: Option;
    agent: Option;
    alllogs: Option;
    archive: Option;
    code: Option;
    directory: Option;
    domain: Option;
    domlogs: Option;
    file: Option;
    group: Option;
    ip: Option;
    main: Option;
    matchAgent: Option;
    matchReferer: Option;
    matchUrl: Option;
    method: Option;
    panel: Option;
    referer: Option;
    source: Option;
    url: Option;

    // Feedback (deprecated) Options
    feedbackType: Option;
    feedbackUrl: Option;
}

const fullCategoryList: Array<string> = [
        'agents',
        'category',
        'codes',
        'domains',
        'groups',
        'ips',
        'methods',
        'protocols',
        'requests',
        'sources',
        'urls',
        'users'
];

function categoryList(hasDomains: boolean): Array<string> {
    if (hasDomains) {
        return fullCategoryList.filter((n) => n != 'category');
    }
    return fullCategoryList.filter((n) => (n != 'category') && (n != 'domains'));
}

function otherCategories(me: string): Array<string> {
    return fullCategoryList.filter((n) => n != me);
}

const fullTimeSlotList: Array<string> = [
    'days',
    'hours',
    'minutes',
    'one',
    'timeSlot',
];

function otherTimeSlots(me: string): Array<string> {
    return fullTimeSlotList.filter((n) => n != me);
}

const fullReportList: Array<string> = [
    'deny',
    'downtime',
    'request',
    'terse',
];

function otherReports(me: string): Array<string> {
    return fullReportList.filter((n) => n != me);
}

function collectValues(value: string, previous: Array<string>): Array<string> {
    return previous.concat([value]);
}

/**
 * all options get defined here. they are added to specific commands when necessary.
 */
export function cliOptions(hasDomains: boolean): CliOptions {

    return {
        // General Options
        verbose: new Option('--verbose', 'Increase information provided').conflicts('quiet'),
        quiet: new Option('--quiet', 'Do not provide progress information').conflicts('verbose'),

        // Category Options
        agents: new Option('--agents', 'User-agent strings').conflicts(otherCategories('agents')),
        category: new Option('--category <name>', 'select category').choices(categoryList(hasDomains)).conflicts(otherCategories('category')),
        codes: new Option('--codes', 'HTTP result code').conflicts(otherCategories('codes')),
        domains: new Option('--domains', 'domains').conflicts(otherCategories('domains')),
        groups: new Option('--groups', '(deprecated) User-agent groups').conflicts(otherCategories('groups')),
        ips: new Option('--ips', 'IP address').conflicts(otherCategories('ips')),
        methods: new Option('--methods', 'HTTP method').conflicts(otherCategories('methods')),
        protocols: new Option('--protocols', 'Protocol used').conflicts(otherCategories('protocols')),
        referers: new Option('--referers', 'Referer').conflicts(otherCategories('referer')),
        requests: new Option('--requests', 'Request line').conflicts(otherCategories('requests')),
        sources: new Option('--sources', '(deprecated) User-agent sources').conflicts(otherCategories('sources')),
        urls: new Option('--urls, --uris', 'URI').conflicts(otherCategories('urls')),
        users: new Option('--users', 'Authenticated users').conflicts(otherCategories('users')),

        // Time Options
        days: new Option('--days', '24 hour time slots').conflicts(otherTimeSlots('days')),
        hours: new Option('--hours', 'sixty minute time slots').conflicts(otherTimeSlots('hours')),
        minutes: new Option('--minutes', 'sixty second time slots').conflicts(otherTimeSlots('minutes')),
        one: new Option('-1, --one', 'only a single time slot').conflicts([...otherTimeSlots('one'), 'outside']),
        outside: new Option('--outside', 'include data for before and after time slots').conflicts('one'),
        reboot: new Option('--reboot', 'same as --start=reboot').conflicts('start'),
        start: new Option('--start <date-time>', 'define when to start the report').argParser(validateTime).conflicts('reboot'),
        stop: new Option('--stop <date-time>', 'define when to end the report').argParser(validateTime),
        timeSlot: new Option('--time-slot <seconds>', 'arbitrary number of seconds time slots').conflicts(otherTimeSlots('timeSlot')),

        // Report Format Options
        deny: new Option('--deny', 'report is a list of deny directives').conflicts(otherReports('deny')),
        downtime: new Option('--downtime', '').conflicts(otherReports('downtime')),
        fieldSep: new Option('-F, --fs <sep>', 'define the field separator for a terse report').implies({terse: true}).default('|'),
        request: new Option('--request', 'grep-like match of requests').conflicts(otherReports('request')),
        sort: new Option('--sort <by>', 'how to sort records').choices([
            'bandwidth',
            'count',
            'item',
            'peak-bandwidth',
            'title',
        ]).default('count'),
        terse: new Option('-t, --terse', 'computer friendly single-line per record format').conflicts(otherReports('terse')),
        top: new Option('--top <number>', 'Maximum number of items to report'),

        // Search Options
        agent: new Option('--agent, --user-agent <name>', ' Match exact user-agent string'),
        code: new Option('--code <value>', 'Match HTTP status code'),
        group: new Option('--group <name>', '(deprecated) Match User-agent group name'),
        ip: new Option('--ip <addr>', 'Match request IP address'),
        matchAgent: new Option('--match-agent, --match-user-agent <regexp>', 'Match user-agent regular expression'),
        matchReferer: new Option('--match-referer, --match-referrer <regexp>', 'Match referer regular expression'),
        matchUrl: new Option('--match-url, --match-uri <regexp>', 'Match URL regular expression'),
        method: new Option('--method <name>', 'Match request method name'),
        referer: new Option('--referer <referer>', 'Match exact referer string'),
        source: new Option('--source <name>', '(deprecated) Match User-agent source name'),
        url: new Option('--url, --uri <url>', 'Match exact URL string'),

        // Log Selection Options
        account: new Option('--account <name>', 'Scan logs for named account').argParser(collectValues).default([]),
        alllogs: new Option('--alllogs', 'Scan all known access logs (vhosts, main, panel)'),
        archive: new Option('--archive', 'Include archived logs'),
        directory: new Option('--directory, --dir <name>', 'Scan access logs in directory').argParser(collectValues).default([]),
        domain: new Option('--domain <name>', 'Scan log of named domain'),
        domlogs: new Option('--domlogs, --vhosts', 'Scan all vhost access logs'),
        file: new Option('--file <name>', 'Scan log file').argParser(collectValues).default([]),
        main: new Option('--main', 'Scan default (no vhost) access log'),
        panel: new Option('--panel', 'Scan panel access log'),

        // Feedback (deprecated) Options
        feedbackType: new Option('--feedback-type <name>', 'ignored option').hideHelp(),
        feedbackUrl: new Option('--feedback-url <url>', 'ignored option').hideHelp(),
    };
}



async function run(names: Array<string>, options: any, command: Command<[Array<string>], {}, {}>): Promise<void> {
    console.log('in run');
    console.log({names});
}

export async function main(): Promise<number> {
    const panels = new Panels();
    await panels.load();

    // console.log(`has accounts:  ${panels.hasAccounts()}`);
    // console.log(`has archives:  ${panels.hasArchives()}`);
    // console.log(`has domains:   ${panels.hasDomains()}`);
    // console.log(`has main log:  ${panels.hasMainLog()}`);
    // console.log(`has panel log: ${panels.hasPanelLog()}`);

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
    const cli = new Command()
        .description(`alscan - ${packageJson.description}`)
        .optionsGroup('General Options')
        .helpOption('-h, --help')
        .version(packageJson.version)
        .addOption(options.quiet)
        .addOption(options.verbose)
        .optionsGroup('Report Category Options')
        .addOption(options.category)
        .addOption(options.groups)
        .addOption(options.sources)
        .addOption(options.agents)
        .addOption(options.urls)
        .addOption(options.codes)
        .addOption(options.referers)
        .addOption(options.domains)
        .addOption(options.methods)
        .addOption(options.requests)
        .addOption(options.protocols)
        .addOption(options.users)
        .addOption(options.ips)
        .optionsGroup('Time Options')
        .addOption(options.reboot)
        .addOption(options.start)
        .addOption(options.stop)
        .optionsGroup('Time Slot Options')
        .addOption(options.timeSlot)
        .addOption(options.minutes)
        .addOption(options.hours)
        .addOption(options.days)
        .addOption(options.one)
        .optionsGroup('Access Log Options')
        .addOption(options.file)
        .addOption(options.directory)
        .addOption(options.account)
        .addOption(options.archive)
        .addOption(options.domain)
        .addOption(options.domlogs)
        .addOption(options.main)
        .addOption(options.panel)
        .addOption(options.alllogs)
        .optionsGroup('Report Format Options')
        .addOption(options.deny)
        .addOption(options.downtime)
        .addOption(options.request)
        .addOption(options.terse)
        .addOption(options.fieldSep)
        .addOption(options.sort)
        .addOption(options.outside)
        .optionsGroup('Search Options')
        .addOption(options.agent)
        .addOption(options.matchAgent)
        .addOption(options.code)
        .addOption(options.group)
        .addOption(options.ip)
        .addOption(options.method)
        .addOption(options.referer)
        .addOption(options.matchReferer)
        .addOption(options.source)
        .addOption(options.url)
        .addOption(options.matchUrl)
        .argument('[name...]', 'optional list of files to scan')
        .action(run)
        .addHelpText('afterAll', `

For more information, please visit:
    ${packageJson.homepage}

To report problems, use:
    ${packageJson.bugs.url}
`);

    await cli.parseAsync();

    return 0;
}


if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        const exitCode = await main();
        process.exit(exitCode);
    } catch (e) {
        console.error(`Exception: ${e}`);
        process.exit(86);
    }
}
