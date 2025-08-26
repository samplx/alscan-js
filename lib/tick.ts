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

// -------------------------------------------------------------------------

/**
 *  @ctor Tick class constructor.
 *  A summary of a single log entry.
 *  @arg time number of milliseconds since the Epoch.
 *  @arg size in bytes of the request (reply).
 *  @arg item optional item we are tracking.
 */
export class Tick {
    time: number;
    size: number;
    item?: string | undefined;

    constructor(
        time: number,
        size: number | string | undefined,
        item?: string) {

        this.time = time;
        if (typeof size == 'number') {
            this.size = size;
        } else if (size === undefined) {
            this.size = 0;
        } else {
            this.size = parseInt(size, 10);
            if (isNaN(this.size)) {
                this.size = 0;
            }
        }
        this.item = item;
    }
}

