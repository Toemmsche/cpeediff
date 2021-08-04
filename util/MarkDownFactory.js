/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {markdownTable} from "markdown-table";
import {DiffTestResult} from "../test/result/DiffTestResult.js";

export class MarkDownFactory {

    static tabularize(sources) {
        if (sources.length > 0) {
            switch (sources[0].constructor) {
                case DiffTestResult:
                    return markdownTable([DiffTestResult.header(), ...sources.map(res => res.valArr())]);
                default:
                    return this._tabularizePrimitives(sources);
            }
        }
    }

    static _tabularizePrimitives(diffResults) {
        const table = [];
        const header = [];
        for (const property in diffResults[0]) {
            const v = diffResults[0][property];
            //only accept serializable values
            if (this._isPrimitive(v)) {
                header.push(property);
            }

        }
        table.push(header);
        for (const result of diffResults) {
            //only accept serializable values
            table.push(Object.values(result).filter(v => this._isPrimitive(v)));
        }
        return markdownTable(table);
    }

    static _isPrimitive(val) {
        return val !== Object(val);
    }

    s
}

