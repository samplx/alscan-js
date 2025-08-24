/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2018, 2025 James Burlingame
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
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// // enable JavaScript strict mode.
// 'use strict';

// // module imports
// //const testData = require('../test/testData.js');

// const alscan = require('../lib/alscan.js');
// const argvParser = require('samplx-argv-parser');
// const recognizer = require('../lib/recognizer.js');

describe('alscan', async () => {

});

// describe('alscan', () => {
//     describe('initial conditions', () => {
//         test.each([
//             'validateTime',
//             'initializeArgs',
//             'scanFile',
//             'scanFiles',
//             'scanStream',
//             'flattenAndSort',
//             'main'
//         ])('%s is defined', (field) => {
//             expect(alscan[field]).toBeDefined();
//         });
//     });

//     describe('initializeArgs', () => {
//         function optionExists(args, name) {
//             return args.options.some(opt => Array.isArray(opt.options) && opt.options.some(option => option === name));
//         }
//         test.each([
//             // name,        hasAccounts, hasArchives, hasDomains, hasMainLog, hasPanelLog
//             ['--help',      false,       false,       false,      false,      false ],
//             ['-h',          false,       false,       false,      false,      false ],
//             ['--debug',     false,       false,       false,      false,      false ],
//             ['--version',   false,       false,       false,      false,      false ],
//             ['-V',          false,       false,       false,      false,      false ],
//             ['--verbose',   false,       false,       false,      false,      false ],
//             ['-v',          false,       false,       false,      false,      false ],
//             ['--account',   true,        false,       false,      false,      false ],
//             ['--alllogs',   true,        false,       false,      false,      false ],
//             ['--archive',   false,       true,        false,      false,      false ],
//             ['--domain',    false,       false,       true,       false,      false ],
//             ['--domlogs',   false,       false,       true,       false,      false ],
//             ['--vhosts',    false,       false,       true,       false,      false ],
//             ['--alllogs',   false,       false,       true,       false,      false ],
//             ['--main',      false,       false,       false,      true,       false ],
//             ['--alllogs',   false,       false,       false,      true,       false ],
//             ['--panel',     false,       false,       false,      false,      true ],
//             ['--alllogs',   false,       false,       false,      false,      true ],
//         ])('option %s is defined', (name, hasAccounts, hasArchives, hasDomains, hasMainLog, hasPanelLog) => {
//             const args = alscan.initializeArgs(argvParser, hasAccounts, hasArchives, hasDomains, hasMainLog, hasPanelLog);
//             expect(args.options).toBeDefined();
//             expect(Array.isArray(args.options)).toBeTruthy();
//             // console.dir(args.options);
//             expect(optionExists(args, name)).toBeTruthy();
//         });

//         test.each([
//             // name,        hasAccounts, hasArchives, hasDomains, hasMainLog, hasPanelLog
//             ['--domain',    false,       false,       false,      false,      false ],
//             ['--domlogs',   false,       false,       false,      false,      false ],
//             ['--vhosts',    false,       false,       false,      false,      false ],
//             ['--main',      false,       false,       false,      false,      false ],
//             ['--panel',     false,       false,       false,      false,      false ],
//             ['--alllogs',   false,       false,       false,      false,      false ],
//             ['--account',   false,       false,       false,      false,      false ],
//             ['--archive',   false,       false,       false,      false,      false ],
//         ])('option %s is NOT defined', (name, hasAccounts, hasArchives, hasDomains, hasMainLog, hasPanelLog) => {
//             const args = alscan.initializeArgs(argvParser, hasAccounts, hasArchives, hasDomains, hasMainLog, hasPanelLog);
//             expect(args.options).toBeDefined();
//             expect(Array.isArray(args.options)).toBeTruthy();
//             expect(optionExists(args, name)).toBeFalsy();
//         });

//         test('--time-slot handles Infinity', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--time-slot', 'Infinity'], (errors, options) => {
//                 expect(options).toBeDefined();
//                 expect(options['--time-slot']).toBeDefined();
//                 expect(options['--time-slot'].value).toBe(Infinity);
//                 done();
//             });
//         });

//         test('--time-slot handles an integer', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--time-slot', '3600'], (errors, options) => {
//                 expect(options).toBeDefined();
//                 expect(options['--time-slot']).toBeDefined();
//                 expect(options['--time-slot'].value).toBe(3600);
//                 done();
//             });
//         });

//         test('--top handles Infinity', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--top', 'Infinity'], (errors, options) => {
//                 expect(options).toBeDefined();
//                 expect(options['--top']).toBeDefined();
//                 expect(options['--top'].value).toBe(Infinity);
//                 done();
//             });
//         });

//         test('--top handles an integer', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--top', '24'], (errors, options) => {
//                 expect(options).toBeDefined();
//                 expect(options['--top']).toBeDefined();
//                 expect(options['--top'].value).toBe(24);
//                 done();
//             });
//         });

//         test('--ip handles argument', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--ip=127.0.0.1'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 expect(options['--ip']).toBeDefined();
//                 expect(options['--ip'].value[0]).toEqual('127.0.0.1');
//                 done();
//             });
//         });
//     });

