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

import * as fs from "node:fs";
import * as process from "node:process";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import type { Stream } from "node:stream";
import sortOn from "sort-on";
import { Command, InvalidArgumentError, Option } from "@commander-js/extra-typings";

import { AccessLogEntry } from "./accesslog.ts";
import { addIP, addPattern, addValue, addValueNC, matches } from "./recognizer.ts";
import type { AlscanOptions } from "./options.ts";
import { calculateStartStop, lastReboot, PartialDate } from "./datetime.ts";
import { DenyReport } from "./deny.ts";
import { DowntimeReport } from "./downtime.ts";
import { LineStream } from "./lines.ts";
import { Panels } from "./panels.ts";
import packageJson from "../package.json" with { type: 'json'};
import type { Reporter } from "./reporter.ts";
import { RequestReport } from "./request.ts";
import type { ScanFile } from "./scanfile.ts";
import { SummaryReport } from "./summary.ts";
import { Tick } from "./tick.ts";

/**
 * Return a validator function used to validate partial date parameters.
 */
function validateTime(value: string, _dummyPrevious: string): string {
    if ((value == 'reboot') || PartialDate.isValidFormat(value)) {
        return value;
    }
    throw new InvalidArgumentError(`${value} is not a valid date-time.`);
}

/**
 * Return a getItem function depending upon the options and category.
 * @param {object} options parsed options from command-line.
 * @param {string} category category of the requested report.
 */
export function getGetItem(
    options: Record<string, unknown>,
    category: string | undefined
): (record: AccessLogEntry, domain: string) => string | undefined {
    if (!!options['deny']) {
        return (record: AccessLogEntry, _domain: string) => record.host;
    }
    if (!!options['downtime']) {
        return (_record: AccessLogEntry) => undefined;
    }
    if (!!options['request']) {
        return (record: AccessLogEntry) => record.line;
    }
    if (category === 'groups') {
        return (record: AccessLogEntry, _domain: string) => record.group;
    }
    if (category === 'sources') {
        return (record: AccessLogEntry, _domain: string) => record.source;
    }
    if (category === 'agents') {
        return (record: AccessLogEntry, _domain: string) => record.agent;
    }
    if (category === 'urls') {
        return (record: AccessLogEntry, _domain: string) => record.uri;
    }
    if ((category === 'codes') || (category === undefined)) {
        return (record: AccessLogEntry, _domain: string) => record.status;
    }
    if (category === 'referers') {
        return (record: AccessLogEntry, _domain: string) => record.referer;
    }
    if (category === 'domains') {
        return (_record: AccessLogEntry, domain: string) => domain;
    }
    if (category === 'methods') {
        return (record: AccessLogEntry, _domain: string) => record.method;
    }
    if (category === 'requests') {
        return (record: AccessLogEntry, _domain: string) => record.request;
    }
    if (category === 'protocols') {
        return (record: AccessLogEntry, _domain: string) => record.protocol;
    }
    if (category === 'users') {
        return (record: AccessLogEntry, _domain: string) => record.user;
    }
    if (category === 'ips') {
        return (record: AccessLogEntry, _domain: string) => record.host;
    }
    throw new Error(`Unrecognized category: ${category}`);
}

/**
 * Setup a specific reporter based upon options, category, etc.
 * @param {object} options
 */
function reporterFactory(
    alscanOptions: AlscanOptions,
    options: Record<string, unknown>,
): Reporter {
    let reporter: Reporter;
    if (!!options['deny']) {
        reporter = new DenyReport();
    } else if (!!options['downtime']) {
        reporter = new DowntimeReport();
    } else if (!!options['request']) {
        reporter = new RequestReport();
    } else {
        const summaryReport = new SummaryReport();
        reporter = summaryReport;
        if (typeof options['fs'] === 'string') {
            summaryReport.fieldSep = options['fs']
        }
        summaryReport.keepOutside = !!alscanOptions.keepOutside;
        summaryReport.terse = !!options['terse'];
    }
    reporter.category = alscanOptions.category;
    if (typeof options['top'] === 'number') {
        reporter.limit = options['top'];
    }
    if (typeof options['sort'] === 'string') {
        reporter.order = options['sort'];
    }
    reporter.slotWidth = alscanOptions.timeSlot;
    reporter.start = alscanOptions.start;
    reporter.stop = alscanOptions.stop;
    return reporter;
}

