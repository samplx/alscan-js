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

export class DowntimeReport extends Reporter {
    /**
     *  Create Downtime report.
     *  @param ticks data for the report.
     */
    override report(ticks: Array<Tick>): void {
        if ( (ticks.length === 0) ||
             (this.start === undefined) ||
             (this.stop === undefined) ||
             (this.slotWidth === undefined) ||
             (this.limit === undefined)) {
            this.output('No entires match search criteria.');
            return;
        }

        const firstTime = ticks[0].time;
        const firstTS = this.getTimestamp(firstTime);
        const lastTime = ticks[ticks.length-1].time;
        const lastTS  = this.getTimestamp(lastTime);
        let tsFirst = 0;
        let tsLast  = 26;
        if (this.tzSuffix(firstTS) == this.tzSuffix(lastTS)) {
            // timezones match, don't need to print them.
            tsLast = 20;
        }
        if (firstTS.substring(0, 12) == lastTS.substring(0, 12)) {
            // dates match, don't need them
            tsFirst = 12;
        }

        // print header
        const stopTimeMS = this.stop.getTime();
        this.output(this.getTimestampHeader(this.start, firstTime, lastTime, stopTimeMS, 'Downtime'));
        let row: string;
        row  = this.padFieldRight('Time', tsLast - tsFirst) + ' ';
        row += ' Count  Bandwidth';
        this.output(row);

        // convert slotWidth to milliseconds.
        const slotWidthMS = this.slotWidth * 1000;
        let currentTime = Math.floor(ticks[0].time / slotWidthMS) * slotWidthMS;
        let nextTime = currentTime - 1000;
        let count = 0;
        let bandwidth = 0;
        let n= 0;

        while ((n < ticks.length) && (ticks[n].time <= stopTimeMS)) {
            nextTime += slotWidthMS;
            while ((n < ticks.length) && (ticks[n].time <= nextTime)) {
                count += 1;
                bandwidth += ticks[n].size;
                n += 1;
            }
            row  = this.getTimestamp(currentTime).substring(tsFirst, tsLast);
            row += this.padField(count, 7);
            if (count === 0) {
                row += '    -';
            } else {
                row += this.padField(this.getBytesString(bandwidth), 9);
            }
            currentTime += slotWidthMS;
            this.output(row);
            count = 0;
            bandwidth = 0;
        }
    }
}