//     describe('validateTime', () => {
//         function checkValue(opt) {
//             return function() {
//                 const func = alscan.validateTime();
//                 func(opt);
//             };
//         }
//         test('no value set', () => {
//             expect(checkValue({})).not.toThrow();
//         });
//         test('reboot is valid', () => {
//             expect(checkValue({ value: 'reboot' })).not.toThrow();
//         });
//         test('a valid partial date', () => {
//             expect(checkValue({ value: '2010/01/02' })).not.toThrow();
//         });
//         test('error throws', () => {
//             expect(checkValue({ value: 'nonesuch' })).toThrow();
//         });
//     });

//     describe('getVerboseLevel', () => {
//         test('no args sets default level', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 const level = alscan.getVerboseLevel(options);
//                 expect(level).toBe(1);
//                 done();
//             });
//         });

//         test('--terse set zero', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--quiet'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 const level = alscan.getVerboseLevel(options);
//                 expect(level).toBe(0);
//                 done();
//             });
//         });

//         test('--verbose once set two', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--verbose'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 const level = alscan.getVerboseLevel(options);
//                 expect(level).toBe(2);
//                 done();
//             });
//         });

//         test('--verbose twice sets 3', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--verbose', '--verbose'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 const level = alscan.getVerboseLevel(options);
//                 expect(level).toBe(3);
//                 done();
//             });
//         });
//     });

//     describe('getReporter', () => {
//         test('deny', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--deny'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 expect(options['--deny']).toBeDefined();
//                 expect(options['--deny'].isSet).toBeTruthy();
//                 const reporter = alscan.getReporter(options, false, 1);
//                 expect(reporter).toBeDefined();
//                 expect(reporter.id).toBe('deny');
//                 done();
//             });
//         });

//         test('downtime default slot-width', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--downtime'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 expect(options['--downtime']).toBeDefined();
//                 expect(options['--downtime'].isSet).toBeTruthy();
//                 const reporter = alscan.getReporter(options, false, 1);
//                 expect(reporter).toBeDefined();
//                 expect(reporter.id).toBe('downtime');
//                 expect(reporter.slotWidth).toBe(60);
//                 done();
//             });
//         });

//         test('downtime defined slot-width', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--downtime', '--time-slot', '3600'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 expect(options['--downtime']).toBeDefined();
//                 expect(options['--downtime'].isSet).toBeTruthy();
//                 const reporter = alscan.getReporter(options, false, 1);
//                 expect(reporter).toBeDefined();
//                 expect(reporter.id).toBe('downtime');
//                 expect(reporter.slotWidth).toBe(3600);
//                 done();
//             });
//         });

//         test('request', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--request'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 expect(options['--request']).toBeDefined();
//                 expect(options['--request'].isSet).toBeTruthy();
//                 const reporter = alscan.getReporter(options, false, 1);
//                 expect(reporter).toBeDefined();
//                 expect(reporter.id).toBe('request');
//                 done();
//             });
//         });

//         test('summary', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 const reporter = alscan.getReporter(options, false, 1);
//                 expect(reporter).toBeDefined();
//                 expect(reporter.id).toBe('summary');
//                 expect(reporter.terse).toBeFalsy();
//                 done();
//             });
//         });

//         test('summary --terse', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--terse'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 const reporter = alscan.getReporter(options, false, 1);
//                 expect(reporter).toBeDefined();
//                 expect(reporter.id).toBe('summary');
//                 expect(reporter.terse).toBeTruthy();
//                 expect(reporter.fieldSep).toBe(options['--fs'].value);
//                 done();
//             });
//         });

//         test('summary --fs', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--fs', '|'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 expect(options).toBeDefined();
//                 const reporter = alscan.getReporter(options, false, 1);
//                 expect(reporter).toBeDefined();
//                 expect(reporter.id).toBe('summary');
//                 expect(reporter.terse).toBeTruthy();
//                 expect(reporter.fieldSep).toBe(options['--fs'].value);
//                 done();
//             });
//         });
//     });

//     describe('setupCategory', () => {
//         beforeEach(() => {
//             alscan.agentDB = undefined;
//         });
//         const record = {
//             host: 'host',
//             line: 'line',
//             group: 'group',
//             source: 'source',
//             agent: 'agent',
//             uri: 'uri',
//             status: 'status',
//             referer: 'referer',
//             method: 'method',
//             request: 'request',
//             protocol: 'protocol',
//             user: 'user'
//         };
//         const domain = 'domain';
//         const commonChecks = (options, category, field, defined) => {
//             const getItem = alscan.getGetItem(options, category);
//             expect(getItem).toBeDefined();
//             expect(typeof getItem).toBe('function');
//             const result = getItem(record, domain);
//             expect(result).toBe(field);
//             const agentDB = alscan.getAgentDB(options, category);
//             if (defined) {
//                 expect(agentDB).toBeDefined();
//             } else {
//                 expect(agentDB).toBeUndefined();
//             }

