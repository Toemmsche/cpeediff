import {Node} from '../tree/Node.js';
import fs from 'fs';
import {Dsl} from '../Dsl.js';
import xmldom from 'xmldom';
import {Config} from '../Config.js';
import {DomHelper} from '../../util/DomHelper.js';
import {EditScript} from '../diff/EditScript.js';
import {Logger} from '../../util/Logger.js';

/**
 * A parser and preprocessor for CPEE process trees.
 */
export class Preprocessor {
  /**
   * Parse and preprocess a process tree defined in an XML document.
   * @param {String} path A path to the file containing the XML document.
   * @return {Node} The root of the process tree.
   */
  parseFromFile(path) {
    return this.parseWithMetadata(fs.readFileSync(path).toString());
  }

  /**
   * Parse an XML document representing a CPEE process tree.
   * This function also considers data outside the DSL-element tree such as the
   * list of endpoints and data elements.
   * @param {String} xml The XML document as a String.
   * @return {Node} The root of the process tree
   */
  parseWithMetadata(xml) {
    const endpointToUrl = new Map();
    const dataElements = new Map();

    // Skip comments and processing instructions
    const xmlRoot = DomHelper.firstChildElement(
        new xmldom.DOMParser().parseFromString(xml, 'text/xml'));

    let tree;
    if (xmlRoot == null) {
      // Empty tree
      return new Node(Dsl.ELEMENTS.DSL_ROOT.label);
    } else if (xmlRoot.localName === Dsl.ELEMENTS.DSL_ROOT.label) {
      // Hop straight into tree parsing
      tree = Node.fromXmlDom(xmlRoot, true);
    } else {
      // Parse process tree with metadata
      const xmlDescription =
          DomHelper.firstChildElement(xmlRoot, Dsl.ELEMENTS.DSL_ROOT.label) ||
          DomHelper.firstChildElement(
              DomHelper.firstChildElement(xmlRoot, Dsl.XML_DOC.WRAPPER),
              Dsl.ELEMENTS.DSL_ROOT.label,
          );
      if (xmlDescription == null) {
        Logger.error('Cannot find DSL root, malformed process model?', this);
      }

      tree = Node.fromXmlDom(xmlDescription, true);

      // Parse endpoints
      const xmlEndpoints =
          DomHelper.firstChildElement(xmlRoot, Dsl.XML_DOC.ENDPOINTS);
      DomHelper.forAllChildElements(xmlEndpoints, (xmlEndpoint) => {
        endpointToUrl.set(xmlEndpoint.localName, xmlEndpoint.firstChild.data);
      });

      // Parse initial values for data elements
      const xmlDataElements =
          DomHelper.firstChildElement(xmlRoot, Dsl.XML_DOC.DATA_ELEMENTS);
      DomHelper.forAllChildElements(xmlDataElements, (xmlDataElement) => {
        dataElements.set(
            xmlDataElement.localName,
            xmlDataElement.firstChild.data,
        );
      });
    }
    // Preprocess in any case
    return this.preprocess(tree, endpointToUrl, dataElements);
  }

  /**
   * Preprocess a process tree. This removes empty elements and trims
   * all String content of leading or trailing whitespaces.
   * @param {Node} tree The root node of the process tree
   * @param {Map<String, String>} endpointToUrl A map of endpoint IDs to URIs
   * @param {Map<String, String>} dataElements A map of data elements (=
   *     variables) to their initial value
   * @param {EditScript}editScript An edit script for recording the edit
   *     operations applied to th
   * @return {Node} The root of the preprocessed tree
   */
  preprocess(tree, endpointToUrl = new Map(),
      dataElements = new Map(), editScript = new EditScript()) {
    // traverse tree in post-order (bottom-up)
    for (const node of tree.toPostOrderArray()) {
      let updated = false;
      let deleted = false;

      // only preserve semantically relevant attributes
      for (const key of node.attributes.keys()) {
        if (node.attributes.get(key) === '') {
          node.attributes.delete(key);
          updated = true;
        } else {
          // trim attribute value
          const val = node.attributes.get(key);
          const trimmedVal = val.trim();
          // TODO trim ends of newlines
          if (trimmedVal !== val) {
            node.attributes.set(key, trimmedVal);
            updated = true;
          }
        }
      }
      // replace endpoint identifier with actual URL
      if (node.attributes.has(Dsl.CALL_PROPERTIES.ENDPOINT.label)) {
        const endpoint =
            node.attributes.get(Dsl.CALL_PROPERTIES.ENDPOINT.label);
        // replace endpoint identifier with actual endpoint URL (if it exists)
        if (endpointToUrl.has(endpoint)) {
          node.attributes.set(
              Dsl.CALL_PROPERTIES.ENDPOINT.label,
              endpointToUrl.get(endpoint),
          );
          updated = true;
        }
      } else if (node.isCall()) {
        node.attributes.set(
            Dsl.CALL_PROPERTIES.ENDPOINT.label,
            Math.floor(Math.random * 1000000).toString(),
        ); // random endpoint
        updated = true;
      }

      // trim irrelevant nodes
      if (node.isEmpty()) {
        node.removeFromParent();
        deleted = true;
      }

      // trim data
      if (node.text != null) {
        const newText = node.text.trim();
        if (newText !== node.text) {
          node.text = newText;
          updated = true;
        }
      }

      if (deleted) {
        editScript?.appendDeletion(node);
      } else if (updated) {
        editScript?.appendUpdate(node);
      }
    }

    if (Config.ADD_INIT_SCRIPT && dataElements.size > 0) {
      // insert initializer for all declared variables at beginning of tree
      const script = new Node(Dsl.ELEMENTS.SCRIPT.label);
      script.text = '';
      script.attributes.set('id', 'init');
      for (const [dataElement, initialValue] of dataElements) {
        script.text += Config.VARIABLE_PREFIX + dataElement +
            ' = ' + initialValue + ';';
      }
      tree.insertChild(0, script);

      editScript?.appendInsertion(script);
    }

    if (editScript.size() > 0) {
      Logger.warn('Document was modified during preprocessing, ' +
          editScript.insertions() + ' insertions, ' +
          editScript.moves() + ' moves, ' +
          editScript.updates() + ' updates, ' +
          editScript.deletions() + ' deletions', this);
    }

    return tree;
  }
}
