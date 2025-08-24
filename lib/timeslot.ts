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

import { Tick } from "./tick.ts";
import sortOn from "sort-on";

/**
 *  @ctor SlotItem constructor.
 *  @arg tick first tick in the slot.
 */
class SlotItem {
    title?: string;
    count: number;
    currentCount: number;
    peakCount: number;
    bandwidth: number;
    currentBandwidth: number;
    peakBandwidth: number;
    first: number;
    last: number;
    lastTime: number;

    constructor(tick: Tick) {
        this.title = tick.item;
        this.count = this.currentCount = this.peakCount = 1;
        this.bandwidth = this.currentBandwidth = this.peakBandwidth = tick.size;
        this.first = this.last = this.lastTime = tick.time;
    }

    /**
     *  Increment the item by the tick.
     *  @arg tick seen.
     */
    inc(tick: Tick): void {
        this.count += 1;
        this.bandwidth += tick.size;
        if (this.last < tick.time) {
            this.last = tick.time;
        }
        if (this.lastTime == tick.time) {
            this.currentBandwidth += tick.size;
            this.currentCount += 1;
        } else {
            this.currentBandwidth = tick.size;
            this.currentCount = 1;
        }
        if (this.peakBandwidth < this.currentBandwidth) {
            this.peakBandwidth = this.currentBandwidth;
        }
        if (this.peakCount < this.currentCount) {
            this.peakCount = this.currentCount;
        }
        this.lastTime = tick.time;
    };

}


/**
 *  @ctor TimeSlot constructor.
 *  @arg ticks Array of Ticks.
 *  @arg firstIndex of this time slot in ticks array.
 *  @arg lastIndex of this time slot in ticks array.
 *  @arg startTime.
 *  @arg stopTime.
 *  @arg options associated with the report.
 */
export class TimeSlot {
    ticks: Array<Tick>;
    firstIndex: number;
    lastIndex: number;
    startTime: number;
    stopTime: number;
    firstTime: number;
    lastTime: number;
    options: any;
    items: Array<SlotItem>;
    totals?: SlotItem;

    constructor(
        ticks: Array<Tick>,
        firstIndex: number,
        lastIndex: number,
        startTime: number,
        stopTime: number,
        options: any
    ) {
        this.ticks = ticks;
        this.firstIndex = firstIndex;
        this.lastIndex = lastIndex;
        this.startTime = startTime;
        this.firstTime = ticks[firstIndex].time;
        this.stopTime = stopTime;
        this.lastTime = ticks[lastIndex].time;
        this.options = options;
        this.totals = undefined;
        this.items = [];
    }

    /**
     *  Find an item which matches the item value of the tick.
     *  @arg tick to locate.
     *  @returns Index of tick in items array. -1 if not found.
     */
    find(tick: Tick): number {
        for (let n=0; n < this.items.length; n++) {
            if (this.items[n].title == tick.item) {
                return n;
            }
        }
        return -1;
    }

    /**
     *  Increment the item associated with the tick.
     *  @arg index of the tick in the item array.
     *  @arg tick data seen.
     */
    inc(index: number, tick: Tick): void {
        if ((index < 0) || (index >= this.items.length)) {
            throw new RangeError('index is out-of-bounds.');
        }
        this.items[index].inc(tick);
    }

    /** Table used to convert a sort option to the field to sort upon. */
    static sortFieldLookup: Record<string, string> =
        {
            'title'          : 'title',
            'item'           : 'title',
            'count'          : 'count',
            'bandwidth'      : 'bandwidth',
            'peak'           : 'peakCount',
            'peak-bandwidth' : 'peakBandwidth'
        };

    /**
     *  Process all of the ticks in this time slot to generate summary data.
     */
    scan(): void {
        for (let n= this.firstIndex; n <= this.lastIndex; n++) {
            const tick = this.ticks[n];
            if (n == this.firstIndex) {
                this.totals = new SlotItem(tick);
            } else if (this.totals != null) {
                this.totals.inc(tick);
            }
            const index = this.find(tick);
            if (index < 0) {
                this.items.push(new SlotItem(tick));
            } else {
                this.inc(index, tick);
            }
        }

        if (this.options.order) {
            let field= 'count';
            if (TimeSlot.sortFieldLookup[this.options.order]) {
                field = TimeSlot.sortFieldLookup[this.options.order];
            }
            if (field == 'title') {
                this.items = sortOn(this.items, field);
            } else {
                this.items = sortOn(this.items, `-${field}`);
            }
        }

    }

    /**
     *  Perform a totals only scan of the TimeSlot.
     */
    totalScan(): void {
        for (let n= this.firstIndex; n <= this.lastIndex; n++) {
            const tick = this.ticks[n];
            if (n == this.firstIndex) {
                this.totals = new SlotItem(tick);
            } else if (this.totals != null) {
                this.totals.inc(tick);
            }
        }
    }

    /**
     *  @returns the number of items in the TimeSlot.
     */
    nItems(): number {
        return this.items.length;

    }

    /**
     *  Access an item in the TimeSlot.
     *  @arg n index of the item.
     */
    getItem(n: number): SlotItem {
        if ((n < 0) || (n >= this.items.length)) {
            throw new RangeError('Index is out-of-bounds.');
        }
        return this.items[n];
    }

    /**
     *  Access the totals associated with this TimeSlot.
     */
    getTotals(): SlotItem | undefined {
        return this.totals;
    }
}
