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

export class SummaryReport extends Reporter {
    before?: TimeSlot;
    after?: TimeSlot;
    totals?: TimeSlot;
    slots: Array<TimeSlot>;

    // terse report option
    terse: boolean;

    // used to separate fields in terse output
    fieldSep: string;

    keepOutside: boolean;

    constructor(
        terse: boolean = false,
        fieldSep: string = '|',
        keepOutside: boolean = true,
    ) {
        super();
        this.id = 'summary';
        this.terse = terse;
        this.fieldSep = fieldSep;
        this.keepOutside = keepOutside;
        this.slots = [];
    }

    override async report(ticks: Array<Tick>): Promise<void> {
        if ( (ticks.length === 0) ||
                (this.start === undefined) ||
                (this.stop === undefined) ||
                (this.slotWidth === undefined) ||
                (this.limit === undefined)) {
            if (!this.terse) {
                this.output('No entires match search criteria.');
            }
            return;
        }
        const firstIndex = this.getFirstIndex(ticks);
        const lastIndex = this.getLastIndex(ticks);
        let nSlots;
        if (this.slotWidth == Infinity) {
            nSlots = 1;
        } else if (firstIndex < lastIndex) {
            const duration = (ticks[lastIndex]!.time - ticks[firstIndex]!.time) / 1000;
            nSlots = Math.ceil(duration / this.slotWidth);
        } else if (firstIndex === lastIndex) {
            nSlots = 1;
        } else {
            nSlots = 0;
        }

        this.allocateSlots(nSlots, ticks, firstIndex, lastIndex);

        if (this.before) {
            this.totalReport('Before', this.before);
        }
        for (const slot of this.slots) {
            slot.scan();
            this.slotReport(slot);
        }
        if (this.after) {
            this.totalReport('After', this.after);
        }
        if (this.totals) {
            this.totalReport('Grand Totals', this.totals);
        }
    }

    /**
     *  Allocate slots for report.
     *  @param nSlots number of slots.
     *  @param ticks report data items.
     *  @firstIndex index of first tick in report.
     *  @lastIndex index of last tick in report.
     */
    allocateSlots(nSlots: number, ticks: Array<Tick>, firstIndex: number, lastIndex: number): void {
        if (firstIndex !== 0) {
            let stopTime: number;
            if (firstIndex < ticks.length) {
                stopTime = ticks[firstIndex]!.time - 1;
            } else {
                stopTime = ticks[ticks.length-1]!.time;
            }
            this.before = new TimeSlot(ticks, 0, firstIndex-1, ticks[0]!.time, stopTime, this);
            this.before.totalScan();
        }
        if (lastIndex != (ticks.length-1)) {
            this.after = new TimeSlot(ticks,
                lastIndex+1,
                ticks.length-1,
                ticks[lastIndex+1]!.time,
                ticks[ticks.length-1]!.time,
                this);
            this.after.totalScan();
        }
        if ((this.start === undefined) || (this.stop === undefined) || (this.slotWidth === undefined)) {
            return;
        }
        if (nSlots == 1) {
            // only a single timeslot
            this.slots.push(new TimeSlot(ticks, firstIndex, lastIndex,
                this.start.getTime(),
                this.stop.getTime(),
                this));
        } else if (nSlots > 1) {
            this.totals = new TimeSlot(ticks, firstIndex, lastIndex,
                this.start.getTime(),
                this.stop.getTime(),
                this);
            this.totals.totalScan();

            const slotWidthMS = this.slotWidth * 1000;
            var startTime = (Math.floor(ticks[firstIndex]!.time / slotWidthMS) * slotWidthMS);
            var nextTime = startTime - 1000;
            var first = firstIndex;
            var last = -1;
            var length = ticks.length;

            while (nextTime < this.stop.getTime()) {
                nextTime += slotWidthMS;
                for (var n=first; n < length ; n++) {
                    if (ticks[n]!.time >= nextTime) {
                        break;
                    }
                    last= n;
                }
                if (last >= first) {
                    const slot = new TimeSlot(ticks, first, last, startTime, nextTime, this);
                    this.slots.push(slot);
                    first= last+1;
                }
                startTime = nextTime + 1000;
            }
        }
    }

    /**
     *  Return the column header line of a verbose report.
     *  @param title of the section.
     */
    getColumnHeader(title: string): string {
        //      0        1         2         3         4         5         6         7         8
        //      12345678901234567890123456789012345678901234567890123456789012345678901234567890
        return `Requests  Ave/sec Peak/sec  Bandwidth   Bytes/sec Peak Bytes ${title}`;
    };

    /**
     *  Return a single row of data for the verbose summary report.
     *  @param item of data.
     */
    getItemRow(item: any) {
        var row;
        var elapsed = Math.floor((item.last - item.first + 1000) / 1000);
        var perSecond = item.count / elapsed;

        row  = this.padField(item.count.toString(), 8);
        row += this.padField(perSecond.toFixed(3), 9);
        row += this.padField(item.peakCount, 9) + ' ';
        row += this.getBytesString(item.bandwidth) + ' ';
        row += this.getBPS(item.bandwidth, elapsed) + ' ';
        row += this.getBytesString(item.peakBandwidth) + ' ';
        row += item.title;
        return row;
    };

