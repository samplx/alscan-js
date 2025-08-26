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
import * as path from "node:path";
import type { Command } from "@commander-js/extra-typings";

import { AccessLogEntry } from "../lib/accesslog.ts";
import { createParser, gatherAlscanOptions, getGetItem, scanFiles } from "../lib/alscan.ts";
import { setRootDirectory, ScanFile } from "../lib/scanfile.ts";
import { getDataDirectory } from "../test/testData.ts";
import { Tick } from "../lib/tick.ts";
import type { AlscanOptions } from "../lib/options.ts";
import { Panels } from "../lib/panels.ts";

type EnvironmentType = 'core' | 'cpanel' | 'cpanelUser';

interface ParserTestCase {
    title: string;
    argv: Array<string>;
    expected: {
        throws?: boolean | undefined;
        names?: Array<string> | undefined;
        options?: Record<string, unknown> | undefined;
        stderr?: string | undefined;
        stdout?: string | undefined;
    }
}

interface GetGetItemTestCase {
    title: string;
    options: Record<string, unknown>;
    category?: string | undefined;
    expected?: string | undefined;
}

interface GatherTestCase {
    title: string;
    names: Array<string>;
    options: Record<string, unknown>;
    environment: EnvironmentType;
    expected: AlscanOptions;
}

const panels = new Panels();

