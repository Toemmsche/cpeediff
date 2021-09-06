import {Dsl} from '../config/Dsl.js';
import {CallProperties} from './CallProperties.js';
import {Logger} from '../util/Logger.js';

/**
 * Extractor for retrieving and caching the semantic properties of Calls.
 * @implements {ExtractorInterface<CallProperties>}
 */
export class CallPropertyExtractor {
  /**
   * @inheritDoc
   * @type {Map<Node,CallProperties>}
   * @protected
   */
  _memo;

  /**
   * Extract the call properties for a Call and cache them.
   * @param {Node} call The call node.
   * @protected
   */
  _extract(call) {
    if (!call.isCall()) {
      Logger.error('Cannot compute call properties for non-call node', this);
    }
    const endpoint = call.attributes.get(Dsl.CALL_PROPERTIES.ENDPOINT.label);

    let method;
    let label;
    let argKeys;
    let argVals;
    const parameters =
        call
            .children
            .find((property) =>
              property.label === Dsl.CALL_PROPERTIES.PARAMETERS.label);
    if (parameters != null) {
      method =
          parameters
              .children
              .find((property) =>
                property.label === Dsl.CALL_PROPERTIES.METHOD.label)?.text;
      label =
          parameters
              .children
              .find((property) =>
                property.label === Dsl.CALL_PROPERTIES.LABEL.label)
              ?.text;
      const argsParent = parameters
          .children
          .find((property) =>
            property.label === Dsl.CALL_PROPERTIES.ARGUMENTS.label);
      argKeys = argsParent
          ?.children
          .map((arg) => arg.label);
      argVals = argsParent
          ?.children
          .map((arg) => arg.text);
      if (argKeys == null) {
        argKeys = [];
        argVals = [];
      }
    }
    const code =
        call
            .children
            .find((property) =>
              property.label === Dsl.CALL_PROPERTIES.CODE.label)
            ?.children
            // sort code nodes (e.g., finalize, prepare, rescue, update)
            // by label to guarantee String equality on equal code
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((codeNode) => codeNode.text)
            .join('');
    this._memo.set(
        call,
        new CallProperties(endpoint, method, label, argKeys, argVals, code),
    );
  }

  /**
   * Get the properties of a call. If they are not cached,
   * calculate and cache it first.
   * @param {Node} call
   * @return {CallProperties}
   */
  get(call) {
    if (!this._memo.has(call)) {
      this._extract(call);
    }
    return this._memo.get(call);
  }

  /**
   * Create a new Extractor instance
   */
  constructor() {
    this._memo = new Map();
  }
}
