/**
 * Represents a single log #message. Helper class for the Logger.
 *
 * @see {Logger}
 */
export class LogMessage {
  /**
   * The log type.
   * @type {String}
   * @private
   * @const
   */
  #type;
  /**
   * The contained message.
   * @type {String}
   * @private
   * @const
   */
  #message;
  /**
   * The object that published the log.
   * @type {?Object}
   * @private
   * @const
   */
  #source;

  /**
   * Construct a new LogMessage instance.
   * @param {String} type The log type.
   * @param {String} message The contained message.
   * @param {?Object} source The object that published the log.
   */
  constructor(type, message, source) {
    this.#type = type;
    this.#message = message;
    this.#source = source;
  }

  /**
   * @return {String} A String representation of this log message that can (and
   *     should) be printed to the console.
   */
  toString() {
    return '[' + this.#type + ']' +
        (this.#source != null ?
         '<' + this.#source.constructor.name + '>' :
         '') +
        ': ' + this.#message;
  }
}