/**
 * Add matchers to the recognizer based upon command-line options.
 * @param {object} options parsed command-line options.
 */
function setupRecognizer(options: Record<string, unknown>): void {
    if (Array.isArray(options['userAgent'])) {
        for (const value of options['userAgent']) {
            addValue('agent', value);
        }
    }
    if (Array.isArray(options['matchUserAgent'])) {
        for (const value of options['matchUserAgent']) {
            addPattern('agent', value);
        }
    }
    if (Array.isArray(options['code'])) {
        for (const value of options['code']) {
            addValue('status', value);
        }
    }
    if (Array.isArray(options['ip'])) {
        for (const value of options['ip']) {
            addIP(value);
        }
    }
    if (Array.isArray(options['method'])) {
        for (const value of options['method']) {
            addValueNC('method', value);
        }
    }
    if (Array.isArray(options['referer'])) {
        for (const value of options['referer']) {
            addValue('referer', value);
        }
    }
    if (Array.isArray(options['matchReferer'])) {
        for (const value of options['matchReferer']) {
            addPattern('referer', value);
        }
    }
    if (Array.isArray(options['url'])) {
        for (const value of options['url']) {
            addValue('uri', value);
        }
    }
    if (Array.isArray(options['matchUrl'])) {
        for (const value of options['matchUrl']) {
            addPattern('uri', value);
        }
    }
    if (Array.isArray(options['group'])) {
        for (const value of options['group']) {
            addValueNC('group', value);
        }
    }
    if (Array.isArray(options['source'])) {
        for (const value of options['source']) {
            addValueNC('source', value);
        }
    }
}

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
function scanStream(
    baseStream: Stream,
    isCompressed: boolean,
    domain: string,
    start: number,
    stop: number,
    keepOutside: boolean,
    getItem: (r: AccessLogEntry, d: string) => string | undefined,
): Promise<Array<Tick>> {
    const entry = new AccessLogEntry();
    const ticks: Array<Tick> = [];
    const inputStream = new LineStream({});

    return new Promise((resolve, reject) => {
        inputStream.on('data', function (chunk) {
            entry.parse(chunk);
            if (matches(entry) && entry.time) {
                if ((entry.time <= stop) && (entry.time >= start)) {
                    ticks.push(new Tick(entry.time, entry.size, getItem(entry, domain)));
                } else if (keepOutside) {
                    ticks.push(new Tick(entry.time, entry.size, undefined));
                }
            }
        });

        inputStream.on('end', function () {
            resolve(ticks);
        });

        inputStream.on('error', function (err) {
            reject(err);
        });

        if (isCompressed) {
            baseStream.pipe(createGunzip()).pipe(inputStream);
        } else {
            baseStream.pipe(inputStream);
        }

    });
}

/**
 * Process the contents of a single log file.
 * @param {ScanFile} file information about the log file.
 * @param {Date} start when a log entry becomes 'interesting'.
 * @param {Date} stop when a log entry is no longer 'interesting'.
 * @param {boolean} keepOutside process log entries before start and after stop.
 * @param {function} getItem function to call to extract information from a record.
 */
async function scanFile(
    file: ScanFile,
    start: Date,
    stop: Date,
    keepOutside: boolean,
    getItem: (r: AccessLogEntry, d: string) => string | undefined,
): Promise<Array<Tick>> {
    const baseStream = fs.createReadStream(file.pathname);
    return await scanStream(baseStream,
            file.isCompressed(), file.domain ?? '',
                start.getTime(), stop.getTime(),
                    keepOutside, getItem);
}

/**
 * Process the contents of a group of log files.
 * @param {Array} files array of ScanFile entires.
 * @param {Date} start when a log entry becomes 'interesting'.
 * @param {Date} stop when a log entry is no longer 'interesting'.
 * @param {boolean} keepOutside process log entries before start and after stop.
 * @param {function} getItem function to call to extract information from a log record.
 * @param {object} agentDB used to lookup a user-agents group and source.
 */