//         };
//         test('invalid category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 const doit = () => alscan.getGetItem(options, 'nonesuch');
//                 expect(doit).toThrow();
//                 done();
//             });
//         });
//         test('invalid category, --deny option', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--deny'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'nonesuch', 'host', false);
//                 done();
//             });
//         });
//         test('invalid category, --downtime option', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--downtime'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'nonesuch', undefined, false);
//                 done();
//             });
//         });
//         test('invalid category, --request option', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse(['--request'], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'nonesuch', 'line', false);
//                 done();
//             });
//         });
//         test('groups category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'groups', 'group', true);
//                 done();
//             });
//         });
//         test('sources category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'sources', 'source', true);
//                 done();
//             });
//         });
//         test('user-agents category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'user-agents', 'agent', false);
//                 done();
//             });
//         });
//         test('agents category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'agents', 'agent', false);
//                 done();
//             });
//         });
//         test('uris category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'uris', 'uri', false);
//                 done();
//             });
//         });
//         test('urls category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'urls', 'uri', false);
//                 done();
//             });
//         });
//         test('codes category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'codes', 'status', false);
//                 done();
//             });
//         });
//         test('referers category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'referers', 'referer', false);
//                 done();
//             });
//         });
//         test('referrers category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'referrers', 'referer', false);
//                 done();
//             });
//         });
//         test('domains category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'domains', 'domain', false);
//                 done();
//             });
//         });
//         test('methods category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'methods', 'method', false);
//                 done();
//             });
//         });
//         test('requests category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'requests', 'request', false);
//                 done();
//             });
//         });
//         test('protocols category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'protocols', 'protocol', false);
//                 done();
//             });
//         });
//         test('users category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'users', 'user', false);
//                 done();
//             });
//         });
//         test('ips category', (done) => {
//             const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//             args.parse([], (errors, options) => {
//                 expect(errors).toBeNull();
//                 commonChecks(options, 'ips', 'host', false);
//                 done();
//             });
//         });
//     });

//     describe('setupRecognizer', () => {
//         beforeEach(() => {
//             recognizer.clear();
//         });
//         const cases = [
//             // description,             argv,                   record,                         expected
//             ['no argv, empty record',   [],                     {},                             true],
//             ['--agent=secret found',          ['--agent=secret'],     {agent:'secret'},               true],
//             ['--agent=secret not found',          ['--agent=secret'],     {agent:'open'},                 false],
//             ['--match-agent=s.* found',        ['--match-agent=s.*'],   {agent:'secret'},               true],
//             ['--match-agent=s.* not found',    ['--match-agent=s.*'],   {agent:'open'},                 false],
//             ['--code=200 found',        ['--code=200'],   {status:'200'},               true],
//             ['--code=200 not found',    ['--code=200'],   {status:'500'},                 false],
//             ['--ip=127.0.0.1 found', ['--ip=127.0.0.1'], {host: '127.0.0.1'}, true],
//             ['--ip=127.0.0.1 not found', ['--ip=127.0.0.1'], {host: '10.0.0.1'}, false],
//             ['--method=POST found', ['--method=POST'], {method: 'POST'}, true ],
//             ['--method=POST not found', ['--method=POST'], {method: 'GET'}, false ],
//             ['--referer=http://example.com found', ['--referer=http://example.com'], {referer: 'http://example.com'}, true ],
//             ['--referer=http://example.com not found', ['--referer=http://example.com'], {referer: '-'}, false ],
//             ['--match-referer=.*.com found', ['--match-referer=.*.com'], {referer: 'http://example.com'}, true ],
//             ['--match-referer=*.com not found', ['--match-referer=.*.com'], {referer: '-'}, false ],
//             ['--uri=http://example.com found', ['--uri=http://example.com'], {uri: 'http://example.com'}, true ],
//             ['--uri=http://example.com not found', ['--uri=http://example.com'], {uri: 'https://example.net'}, false ],
//             ['--match-uri=http://example.com/.* found', ['--match-uri=http://example.com/.*'], {uri: 'http://example.com/index.html'}, true ],
//             ['--match-uri=http://example.com/.* not found', ['--match-uri=http://example.com/.*'], {uri: 'https://example.net/index.html'}, false ],
//             ['--group=spider found', ['--group=spider'], {group: 'spider'}, true ],
//             ['--group=spider not found', ['--group=spider'], {group: 'unknown'}, false ],
//             ['--source=google found', ['--source=google'], {source: 'google'}, true ],
//             ['--source=google not found', ['--source=google'], {source: 'unknown'}, false ],
//         ];
//         cases.forEach((row) => {
//             const description = row[0];
//             const argv = row[1];
//             const record = row[2];
//             const expected = row[3];
//             test(description, (done) => {
//                 const args = alscan.initializeArgs(argvParser, false, false, false, false, false);
//                 args.parse(argv, (errors, options) => {
//                     expect(errors).toBeNull();
//                     alscan.setupRecognizer(options);
//                     const result = recognizer.matches(record);
//                     expect(result).toBe(expected);
//                     done();
//                 });
//             });
//         });
//     });

// });
