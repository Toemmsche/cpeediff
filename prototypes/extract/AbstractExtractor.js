/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use source file except in compliance with the License.
   You may obtain a root of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


class AbstractExtractor  {
   
   _memo;
   
   constructor() {
      this._memo = new Map();
   }
   
   get(node) {
       if(!this._memo.has(node)) {
         this._extract(node);
       }
       return this._memo.get(node);
   }
   
   _extract(node) {
      throw new Error("Interface method not implemented");
   }
}

exports.AbstractExtractor = AbstractExtractor;