export async function scanFiles(
    files: Array<ScanFile>,
    start: Date,
    stop: Date,
    keepOutside: boolean,
    getItem: (r: AccessLogEntry, d: string) => string | undefined,
    verbose: boolean
): Promise<Array<Tick>> {
    const ticks: Array<Tick> = [];
    let width =10;
    for (const file of files) {
        if (width < file.filename.length) {
            width = file.filename.length;
        }
    }
    width += 2;
    if (verbose) {
        console.log(`  filename${' '.repeat(width-8)}    count`);
        console.log(`${'-'.repeat(width)}   --------`);
    }
    for (const file of files) {
        const each = await scanFile(file, start, stop, keepOutside, getItem);
        if (verbose) {
            let line: string;
            const spaces = ' '.repeat(width - file.filename.length);
            line = `> ${file.filename}${spaces} ${each.length.toString().padStart(8)}`;
            console.log(line);
        }
        ticks.push(...each);
    }
    if (verbose) {
        console.log('\n'.repeat(5));
    }
    return sortOn(ticks, 'time');
}

/**
 * Determine which category to use.
 * @param options command-line options.
 * @returns category associated with the options.
 */
function determineCategory(options: Record<string, unknown>): string {
    if (typeof options['category'] === 'string') {
        return options['category'];
    }
    if (!!options['agents']) {
        return 'agents';
    }
    if (!!options['codes']) {
        return 'codes';
    }
    if (!!options['domains']) {
        return 'domains';
    }
    if (!!options['groups']) {
        return 'groups';
    }
    if (!!options['ips']) {
        return 'ips';
    }
    if (!!options['methods']) {
        return 'methods';
    }
    if (!!options['protocols']) {
        return 'protocols';
    }
    if (!!options['requests']) {
        return 'requests';
    }
    if (!!options['sources']) {
        return 'sources';
    }
    if (!!options['urls']) {
        return 'urls';
    }
    if (!!options['users']) {
        return 'users';
    }
    return 'codes';
}

/**
 * All of the command-line options.
 */
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

/**
 * list of all of the categories used to prevent conflicting options.
 */
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

/**
 * Determine which category values are available.
 * @param hasDomains flag that indicates if per domain data is available.
 * @returns list of potential categories, for the usage message.
 */
function categoryList(hasDomains: boolean): Array<string> {
    if (hasDomains) {
        return fullCategoryList.filter((n) => n != 'category');
    }
    return fullCategoryList.filter((n) => (n != 'category') && (n != 'domains'));
}

/**
 * Determine which other categories would conflict with this setting.
 * @param me option category being configured.
 * @returns list of all of the other categories. used for conflicts()
 */
function otherCategories(me: string): Array<string> {
    return fullCategoryList.filter((n) => n != me);
}

/**
 * List of all of the time slot options.
 */
const fullTimeSlotList: Array<string> = [
    'days',
    'hours',
    'minutes',
    'one',
    'timeSlot',
];

/**
 * Determine which other time slot options would conflict with this setting.
 * @param me option which is being configured.
 * @returns list of other option names. for conflicts().
 */
function otherTimeSlots(me: string): Array<string> {
    return fullTimeSlotList.filter((n) => n != me);
}

/**
 * list of all of the reports.
 */
const fullReportList: Array<string> = [
    'deny',
    'downtime',
    'request',
    'terse',
];

/**
 * Determine which other report options would conflict with this setting.
 * @param me option which is being configured.
 * @returns list of other report names. for conflicts().
 */
function otherReports(me: string): Array<string> {
    return fullReportList.filter((n) => n != me);
}


/**
 * Command-line parser that collects zero or more string values.
 * @param value command-line option value.
 * @param previous prior value.
 * @returns new value containing previous and the new item.
 */
function collectValues(value: string, previous: Array<string>): Array<string> {
    return previous.concat([value]);
}

/**
 * Command-line parser for a time-slot (value is a positive integer number of seconds)
 * @param value command-line option value.
 * @param _previous prior value (ignored)
 * @returns parsed value.
 */
function parseTimeSlot(value: string, _previous: number): number {
    const n = parseInt(value);
    if (isNaN(n) || (n < 1)) {
        throw new InvalidArgumentError(`value must be a positive integer (Seconds)`);
    }
    return n;
}

