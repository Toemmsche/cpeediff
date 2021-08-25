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

import {XyDiffAdapter} from '../diff_adapters/XyDiffAdapter.js';
import {XmlDiffAdapter} from '../diff_adapters/XmlDiffAdapter.js';
import {DiffXmlAdapter} from '../diff_adapters/DiffXmlAdapter.js';
import {XccAdapter} from '../diff_adapters/XccAdapter.js';
import fs from 'fs';
import {TestConfig} from '../TestConfig.js';
import {BalancedCpeeMatchAdapter} from '../match_adapters/BalancedCpeeMatchAdapter.js';
import {QualityCpeeMatchAdapter} from '../match_adapters/QualityCpeeMatchAdapter.js';
import {FastCpeeMatchAdapter} from '../match_adapters/FastCpeeMatchAdapter.js';
import {CpeeDiffAdapter} from '../diff_adapters/CpeeDiffAdapter.js';
import {Config} from '../../src/Config.js';

export class AbstractEvaluation {

  adapters;

  constructor(adapters = []) {
    this.adapters = adapters;
  }

  static diffAdapters() {
    let adapters = [new XyDiffAdapter(), new XccAdapter(), new XmlDiffAdapter(), new DiffXmlAdapter()];
    adapters = adapters.filter(a => fs.existsSync(a.path + '/' + TestConfig.FILENAMES.RUN_SCRIPT));
   for(const matchMode of Config.MATCH_MODES) {
     adapters.unshift(new CpeeDiffAdapter(matchMode));
   }
    return adapters;
  }

  static matchAdapters() {
    let adapters = [];
    adapters = adapters.filter(a => fs.existsSync(a.path + '/' + TestConfig.FILENAMES.RUN_SCRIPT));
    adapters.unshift(new QualityCpeeMatchAdapter(), new BalancedCpeeMatchAdapter(), new FastCpeeMatchAdapter());
    return adapters;
  }

  static all() {

  }

  evalAll() {

  }

}

