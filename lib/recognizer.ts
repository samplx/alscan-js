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

import { AccessLogEntry } from "./accesslog.ts";

// indicate AND of all operands
const AND_OP = 'and';
// indicate OR of all operands
const OR_OP = 'or';

type AN_OP = 'and' | 'or';

type Item = any;
export type RecognizerFunc = (field: unknown) => boolean;

export class Recognizer {
    field: keyof AccessLogEntry;
    op?: AN_OP;
    operands?: Array<Item>;
    func?: RecognizerFunc;

    /**
     *  @ctor Recognizer constructor.
     *  @param field is the name of the field to match.
     *  @param func callback returns true on a match.
     *  @param op is either AND_OP or OR_OP to create a collection of recognizers.
     */
    constructor(
        field: keyof AccessLogEntry,
        func?: RecognizerFunc,
        op?: AN_OP,
    ) {
        this.field = field;
        this.func = func;
        if (op) {
            this.op = op;
            this.operands = [];
        } else if (func) {
            this.func = func;
        } else {
            throw new Error(`Either func or op must be defined`);
        }
    }

    /**
     *  Determine if this is a collection.
     *  @returns true if this is a collection of recognizers.
     */
    isCollection(): boolean {
        return (Array.isArray(this.operands));
    };

    /**
     *  Add criteria to this Recognizer.
     *  @param field to check.
     *  @param item.
     */
    addItem(field: keyof AccessLogEntry, item: Item): void {
        if (!this.isCollection() || !Array.isArray(this.operands)) {
            throw new TypeError('Cannot add to a non-collection recognizer.');
        }

        for (let n=0; n < this.operands.length; n++) {
            if (this.operands[n].field == field) {
                if (!this.operands[n].isCollection()) {
                    const old = this.operands[n];
                    this.operands[n] = new Recognizer(field, undefined, OR_OP);
                    this.operands[n].operands.push(old);
                }
                this.operands[n].operands.push(item);
                return;
            }
        }
        this.operands.push(item);
    };

    /**
     *  Determine if the record matches this Recognizer.
     *  @param record access log data.
     */
    matches(record: AccessLogEntry): boolean {
        if (this.isCollection() && Array.isArray(this.operands)) {
            const match = (operand: { matches: (arg0: AccessLogEntry) => any; }) => operand.matches(record);
            if (this.op == AND_OP) {
                return this.operands.every(match);
            }
            if (this.op == OR_OP) {
                return this.operands.some(match);
            }
            return false;
        }
        if (this.func) {
            return this.func(record[this.field]);
        }
        return false;
    };

    /**
     * clear existing operands (used for testing)
     */
    clear(): void {
        this.operands = [];
    }

    /** Regular expression of an IPv4 dotted decimal address. */
    static ipv4Pattern: RegExp = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/);
    /** Regular expression of an IPv4 dotted decimal address with CIDR mask. */
    static ipv4maskPattern: RegExp = new RegExp(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?/);

    static ipMatch(host: string, addressMask: string): boolean {
        const hostMatch = Recognizer.ipv4Pattern.exec(host);
        if (hostMatch === null) {
            return host == addressMask;       // only match numeric IPv4 (for now)
        }
        const addressMatch = Recognizer.ipv4maskPattern.exec(addressMask);
        if ((addressMatch === null) || (addressMatch[5] === undefined)) {
            return host == addressMask;
        }
        const bits = parseInt(addressMatch[6], 10);
        if (Number.isNaN(bits) || (bits <= 0) || (bits >= 32)) {
            return host == addressMask;
        }
        var mask = 0;
        for (var n=32; n > bits; n--) {
            mask = (mask << 1) + 1;
        }
        mask = ~mask;
        const hostIP = (parseInt(hostMatch[1], 10) * 16777216) +
                    (parseInt(hostMatch[2], 10) * 65536) +
                    (parseInt(hostMatch[3], 10) * 256) +
                        parseInt(hostMatch[4], 10);
        const address= (parseInt(addressMatch[1], 10) * 16777216) +
                    (parseInt(addressMatch[2], 10) * 65536) +
                    (parseInt(addressMatch[3], 10) * 256) +
                        parseInt(addressMatch[4], 10);
        return ((hostIP & mask) == (address & mask));
    }

}

const recognizer = new Recognizer('ident', undefined, AND_OP);

/**
 *  Add an exact value match recognizer.
 *  @param field to match.
 *  @param value to match.
 */
export function addValue(field: keyof AccessLogEntry, value: unknown): void {
    const item = new Recognizer(field, (v) => (v == value));
    recognizer.addItem(field, item);
}

/**
 *  Add an ignore case value match recognizer.
 *  @param field to match.
 *  @param value to match.
 */
export function addValueNC(field: keyof AccessLogEntry, value: unknown): void {
    if (value) {
        const lcValue = value.toString().toLowerCase();
        const item = new Recognizer(field,
            (v) => (v ? (v.toString().toLowerCase() == lcValue): false));
        recognizer.addItem(field, item);
    }
}

/**
 *  Add a pattern match recognizer.
 *  @param field to match.
 *  @param pattern RegExp to match.
 */
export function addPattern(field: keyof AccessLogEntry, pattern: RegExp | string): void {
    if (pattern instanceof RegExp) {
        const item = new Recognizer(field, (v) => pattern.test(v ? v.toString() : ''));
        recognizer.addItem(field, item);
    } else {
        const re = new RegExp(pattern);
        const item = new Recognizer(field, (v) => re.test(v ? v.toString() : ''));
        recognizer.addItem(field, item);
    }
}

/**
 *  Add an IP recognizer.
 *  @param addressMask dotted decimal address with optional mask.
 */
export function addIP(addressMask: string) {
    const item = new Recognizer('host', (v) => v ? Recognizer.ipMatch(v.toString(), addressMask) : false);
    recognizer.addItem('host', item);
}

/**
 *  Test if the input record matches.
 *  @param record access log data to check.
 */
export function matches(record: AccessLogEntry): boolean {
    return recognizer.matches(record);
}

/**
 * Clear the recognizer.
 */
export function clearRecognizer(): void {
    recognizer.clear();
}
