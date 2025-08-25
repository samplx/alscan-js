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
import { TimeSlot } from "./timeslot.ts";

/**
 *  @ctor DenyReport constructor.
 */
export class DenyReport extends Reporter {
    constructor() {
        super();
        this.id = 'deny';
    }

    /**
     *  Create Deny report.
     *  @param ticks data to create report.
     */
    override async report(ticks: Array<Tick>): Promise<void> {
        if ( (ticks.length === 0) ||
             (this.start === undefined) ||
             (this.stop === undefined) ||
             (this.limit === undefined)) {
            return;
        }
        const slot = new TimeSlot(ticks, 0, ticks.length-1, this.start.getTime(), this.stop.getTime(), this);
        slot.scan();
        const ips: Array<string> = [];
        for (let n=0; (n < slot.nItems()) && (n < this.limit); n++) {
            const title = slot.getItem(n).title;
            if (title) {
                ips.push(title);
            }
        }
        const sorted = ips.sort();
        for (const ip of sorted) {
            this.output(`deny from ${ip}`);
        }
    }
}