    /**
     *  Return a single row of a terse report.
     *  @param item of data.
     *  @param sep String to separate fields.
     *  @param start time of row (milliseconds since Epoch).
     *  @param stop time of row (milliseconds since Epoch).
     */
    getTerseItemRow(item: any, sep: string, start: number, stop: number) {
        var row = '';
        var elapsed = Math.floor((item.last - item.first + 1000) / 1000);
        var countPerSecond = item.count / elapsed;
        var bytesPerSecond = item.bandwidth / elapsed;

        row += this.getTimestamp(start) + sep;
        row += Math.floor(start / 1000).toString() + sep;
        row += this.getTimestamp(item.first) + sep;
        row += Math.floor(item.first / 1000).toString() + sep;
        row += this.getTimestamp(item.last) + sep;
        row += Math.floor(item.last / 1000).toString() + sep;
        row += this.getTimestamp(stop) + sep;
        row += Math.floor(stop / 1000).toString() + sep;
        row += item.count.toString() + sep;
        row += countPerSecond.toString() + sep;
        row += item.peakCount.toString() + sep;
        row += item.bandwidth.toString() + sep;
        row += bytesPerSecond.toString() + sep;
        row += item.peakBandwidth.toString() + sep;
        row += item.title;
        return row;
    }

    /**
     *  Return index of first tick after start.
     *  @param ticks data for report.
     */
    getFirstIndex(ticks: Array<Tick>) {
        if (this.keepOutside && this.start) {
            for (let n=0; n < ticks.length; n++) {
                if (ticks[n]!.time >= this.start.getTime()) {
                    return n;
                }
            }
            return ticks.length;
        } else {
            return 0;
        }
    }

    /**
     *  Return index of last tick before stop.
     *  @param ticks report data.
     */
    getLastIndex(ticks: Array<Tick>) {
        if (this.keepOutside && this.stop) {
            let last = -1;
            for (let n=0; n < ticks.length; n++) {
                if (ticks[n]!.time > this.stop.getTime()) {
                    break;
                }
                last = n;
            }
            return last;
        } else {
            return ticks.length-1;
        }
    }

    /**
     *  Write the total section of a terse report.
     *  @param title String.
     *  @param slot total summary data.
     */
    terseTotalReport(title: string, slot: TimeSlot): void {
        const total = slot.getTotals();
        if (total) {
            total.title = title;
            const row = this.getTerseItemRow(total, this.fieldSep, slot.startTime, slot.stopTime);
            this.output(row);
        }
    }


    /**
     *  Write out the total section of a verbose report.
     *  @param title String.
     *  @param slot of total summary data.
     */
    verboseTotalReport(title: string, slot: TimeSlot): void {
        const total = slot.getTotals();
        if (total) {
            this.output(this.getTimestampHeader(slot.startTime, slot.firstTime, slot.lastTime, slot.stopTime, ''));
            this.output(this.getColumnHeader(title));
            total.title = '';
            const row = this.getItemRow(total);
            this.output(row);
        }
    }

    /**
     *  Report on a total.
     *  @param title String.
     *  @param total slot data.
     */
    totalReport(title: string, total: TimeSlot): void {
        if (this.terse) {
            this.terseTotalReport(title, total);
        } else {
            this.verboseTotalReport(title, total);
        }
    }


    /**
     *  Single slot report section in terse format.
     *  @param slot data.
     */
    terseSlotReport(slot: TimeSlot): void {
        let length = slot.nItems();
        if (this.limit && (this.limit < length)) {
            length = this.limit;
        }
        for (let n=0; n < length; n++) {
            const row = this.getTerseItemRow(slot.getItem(n), this.fieldSep, slot.startTime, slot.stopTime);
            this.output(row);
        }
        const total = slot.getTotals();
        if (total) {
            total.title = 'Totals';
            const row = this.getTerseItemRow(total, this.fieldSep, slot.startTime, slot.stopTime);
            this.output(row);
        }
    }

    /**
     *  Single slot report section in verbose format.
     *  @param slot data.
     */
    verboseSlotReport(slot: TimeSlot): void {
        const title = Reporter.categoryLookup[this.category ?? 'undefined'];
        this.output(this.getTimestampHeader(slot.startTime, slot.firstTime, slot.lastTime, slot.stopTime, 'Slot'));
        this.output(this.getColumnHeader(title ?? ''));
        let length = slot.nItems();
        if (this.limit && (this.limit < length)) {
            length = this.limit;
        }
        for (let n=0; n < length; n++) {
            const row = this.getItemRow(slot.getItem(n));
            this.output(row);
        }
        if (length != 1) {
            const total = slot.getTotals();
            if (total) {
                total.title = 'Totals';
                const row = this.getItemRow(total);
                this.output(row);
            }
        }
        this.output('');
    }

    /**
     *  Generate a report section on a single slot.
     *  @param slot data.
     */
    slotReport(slot: TimeSlot): void {
        if (this.terse) {
            this.terseSlotReport(slot);
        } else {
            this.verboseSlotReport(slot);
        }
    }

}
