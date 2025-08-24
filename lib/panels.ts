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

import { ScanFile } from "./scanfile.ts";

import { PanelAccess } from "./panel-access.ts";
import { CPanelAccess } from "./panels/50-cpanel.ts";
import { CPanelUserAccess } from "./panels/60-cpanelUser.ts";
import type { AlscanOptions } from "./options.ts";

/**
 *  Singleton panels interface class.
 */
export class Panels {
    /** Current panel. */
    panel?: PanelAccess;

    /** Does the current panel support Archives. */
    hasArchives(): boolean {
        return ((this.panel !== undefined) && this.panel.hasArchives);
    }

    /** Does the current panel support Accounts. */
    hasAccounts(): boolean {
        return ((this.panel !== undefined) && this.panel.hasAccounts);
    }

    /** Does current panel support Domains. */
    hasDomains(): boolean {
        return ((this.panel !== undefined) && this.panel.hasDomains);
    }

    /** Does the current panel have a Panel access log. */
    hasPanelLog(): boolean {
        return ((this.panel !== undefined) && this.panel.hasPanelLog);
    }

    /** Does the current panel have a default (main) access log. */
    hasMainLog(): boolean {
        return ((this.panel !== undefined) && this.panel.hasMainLog);
    }

    /** Load panel interfaces. */
    async load(): Promise<void> {
        const cPanel = new CPanelAccess();
        const hasCPanel = await cPanel.isActive();
        if (hasCPanel) {
            this.panel = cPanel;
        } else {
            const cPanelUser = new CPanelUserAccess();
            const hasUser = await cPanelUser.isActive();
            if (hasUser) {
                this.panel = cPanelUser;
            } else {
                this.panel = new PanelAccess();
            }
        }
    }

    /**
     *  Find the log files based upon the options.
     *  @arg options object.
     */
    async findScanFiles(options: AlscanOptions): Promise<Array<ScanFile>> {
        if (this.panel === undefined) {
            return [];
        }
        const list: Array<ScanFile> = [];
        if (options.domlogs && this.hasDomains()) {
            const files = await this.panel.findAllLogFiles();
            // console.log(`after findAllLogFiles, files=${files.length}`);
            list.push(...files);
            if (this.hasArchives() && options.archive && options.start && options.stop) {
                const archives = await this.panel.findAllArchiveFiles(options.start, options.stop);
                list.push(...archives);
            }
        } else {
            if (Array.isArray(options.accounts) && this.hasAccounts()) {
                for (const account of options.accounts) {
                    const files = await this.panel.findAccountLogFiles(account);
                    // console.log(`for ${account}, there were ${files.length} files`);
                    list.push(...files);
                    if (this.hasArchives() && options.archive && options.start && options.stop) {
                        const archives = await this.panel.findAccountArchiveFiles(account, options.start, options.stop);
                        list.push(...archives);
                    }
                }
            }
            if (Array.isArray(options.domains) && this.hasAccounts()) {
                for (const domain of options.domains) {
                    const files = await this.panel.findDomainLogFiles(domain);
                    list.push(...files);
                    if (this.hasArchives() && options.archive && options.start && options.stop) {
                        const archives = await this.panel.findDomainArchiveFiles(domain, options.start, options.stop);
                        list.push(...archives);
                    }
                }
            }
        }
        if (Array.isArray(options.file)) {
            for (const file of options.file) {
                const scans = await this.panel.findLogFile(file);
                list.push(...scans);
            }
        }
        if (Array.isArray(options.directory)) {
            for (const dir of options.directory) {
                const files = await this.panel.findLogFilesInDirectory(dir);
                list.push(...files);
            }
        }
        if (options.main && this.hasMainLog()) {
            const files = await this.panel.findMainLogFiles();
            list.push(...files);
            if (this.hasArchives() && options.archive && options.start && options.stop) {
                const archives = await this.panel.findMainArchiveFiles(options.start, options.stop);
                list.push(...archives);
            }
        }
        if (options.panel && this.hasPanelLog()) {
            const files = await this.panel.findPanelLogFiles();
            list.push(...files);
            if (this.hasArchives() && options.archive && options.start && options.stop) {
                const archives = await this.panel.findPanelArchiveFiles(options.start, options.stop);
                list.push(...archives);
            }
        }

        return list;
    }

}

