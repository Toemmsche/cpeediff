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



export class EditOperation {

    type;
    oldPath;
    newPath;
    newContent;

    constructor(type, oldPath = null, newPath = null, newContent = null) {
        this.type = type;
        this.oldPath = oldPath;
        this.newPath = newPath;
        this.newContent = newContent;
    }

    toString() {
        return this.type + " " +
            (this.oldPath !== null ? this.oldPath + " " : "") +
            (this.oldPath !== null && this.newPath !== null  ? "-> " : "") +
            (this.newPath !== null ? this.newPath + " " : "") +
            (this.newContent !== null ? this.newContent + " " : "");
    }
}