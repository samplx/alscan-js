/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013, 2014, 2018, 2025 James Burlingame
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

import { Reporter } from "./reporter.ts";
import { Tick } from "./tick.ts";

export class RequestReport extends Reporter {
    constructor() {
        super();
        this.id = 'request';
    }

    /**
     *  Create Request report.
     *  @param ticks data to create report.
     */
    override async report(ticks: Array<Tick>): Promise<void> {
        for (const tick of ticks) {
            if (tick.item) {
                this.output(tick.item);
            }
        }
    }
}
