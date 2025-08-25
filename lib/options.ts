/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2025 James Burlingame
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

export interface AlscanOptions {
    accounts?: Array<string>;
    alllogs?: boolean | undefined;
    archive?: boolean | undefined;
    category?: string | undefined;
    directories?: Array<string> | undefined;
    domains?: Array<string>;
    domlogs?: boolean | undefined;
    error?: boolean | undefined;
    files?: Array<string>;
    keepOutside?: boolean | undefined;
    main?: boolean | undefined;
    panel?: boolean | undefined;
    start?: Date | undefined;
    stop?: Date | undefined;
    timeSlot?: number | undefined;
}