/**
 * Command-line parser for a top value (positive integer)
 * @param value command-line option value.
 * @param _previous prior value (ignored)
 * @returns parse value.
 */
function parseTop(value: string, _previous: number): number {
    const n = parseInt(value);
    if (isNaN(n) || (n < 1)) {
        throw new InvalidArgumentError(`value must be a positive integer`);
    }
    return n;
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
        urls: new Option('--uris, --urls', 'URI').conflicts(otherCategories('urls')),
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
        timeSlot: new Option('--time-slot <seconds>', 'arbitrary number of seconds time slots').conflicts(otherTimeSlots('timeSlot')).argParser(parseTimeSlot).default(3600),

        // Report Format Options
        deny: new Option('--deny', 'report is a list of deny directives').conflicts(otherReports('deny')),
        downtime: new Option('--downtime', 'enable downtime report').conflicts(otherReports('downtime')),
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
        top: new Option('--top <number>', 'Maximum number of items to report').argParser(parseTop).default(Infinity),

        // Search Options
        agent: new Option('--agent, --user-agent <name>', 'Match exact user-agent string').argParser(collectValues).default([], 'none'),
        code: new Option('--code <value>', 'Match HTTP status code').argParser(collectValues).default([], 'none'),
        group: new Option('--group <name>', '(deprecated) Match User-agent group name').argParser(collectValues).default([], 'none'),
        ip: new Option('--ip <addr>', 'Match request IP address').argParser(collectValues).default([], 'none'),
        matchAgent: new Option('--match-agent, --match-user-agent <regexp>', 'Match user-agent regular expression').argParser(collectValues).default([], 'none'),
        matchReferer: new Option('--match-referrer, --match-referer <regexp>', 'Match referer regular expression').argParser(collectValues).default([], 'none'),
        matchUrl: new Option('--match-uri, --match-url <regexp>', 'Match URL regular expression').argParser(collectValues).default([], 'none'),
        method: new Option('--method <name>', 'Match request method name').argParser(collectValues).default([], 'none'),
        referer: new Option('--referer <referer>', 'Match exact referer string').argParser(collectValues).default([], 'none'),
        source: new Option('--source <name>', '(deprecated) Match User-agent source name').argParser(collectValues).default([], 'none'),
        url: new Option('--uri, --url <url>', 'Match exact URL string').argParser(collectValues).default([], 'none'),

        // Log Selection Options
        account: new Option('--account <name>', 'Scan logs for named account').argParser(collectValues).default([]),
        alllogs: new Option('--alllogs', 'Scan all known access logs (vhosts, main, panel)'),
        archive: new Option('--archive', 'Include archived logs'),
        directory: new Option('--dir, --directory <name>', 'Scan access logs in directory').argParser(collectValues).default([]),
        domain: new Option('--domain <name>', 'Scan log of named domain').argParser(collectValues).default([]),
        domlogs: new Option('--domlogs, --vhosts', 'Scan all vhost access logs'),
        file: new Option('--file <name>', 'Scan log file').argParser(collectValues).default([]),
        main: new Option('--main', 'Scan default (no vhost) access log'),
        panel: new Option('--panel', 'Scan panel access log'),

        // Feedback (deprecated) Options
        feedbackType: new Option('--feedback-type <name>', 'ignored option').hideHelp(),
        feedbackUrl: new Option('--feedback-url <url>', 'ignored option').hideHelp(),
    };
}

/**
 * Interface to the control panels (if any.)
 */
const panels = new Panels();

/**
 * Create a command-line parser.
 * @returns Commander command-line parser.
 */
export function createParser(): Command<[Array<string>], {}, {}> {
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
        .addOption(options.top)
        .addOption(options.outside)
        .optionsGroup('Search Options')
        .addOption(options.agent)
        .addOption(options.matchAgent)
        .addOption(options.code)
        .addOption(options.ip)
        .addOption(options.method)
        .addOption(options.referer)
        .addOption(options.matchReferer)
        .addOption(options.url)
        .addOption(options.matchUrl)
        .addOption(options.group)
        .addOption(options.source)
        .argument('[name...]', 'optional list of files to scan')
        .addHelpText('afterAll', `

For more information, please visit:
    ${packageJson.homepage}

To report problems, use:
    ${packageJson.bugs.url}
`);

    return cli;
}

