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

const {AbstractPatch} = require("../editscript/AbstractEditScript");

/**
 * Result of the LCSDiff Algorithm
 * @see {LCSDiff}
 */
class LCSPatch extends AbstractPatch{

    /**
     * All changes that are part of this patch and the LCS itself
     * @type {LCSLine[]}
     */
    lines = [];

    /**
     * Instantiate an empty LCSPatch object
     */
    constructor() {
        super();
        //LCSDiff does not consider moves or relabels
        this.moves = undefined;
        this.relabels = undefined;
    }

    merge(xml) {

    }

    toString() {
        let str = "";
        for(let line of this.lines) {
            let color = AbstractPatch.white;
            let operator = "";
            switch (line.type) {
                case LCSLine.TypeEnum.LCS:          color = AbstractPatch.cyan;   operator = "";   break;
                case LCSLine.TypeEnum.INSERTION:    color = AbstractPatch.green;  operator = "+";  break;
                case LCSLine.TypeEnum.DELETION:     color = AbstractPatch.red;    operator = "-";  break;
                default:                            color = AbstractPatch.white;  operator = "";
            }
            str += color + operator + " " + line.content + "\n";
        }
        return str;
    }
}

/**
 * Wrapper class for each line considered by the LCSDiff algorithm.
 * This includes inserted lines, deleted lines and lines that are part of the LCS.
 */
class LCSLine {

    /**
     * Each line is either an insertion, deletion or part of the Longest Common Subsequence.
     * @type {{INSERTION: number, LCS: number, DELETION: number}}
     */
    static TypeEnum = {
        INSERTION: 0,
        DELETION: 1,
        LCS: 2
    }

    lineNumber;
    /**
     * Type of change or, if no change, part of LCS
     * @see TypeEnum
     * @type {Number}
     */
    type;
    /**
     * String content of the line
     * @type {String}
     */
    content;

    /**
     * Instantiate an LCSLine object
     * @param {Number} type Type of the line
     * @param {String} content String content of the line
     */
    constructor(type, content) {
        this.type = type;
        this.content = content;
    }
}

exports.LCSPatch = LCSPatch;
exports.LCSLine = LCSLine;