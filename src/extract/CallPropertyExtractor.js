import {Dsl} from '../Dsl.js';
import {CallProperties} from './CallProperties.js';
import {Logger} from '../../util/Logger.js';

/**
 * Extractor class for caching the semantic properties of Calls.
 * @implements {ExtractorInterface<CallProperties>}
 */
export class CallPropertyExtractor {
  /**
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
      const msg = 'Cannot compute call properties for non-call node';
      Logger.error(msg, new Error(msg), this);
    }
    const endpoint = call.attributes.get(Dsl.CALL_PROPERTIES.ENDPOINT.label);

    let method;
    let label;
    let args;
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
      args = parameters
          .children
          .find((property) =>
            property.label === Dsl.CALL_PROPERTIES.ARGUMENTS.label)
          ?.children
          .map((arg) => arg.label);
      if (args == null) {
        args = [];
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
        new CallProperties(endpoint, method, args, code, label),
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
