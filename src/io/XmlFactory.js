/*
    Copyright 2021 Tom Papke

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http=//www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import xmldom from 'xmldom';
import vkbeautify from 'vkbeautify';
import {XmlDomFactory} from './XmlDomFactory.js';
import {Dsl} from '../Dsl.js';
import {Config} from '../Config.js';

export class XmlFactory {

  static serialize(object) {
    const doc = xmldom.DOMImplementation.prototype.createDocument(Dsl.DEFAULT_NAMESPACE);
    const root = XmlDomFactory.convert(object);
    doc.appendChild(root);
    let xmlString = new xmldom.XMLSerializer().serializeToString(doc);
    if (Config.PRETTY_XML) {
      xmlString = vkbeautify.xml(xmlString);
    }
    return xmlString;
  }
}