describe('alscan', async () => {
    describe('createParser()', () => {
        const cases: Array<ParserTestCase> = [
            {
                title: 'no arguments',
                argv: [],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: []
                    }
                }
            },
            {
                title: '--verbose is supported',
                argv: ['--verbose'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        verbose: true
                    }
                }
            },
            {
                title: '--quiet is supported',
                argv: ['--quiet'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        quiet: true
                    }
                }
            },
            {
                title: '--days is supported',
                argv: ['--days'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        days: true
                    }
                }
            },
            {
                title: '--hours is supported',
                argv: ['--hours'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        hours: true
                    }
                }
            },
            {
                title: '--minutes is supported',
                argv: ['--minutes'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        minutes: true
                    }
                }
            },
            {
                title: '--one is supported',
                argv: ['--one'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        one: true
                    }
                }
            },
            {
                title: '-1 is supported',
                argv: ['-1'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        one: true
                    }
                }
            },
            {
                title: '--outside is supported',
                argv: ['--outside'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        outside: true
                    }
                }
            },
            {
                title: '--reboot is supported',
                argv: ['--reboot'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        reboot: true
                    }
                }
            },
            {
                title: '--deny is supported',
                argv: ['--deny'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        deny: true
                    }
                }
            },
            {
                title: '--downtime is supported',
                argv: ['--downtime'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        downtime: true
                    }
                }
            },
            {
                title: '--request is supported',
                argv: ['--request'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        request: true
                    }
                }
            },
            {
                title: '--alllogs is supported',
                argv: ['--alllogs'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        alllogs: true
                    }
                }
            },
            {
                title: '--archive is supported',
                argv: ['--archive'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        archive: true
                    }
                }
            },
            {
                title: '--domlogs is supported',
                argv: ['--domlogs'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        domlogs: true
                    }
                }
            },
            {
                title: '--vhosts is supported',
                argv: ['--vhosts'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        domlogs: true
                    }
                }
            },
            {
                title: '--main is supported',
                argv: ['--main'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        main: true
                    }
                }
            },
            {
                title: '--panel is supported',
                argv: ['--panel'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        panel: true
                    }
                }
            },
            {
                title: '--agents is supported',
                argv: ['--agents'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        agents: true
                    }
                }
            },
            {
                title: '--codes is supported',
                argv: ['--codes'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        codes: true
                    }
                }
            },
            {
                title: '--domains is supported',
                argv: ['--domains'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        domains: true
                    }
                }
            },
            {
                title: '--groups is supported',
                argv: ['--groups'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        groups: true
                    }
                }
            },
            {
                title: '--ips is supported',
                argv: ['--ips'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        ips: true
                    }
                }
            },
            {
                title: '--methods is supported',
                argv: ['--methods'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        methods: true
                    }
                }
            },
            {
                title: '--protocols is supported',
                argv: ['--protocols'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        protocols: true
                    }
                }
            },
            {
                title: '--referers is supported',
                argv: ['--referers'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        referers: true
                    }
                }
            },
            {
                title: '--requests is supported',
                argv: ['--requests'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        requests: true
                    }
                }
            },
            {
                title: '--sources is supported',
                argv: ['--sources'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        sources: true
                    }
                }
            },
            {
                title: '--urls is supported',
                argv: ['--urls'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        urls: true
                    }
                }
            },
            {
                title: '--users is supported',
                argv: ['--users'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        users: true
                    }
                }
            },
            {
                title: '--sort bandwidth is supported',
                argv: ['--sort', 'bandwidth'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'bandwidth',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: '--sort count is supported',
                argv: ['--sort', 'count'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: '--sort item is supported',
                argv: ['--sort', 'item'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'item',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: '--sort peak-bandwidth is supported',
                argv: ['--sort', 'peak-bandwidth'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'peak-bandwidth',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: '--sort title is supported',
                argv: ['--sort', 'title'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'title',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: '--top=20 is supported',
                argv: ['--top=20'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: 20,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'setting --fs sets terse as well',
                argv: ['--fs=:'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: ':',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        terse: true
                    }
                }
            },
            {
                title: 'setting -F sets terse as well',
                argv: ['-F:'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: ':',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                        terse: true
                    }
                }
            },
            {
                title: 'arguments are passed',
                argv: ['file1', 'file2'],
                expected: {
                    names: ['file1', 'file2'],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --agent options are supported',
                argv: ['--agent', 'agent1', '--agent', 'agent2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: ['agent1', 'agent2'],
                    }
                }
            },
            {
                title: 'multiple --code options are supported',
                argv: ['--code', 'code1', '--code', 'code2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: ['code1', 'code2'],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --group options are supported',
                argv: ['--group', 'group1', '--group', 'group2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: ['group1', 'group2'],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --ip options are supported',
                argv: ['--ip', '127.0.0.1', '--ip', '255.128.1.2/22'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: ['127.0.0.1', '255.128.1.2/22'],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --match-agent options are supported',
                argv: ['--match-agent', 'agent1', '--match-agent', 'agent2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: ['agent1', 'agent2'],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --match-referer options are supported',
                argv: ['--match-referer', 'pattern1', '--match-referer', 'pattern2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: ['pattern1', 'pattern2'],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --match-url options are supported',
                argv: ['--match-url', 'pattern1', '--match-url', 'pattern2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: ['pattern1', 'pattern2'],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --method options are supported',
                argv: ['--method', 'get', '--method', 'post'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: ['get', 'post'],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --referer options are supported',
                argv: ['--referer', 'referer1', '--referer', 'referer2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: ['referer1', 'referer2'],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --source options are supported',
                argv: ['--source', 'source1', '--source', 'source2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: ['source1', 'source2'],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --url options are supported',
                argv: ['--url', 'url1', '--url', 'url2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: ['url1', 'url2'],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --account options are supported',
                argv: ['--account', 'account1', '--account', 'account2'],
                expected: {
                    names: [],
                    options: {
                        account: ['account1', 'account2'],
                        code: [],
                        directory: [],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --directory options are supported',
                argv: ['--directory', 'directory1', '--directory', 'directory2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: ['directory1', 'directory2'],
                        domain: [],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --domain options are supported',
                argv: ['--domain', 'domain1', '--domain', 'domain2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: ['domain1', 'domain2'],
                        file: [],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: 'multiple --file options are supported',
                argv: ['--file', 'file1', '--file', 'file2'],
                expected: {
                    names: [],
                    options: {
                        account: [],
                        code: [],
                        directory: [],
                        domain: [],
                        file: ['file1', 'file2'],
                        fs: '|',
                        group: [],
                        ip: [],
                        matchReferer: [],
                        matchUrl: [],
                        matchUserAgent: [],
                        method: [],
                        referer: [],
                        sort: 'count',
                        source: [],
                        timeSlot: 3600,
                        top: Infinity,
                        url: [],
                        userAgent: [],
                    }
                }
            },
            {
                title: '--verbose and --quiet conflict',
                argv: ['--verbose', '--quiet'],
                expected: {
                    throws: true,
                    stderr: "error: option '--quiet' cannot be used with option '--verbose'\n",
                }
            },
            {
                title: '--deny and --downtime conflict',
                argv: ['--deny', '--downtime'],
                expected: {
                    throws: true,
                    stderr: "error: option '--deny' cannot be used with option '--downtime'\n",
                }
            },
            {
                title: '--deny and --request conflict',
                argv: ['--deny', '--request'],
                expected: {
                    throws: true,
                    stderr: "error: option '--deny' cannot be used with option '--request'\n",
                }
            },
            {
                title: '--deny and --terse conflict',
                argv: ['--deny', '--terse'],
                expected: {
                    throws: true,
                    stderr: "error: option '--deny' cannot be used with option '-t, --terse'\n",
                }
            },
            {
                title: '--deny and -t conflict',
                argv: ['--deny', '-t'],
                expected: {
                    throws: true,
                    stderr: "error: option '--deny' cannot be used with option '-t, --terse'\n",
                }
            },
            {
                title: '--downtime and --request conflict',
                argv: ['--downtime', '--request'],
                expected: {
                    throws: true,
                    stderr: "error: option '--downtime' cannot be used with option '--request'\n",
                }
            },
            {
                title: '--downtime and --terse conflict',
                argv: ['--downtime', '--terse'],
                expected: {
                    throws: true,
                    stderr: "error: option '--downtime' cannot be used with option '-t, --terse'\n",
                }
            },
            {
                title: '--downtime and -t conflict',
                argv: ['--downtime', '-t'],
                expected: {
                    throws: true,
                    stderr: "error: option '--downtime' cannot be used with option '-t, --terse'\n",
                }
            },
            {
                title: '--request and --terse conflict',
                argv: ['--request', '--terse'],
                expected: {
                    throws: true,
                    stderr: "error: option '--request' cannot be used with option '-t, --terse'\n",
                }
            },
            {
                title: '--request and -t conflict',
                argv: ['--request', '-t'],
                expected: {
                    throws: true,
                    stderr: "error: option '--request' cannot be used with option '-t, --terse'\n",
                }
            },
            {
                title: '--agents and --category=ips conflict',
                argv: ['--agents', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--agents'\n",
                }
            },
            {
                title: '--codes and --category=ips conflict',
                argv: ['--codes', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--codes'\n",
                }
            },
            {
                title: '--domains and --category=ips conflict',
                argv: ['--domains', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--domains'\n",
                }
            },
            {
                title: '--groups and --category=ips conflict',
                argv: ['--groups', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--groups'\n",
                }
            },
            {
                title: '--ips and --category=urls conflict',
                argv: ['--ips', '--category=urls'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--ips'\n",
                }
            },
            {
                title: '--methods and --category=ips conflict',
                argv: ['--methods', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--methods'\n",
                }
            },
            {
                title: '--protocols and --category=ips conflict',
                argv: ['--protocols', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--protocols'\n",
                }
            },
            {
                title: '--requests and --category=ips conflict',
                argv: ['--requests', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--requests'\n",
                }
            },
            {
                title: '--sources and --category=ips conflict',
                argv: ['--sources', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--sources'\n",
                }
            },
            {
                title: '--urls and --category=ips conflict',
                argv: ['--urls', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--uris, --urls'\n",
                }
            },
            {
                title: '--users and --category=ips conflict',
                argv: ['--users', '--category=ips'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' cannot be used with option '--users'\n",
                }
            },
            {
                title: '--category checks value',
                argv: ['--category=nonsuch'],
                expected: {
                    throws: true,
                    stderr: "error: option '--category <name>' argument 'nonsuch' is invalid. Allowed choices are agents, codes, groups, ips, methods, protocols, requests, sources, urls, users.\n",
                }
            },
            {
                title: '--sort checks value',
                argv: ['--sort=nonsuch'],
                expected: {
                    throws: true,
                    stderr: "error: option '--sort <by>' argument 'nonsuch' is invalid. Allowed choices are bandwidth, count, item, peak-bandwidth, title.\n",
                }
            },
            {
                title: '--ip checks value',
                argv: ['--ip=nonsuch'],
                expected: {
                    throws: true,
                    stderr: "error: option '--ip <addr>' argument 'nonsuch' is invalid. nonsuch is not in IP xxx.xxx.xxx.xxx/nn format\n",
                }
            },
            {
                title: '--ip checks value with mask',
                argv: ['--ip=127.0.0.1/wtf'],
                expected: {
                    throws: true,
                    stderr: "error: option '--ip <addr>' argument '127.0.0.1/wtf' is invalid. 127.0.0.1/wtf is not in IP xxx.xxx.xxx.xxx/nn format\n",
                }
            },
            {
                title: '--days and --time-slot=120 conflict',
                argv: ['--days', '--time-slot=120'],
                expected: {
                    throws: true,
                    stderr: "error: option '--time-slot <seconds>' cannot be used with option '--days'\n",
                }
            },
            {
                title: '--hours and --time-slot=120 conflict',
                argv: ['--hours', '--time-slot=120'],
                expected: {
                    throws: true,
                    stderr: "error: option '--time-slot <seconds>' cannot be used with option '--hours'\n",
                }
            },
            {
                title: '--minutes and --time-slot=120 conflict',
                argv: ['--minutes', '--time-slot=120'],
                expected: {
                    throws: true,
                    stderr: "error: option '--time-slot <seconds>' cannot be used with option '--minutes'\n",
                }
            },
            {
                title: '--one and --time-slot=120 conflict',
                argv: ['--one', '--time-slot=120'],
                expected: {
                    throws: true,
                    stderr: "error: option '--time-slot <seconds>' cannot be used with option '-1, --one'\n",
                }
            },
            {
                title: '-1 and --time-slot=120 conflict',
                argv: ['-1', '--time-slot=120'],
                expected: {
                    throws: true,
                    stderr: "error: option '--time-slot <seconds>' cannot be used with option '-1, --one'\n",
                }
            },
            {
                title: '--one and --outside conflict',
                argv: ['--one', '--outside'],
                expected: {
                    throws: true,
                    stderr: "error: option '-1, --one' cannot be used with option '--outside'\n",
                }
            },
            {
                title: '-1 and --outside conflict',
                argv: ['-1', '--outside'],
                expected: {
                    throws: true,
                    stderr: "error: option '-1, --one' cannot be used with option '--outside'\n",
                }
            },
            {
                title: '--reboot and --start=timestamp conflict',
                argv: ['--reboot', '--start=12:00:00'],
                expected: {
                    throws: true,
                    stderr: "error: option '--reboot' cannot be used with option '--start <date-time>'\n",
                }
            },
            {
                title: '--time-slot must be a number',
                argv: ['--time-slot=big'],
                expected: {
                    throws: true,
                    stderr: "error: option '--time-slot <seconds>' argument 'big' is invalid. value must be a positive integer (Seconds)\n",
                }
            },
            {
                title: '--time-slot must be a positive integer',
                argv: ['--time-slot=-2'],
                expected: {
                    throws: true,
                    stderr: "error: option '--time-slot <seconds>' argument '-2' is invalid. value must be a positive integer (Seconds)\n",
                }
            },
            {
                title: '--top must be a number',
                argv: ['--top=small'],
                expected: {
                    throws: true,
                    stderr: "error: option '--top <number>' argument 'small' is invalid. value must be a positive integer\n",
                }
            },
            {
                title: '--top must be a positive integer',
                argv: ['--top=-2'],
                expected: {
                    throws: true,
                    stderr: "error: option '--top <number>' argument '-2' is invalid. value must be a positive integer\n",
                }
            },

        ];

        function checkCase(c: ParserTestCase): void {
            let stdout: string | undefined;
            let stderr: string | undefined;
            function doCheck(
                arg0: Array<string>,
                opts: Record<string, unknown>,
                _cmd: Command<[Array<string>], {}, {}>): void {
                if (c.expected.names) {
                    assert.deepEqual(arg0, c.expected.names);
                }
                if (c.expected.options) {
                    assert.deepEqual(opts, c.expected.options)
                }
            }
            const p = createParser().action(doCheck);
            p.configureOutput({
                writeErr: (str) => {
                    if (stderr) { stderr += str; } else { stderr = str; }
                },
                writeOut: (str) => {
                    if (stdout) { stdout += str; } else { stdout = str; }
                }
            });
            if (!!c.expected.throws) {
                assert.throws(() => {
                    p.exitOverride();
                    p.parse(['node', 'alscan', ...c.argv]);
                });
            } else {
                p.parse(['node', 'alscan', ...c.argv]);
            }
            if (c.expected.stderr) {
                assert.equal(stderr, c.expected.stderr);
            } else if (stderr) {
                console.log(`stderr>${stderr}<\n`);
            }
            if (c.expected.stdout) {
                assert.equal(stdout, c.expected.stdout);
            } else if (stdout) {
                console.log(`\nstdout>${stdout}<\n`);
            }
        }

        for (const c of cases) {
            test(c.title, () => {
                checkCase(c);
            });
        }
    });

    describe('getGetItem()', () => {
        const line = '180.76.6.26 - - [30/Nov/2012:06:17:35 -0600] "GET /pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/man/cat2/quota.0 HTTP/1.1" 200 4000 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"';
        const entry = new AccessLogEntry();
        entry.parse(line);
        const cases: Array<GetGetItemTestCase> = [
            {
                title: '--deny returns the host field',
                options: {
                    deny: true
                },
                category: undefined,
                expected: entry.host,
            },
            {
                title: '--downtime returns undefined',
                options: {
                    downtime: true
                },
                category: undefined,
                expected: undefined,
            },
            {
                title: '--request returns the line',
                options: {
                    request: true
                },
                category: undefined,
                expected: entry.line,
            },
            {
                title: 'category === "groups" returns the group',
                options: {},
                category: 'groups',
                expected: entry.group,
            },
            {
                title: 'category === "sources" returns the source',
                options: {},
                category: 'sources',
                expected: entry.source,
            },
            {
                title: 'category === "agents" returns the agent',
                options: {},
                category: 'agents',
                expected: entry.agent,
            },
            {
                title: 'category === "urls" returns the uri',
                options: {},
                category: 'urls',
                expected: entry.uri,
            },
            {
                title: 'category === "codes" returns the status',
                options: {},
                category: 'codes',
                expected: entry.status,
            },
            {
                title: 'category === undefined returns the status',
                options: {},
                category: undefined,
                expected: entry.status,
            },
            {
                title: 'category === "referers" returns the referer',
                options: {},
                category: 'referers',
                expected: entry.referer,
            },
            {
                title: 'category === "groups" returns the group',
                options: {},
                category: 'groups',
                expected: entry.group,
            },
            {
                title: 'category === "domains" returns the domain',
                options: {},
                category: 'domains',
                expected: 'domain',
            },
            {
                title: 'category === "methods" returns the method',
                options: {},
                category: 'methods',
                expected: entry.method,
            },
            {
                title: 'category === "groups" returns the group',
                options: {},
                category: 'groups',
                expected: entry.group,
            },
            {
                title: 'category === "protocols" returns the protocol',
                options: {},
                category: 'protocols',
                expected: entry.protocol,
            },
            {
                title: 'category === "users" returns the user',
                options: {},
                category: 'users',
                expected: entry.user,
            },
            {
                title: 'category === "ips" returns the host',
                options: {},
                category: 'ips',
                expected: entry.host,
            },
        ];
        for (const c of cases) {
            test(c.title, () => {
                const getItem = getGetItem(c.options, c.category);
                const actual = getItem(entry, 'domain');
                assert.equal(actual, c.expected);
            });
        }
        test('category === "nonsuch" throws', () => {
            assert.throws(() => {
                getGetItem({}, 'nonsuch');
            });
        });
    });

    describe('scanFiles()', async () => {
        beforeEach(() => {
            setRootDirectory(getDataDirectory());
        });
        test('happy path', async () => {
            const file = new ScanFile('/logs/samplx.org', undefined, 'samplx.org');
            const start = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
            const stop = new Date();
            const keepOutside = false;
            const getItem = getGetItem({}, 'codes');
            const verbose = false;
            const actual = await scanFiles([file], start, stop, keepOutside, getItem, verbose);
            assert.ok(Array.isArray(actual));
            assert.ok(actual[0] instanceof Tick);
            assert.equal(actual.length, 15610);
        });
    });


    describe('gatherAlscanOptions', async () => {
        const cases: Array<GatherTestCase> = [
            {
                title: 'no arguments in core environment',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: []
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'names are added to files',
                names: ['name1', 'name2'],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: ['file1'],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: []
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: ['name1', 'name2', 'file1'],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'accounts is ignored if not enabled',
                names: [],
                options: {
                    account: ['account1'],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: []
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'alllogs is ignored if not enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    alllogs: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'archive is ignored if not enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    archive: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'domlogs is ignored if not enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    domlogs: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'main is ignored if not enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    main: true
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'panel is ignored if not enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    panel: true
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'domain is ignored if not enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: ['domain1'],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: []
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'accounts is included if enabled',
                names: [],
                options: {
                    account: ['account1'],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: []
                },
                environment: 'cpanel',
                expected: {
                    accounts: ['account1'],
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'alllogs is included if enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    alllogs: true,
                },
                environment: 'cpanel',
                expected: {
                    alllogs: true,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'archive is included if enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    archive: true,
                },
                environment: 'cpanel',
                expected: {
                    alllogs: false,
                    archive: true,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'domlogs is included if enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    domlogs: true,
                },
                environment: 'cpanel',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: true,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'main is included if enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    main: true
                },
                environment: 'cpanel',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: true,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'panel is included if enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    panel: true
                },
                environment: 'cpanel',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: true,
                    timeSlot: 3600
                }
            },
            {
                title: 'domain is included if enabled',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: ['domain1'],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: []
                },
                environment: 'cpanel',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domains: ['domain1'],
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'start after stop sets error',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    start: '2020-1-1',
                    stop: '2010-1-1',
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    error: true,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'time-slot with --one',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    one: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: Infinity
                }
            },
            {
                title: 'time-slot with --days',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    days: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 24 * 60 * 60
                }
            },
            {
                title: 'time-slot with --hours',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    hours: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 3600
                }
            },
            {
                title: 'time-slot with --minutes',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    minutes: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 60
                }
            },
            {
                title: 'time-slot with --time-slot=120',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 120,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 120
                }
            },
            {
                title: 'time-slot with --downtime',
                names: [],
                options: {
                    account: [],
                    code: [],
                    directory: [],
                    domain: [],
                    file: [],
                    fs: '|',
                    group: [],
                    ip: [],
                    matchReferer: [],
                    matchUrl: [],
                    matchUserAgent: [],
                    method: [],
                    referer: [],
                    sort: 'count',
                    source: [],
                    timeSlot: 3600,
                    top: Infinity,
                    url: [],
                    userAgent: [],
                    downtime: true,
                },
                environment: 'core',
                expected: {
                    alllogs: false,
                    archive: false,
                    category: 'codes',
                    domlogs: false,
                    files: [],
                    keepOutside: false,
                    main: false,
                    panel: false,
                    timeSlot: 60
                }
            },
        ];

        for (const c of cases) {
            test(c.title, async () => {
                await setupEnvironment(c.environment);
                const actual = await gatherAlscanOptions(c.names, c.options, panels);
                for (const key of Object.keys(c.expected)) {
                    const result = actual as Record<string, unknown>;
                    const exp = c.expected as Record<string, unknown>;
                    assert.deepEqual(result[key], exp[key]);
                }
            });
        }
    });
});

async function setupEnvironment(name: EnvironmentType): Promise<void> {
    if (name === 'core') {
        setRootDirectory(getDataDirectory());
        process.env['ALSCAN_TESTING_HOME'] = undefined;
    } else {
        setRootDirectory(path.join(getDataDirectory(), 'cpanel'));
        if (name === 'cpanel') {
            process.env['ALSCAN_TESTING_HOME'] = undefined;
        } else {
            assert.equal(name, 'cpanelUser');
            process.env['ALSCAN_TESTING_HOME'] = '/home1/druid';
        }
    }
    await panels.load();
}

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
