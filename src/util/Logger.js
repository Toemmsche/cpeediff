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

import {LogMessage} from './LogMessage.js';
import {DiffConfig} from '../config/DiffConfig.js';

/**
 * A simple logging class.
 * Their intended usage is described in more detail in the respective functions.
 */
export class Logger {

  /**
   * The available log types.
   * @type {Object}
   * @const
   */
  static LOG_TYPES = {
    STAT: 'STAT',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    WARN: 'WARN',
    ERROR: 'ERROR',
  };
  /**
   * Wether logging is enabled.
   * @type {Boolean}
   * @private
   */
  static #enabled = true;
  /**
   * Helper variable for timed logs.
   * @type {?Number}
   * @private
   */
  static #startTime;

  /**
   * The available log levels that can be passed as command-line arguments.
   * @type {Object}
   * @const
   */
  static LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    ALL: 'all',
  };

  /**
   * A list of colors to beautify the log outputs.
   * @type {Object}
   */
  static COLORS = {
    RED: '\x1b[31m',
    BLUE: '\x1b[34m',
    CYAN: '\x1b[36m',
    YELLOW: '\x1b[33m',
    MAGENTA: '\x1b[35m',
    WHITE: '\x1b[97m',
  };

  /**
   * Create a log with log type ERROR that signals the execution of an
   * abstract method.
   * @param {Object} source The caller object.
   */
  static abstractMethodExecution(source = null) {
    this.error('Execution of an abstract method', source);
  }

  /**
   * Create a log with log type DEBUG.
   * Debug logs provide a way for developers to gain insight into the internals
   * of the application during runtime. The log is printed to stderr if logging
   * is enabled and the application log level is set to ALL.
   * @param {String} message The message to log as DEBUG.
   * @param {Object} source The caller object.
   */
  static debug(message, source = null) {
    if (this.#enabled && DiffConfig.LOG_LEVEL === Logger.LOG_LEVELS.ALL) {
      const logMessage = new LogMessage(this.LOG_TYPES.DEBUG, message, source);
      console.error( logMessage.toString());
    }
  }

  /**
   * Disable logging. Result logs are not affected.
   * @return {Boolean} If logging was previously enabled.
   */
  static disableLogging() {
    const wasEnabled = this.#enabled;
    this.#enabled = false;
    return wasEnabled;
  }

  /**
   * Enable logging conditionally. Result logs are not affected.
   * @param {Boolean} enable If logging should be enabled.
   */
  static enableLogging(enable = true) {
    this.#enabled = enable;
  }

  /**
   * End the timer if logging is enabled and return the elapsed time.
   * @return {Number} The elapsed time in milliseconds.
   */
  static endTimed() {
    if (this.#enabled) {
      if (this.#startTime == null) {
        // Timer was reset by someone else in the meantime. This is not fatal
        // but may invalidate stats.
        this.warn('Bad timer', this);
      }
      const elapsedTime = new Date().getTime() - this.#startTime;
      this.#startTime = null;
      return elapsedTime;
    }
  }

  /**
   * Create a log with log type ERROR.
   * Error logs indicate a faulty state of the system that, if not addressed
   * immediately, will lead to the termination of the application. The log is
   * printed to stderr if logging is enabled.
   * @param {String} message The message to log as ERROR
   * @param {Object} source The caller object.
   */
  static error(message, source = null) {
    if (this.#enabled) {
      const logMessage = new LogMessage(this.LOG_TYPES.ERROR, message, source);
      console.error(logMessage.toString());
    }
    throw new Error(message);
  }

  /**
   * Create a log with log type INFO.
   * Info logs provide information about the state of an application and
   * represent expected behaviour. The log is printed to stdout if logging is
   * enabled and the application log level is set to ALL.
   * @param {String} message The message to log as INFO.
   * @param {Object} source The caller object.
   */
  static info(message, source = null) {
    if (this.#enabled && DiffConfig.LOG_LEVEL === Logger.LOG_LEVELS.ALL) {
      const logMessage = new LogMessage(this.LOG_TYPES.INFO, message, source);
      console.log(logMessage.toString());
    }
  }

  /**
   * Publish a result to stdout without any additional information like log
   * level or caller class.
   * @param {String} message The result to log.
   * @param {Object} source The caller object.
   */
  static result(message, source = null) {
    console.log(message);
  }

  /**
   * Log the beginning of a major section in the execution flow of a component
   * as an INFO log.
   * @param {String} title The title of the section.
   * @param {Object} source The caller object.
   */
  static section(title, source = null) {
    this.info('============' + title + '=============', source);
  }

  /**
   *  Start a timer if logging is enabled.
   */
  static startTimed() {
    if (this.#enabled) {
      this.#startTime = new Date().getTime();
    }
  }

  /**
   * Create a log with log type STAT.
   * Statistical logs provide quantitative information and metrics about the
   * execution of a module. The log is printed to stdout if logging is enabled
   * and the application log level is set to ALL.
   * @param {String} message The message to log as STAT.
   * @param {Object} source The caller object.
   */
  static stat(message, source = null) {
    if (this.#enabled && DiffConfig.LOG_LEVEL === Logger.LOG_LEVELS.ALL) {
      const logMessage = new LogMessage(this.LOG_TYPES.STAT, message, source);
      console.log(logMessage.toString());
    }
  }

  /**
   * Create a log with log type WARN.
   * Warning logs indicate a dangerous state or potentially unwanted behaviour
   * of the application. The log is printed to stdout if logging is enabled and
   * the application log level is at least set to WARN.
   * @param {String} message The message to log as WARN.
   * @param {Object} source The caller object.
   */
  static warn(message, source = null) {
    if (this.#enabled &&
        (DiffConfig.LOG_LEVEL === Logger.LOG_LEVELS.ALL ||
            DiffConfig.LOG_LEVEL === Logger.LOG_LEVELS.WARN)) {
      const logMessage = new LogMessage(this.LOG_TYPES.WARN, message, source);
      console.log(logMessage.toString());
    }
  }
}