/**
 *
 * @param names command-line arguments. file names to be processed.
 * @param options command-line options.
 * @returns refined option information.
 */
export async function gatherAlscanOptions(
    names: Array<string>,
    options: Record<string, unknown>,
): Promise<AlscanOptions> {
    const panelOptions: AlscanOptions = {
        alllogs: panels.hasMainLog() && !!options['alllogs'],
        archive: panels.hasArchives() && !!options['archive'],
        domlogs: panels.hasMainLog() && !!options['domlogs'],
        files: names,
        keepOutside: !!options['outside'],
        main: panels.hasMainLog() && !!options['main'],
        panel: panels.hasPanelLog() && !!options['panel'],
    };
    if (panels.hasAccounts() &&
        ('account' in options) &&
        (Array.isArray(options['account']))) {
        panelOptions.accounts = options['account'];
    }
    if (panels.hasDomains() &&
        ('directory' in options) &&
        (Array.isArray(options['directory']))) {
        panelOptions.directories = options['directory'];
    }
    if (panels.hasDomains() &&
        ('domain' in options) &&
        (Array.isArray(options['domain']))) {
        panelOptions.domains = options['domain'];
    }
    if (('file' in options) &&
        (Array.isArray(options['file']))) {
        if (!panelOptions.files) {
            panelOptions.files = [];
        }
        panelOptions.files.push(...options['file']);
    }
    let partialStart = new PartialDate();
    if (!!options['reboot']) {
        partialStart = await lastReboot();
    } else if (typeof options['start'] === 'string') {
        const setting = options['start'];
        if (setting === 'reboot') {
            partialStart = await lastReboot();
        } else {
            partialStart.parse(options['start'], true);
        }
    }
    let partialStop = new PartialDate();
    if (typeof options['stop'] === 'string') {
        partialStop.parse(options['stop'], false);
    }
    if (!!options['one']) {
        panelOptions.timeSlot = Infinity;
    } else if (!!options['days']) {
        panelOptions.timeSlot = 24 * 60 * 60;
    } else if (!!options['hours']) {
        panelOptions.timeSlot = 60 * 60;
    } else if (!!options['minutes']) {
        panelOptions.timeSlot = 60;
    } else if (typeof options['timeSlot'] === 'number') {
        panelOptions.timeSlot = options['timeSlot'];
    } else if (!!options['downtime']) {
        // downtime report defaults to one minute time slot
        panelOptions.timeSlot = 60;
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

/**
 * Execute the pipeline.
 * @param names command-line arguments.
 * @param options command-line options.
 * @param _command actual command.
 * @returns promise resolves to a void.
 */
async function run(
    names: Array<string>,
    options: Record<string, unknown>,
    _command: Command<[Array<string>], {}, {}>
): Promise<void> {
    const alscanOptions = await gatherAlscanOptions(names, options);
    if (!!alscanOptions.error || !alscanOptions.start || !alscanOptions.stop) {
        console.error(`Sorry, unable to continue.`);
        return;
    }
    setupRecognizer(options);
    const files = await panels.findScanFiles(alscanOptions);
    //console.log({names, options, alscanOptions, files});

    if (files.length === 0) {
        console.error(`No files to scan.`);
        return;
    }
    if (!options['quiet']) {
        console.log(`Total number of files to scan: ${files.length}`);
    }
    const getItem = getGetItem(options, alscanOptions.category)
    const reporter = reporterFactory(alscanOptions, options);
    const verbose = !!options['verbose'];
    const ticks = await scanFiles(files,
        alscanOptions.start, alscanOptions.stop, !!alscanOptions.keepOutside,
        getItem, verbose);
    await reporter.report(ticks);
}

/**
 * Main program entry-point.
 * @returns 0
 */
export async function main(): Promise<number> {
    await panels.load();

    const cli = createParser().action(run);

    await cli.parseAsync();

    return 0;
}

// code to execute the main() program is the file is invoked.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        const exitCode = await main();
        process.exit(exitCode);
    } catch (e) {
        console.error(`Exception: ${e}`);
        process.exit(86);
    }
}
