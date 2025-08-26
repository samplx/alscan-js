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

import * as stream from "node:stream" ;

// new-line
const NL = 10;

export class LineStream extends stream.Transform {
    _buffer: string;

    /**
     *  @ctor LineStream constructor.
     *  @param options for Stream.
     */
    constructor(options: stream.TransformOptions) {
        super(options);
        this._buffer = '';
    }

    /**
     *  Stream filter standard function.
     *  @param chunk block of data to translate.
     *  @param encoding of the stream.
     *  @param done callback.
     */
    override _transform(chunk: Buffer | string | any, _encoding: string, done: Function) {
        let first = 0;
        for (let n=0; n < chunk.length; n++) {
            if (chunk[n] == NL) {
                let segment: string;
                if (first === 0) {
                    segment = this._buffer + chunk.slice(0, n+1);
                    this._buffer = '';
                } else {
                    segment = chunk.slice(first, n+1);
                }
                this.push(segment);
                first = n+1;
            }
        }
        if (first < chunk.length) {
            this._buffer += chunk.slice(first);
        }
        done();
    }

    /**
     *  Stream filter standard _flush function.
     *  @param done callback.
     */
    override _flush(done: Function): void {
        if (this._buffer.length > 0) {
            this.push(this._buffer);
        }
        done();
    }
}

