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

import {LogMessage} from "./LogMessage.js";
import {Config} from "../src/Config.js";

/**
 * A simple logging class.
 * @property {Object} LOG_LEVELS The available log levels.
 * Their intended usage is described in more detail in the respective functions.
 */
export class Logger {

    static LOG_LEVELS = {
        STAT: "STAT",
        INFO: "INFO",
        DEBUG: "DEBUG",
        WARN: "WARN",
        ERROR: "ERROR"
    }
    /**
     * Wether logging is enabled.
     * @type {boolean}
     * @private
     */
    static _enabled = true;

    /**
     * Helper variable for {@see startTimed} and {@see endTimed}
     * @type Number
     * @private
     */
    static _startTime;

    /**
     * Create a log with log level INFO.
     * Info logs provide information about the state of an application and represent expected behaviour.
     * The log is printed to stdout if logging is enabled and the application log level is set to ALL.
     * @param {String} message The message to log as INFO.
     * @param {Object} source The caller object
     */
    static info(message, source = null) {
        if (this._enabled && Config.LOG_LEVEL === Config.LOG_LEVELS.ALL) {
            const logMessage = new LogMessage(this.LOG_LEVELS.INFO, message, source);
            console.log(logMessage.toString());
        }
    }

    /**
     * Create a log with log level STAT.
     * Statistical logs provide quantitative information and metrics about the execution of a module.
     * The log is printed to stdout if logging is enabled and the application log level is set to ALL.
     * @param {String} message The message to log as STAT.
     * @param {Object} source The caller object
     */
    static stat(message, source = null) {
        if (this._enabled && Config.LOG_LEVEL === Config.LOG_LEVELS.ALL) {
            const logMessage = new LogMessage(this.LOG_LEVELS.STAT, message, source);
            console.log(logMessage.toString());
        }
    }

    /**
     * Create a log with log level DEBUG.
     * Debug logs provide a way for developers to gain insight into the internals of the application during runtime.
     * The log is printed to stderr if logging is enabled and the application log level is set to ALL.
     * @param {String} message The message to log as DEBUG
     * @param {Object} source The caller object
     */
    static debug(message, source = null) {
        if (this._enabled && Config.LOG_LEVEL === Config.LOG_LEVELS.ALL) {
            const logMessage = new LogMessage(this.LOG_LEVELS.DEBUG, message, source);
            console.error(logMessage.toString());
        }
    }

    /**
     * Create a log with log level WARN.
     * Warning logs indicate a dangerous state or potentially unwanted behaviour of the application.
     * The log is printed to stdout if logging is enabled and the application log level is at least set to WARN.
     * @param {String} message The message to log as WARN
     * @param {Object} source The caller object
     */
    static warn(message, source = null) {
        if (this._enabled &&
            (Config.LOG_LEVEL === Config.LOG_LEVELS.ALL || Config.LOG_LEVEL === Config.LOG_LEVELS.WARN)) {
            const logMessage = new LogMessage(this.LOG_LEVELS.WARN, message, source);
            console.log(logMessage.toString());
        }
    }

    /**
     * Create a log with log level ERROR.
     * Error logs indicate a faulty state of the system that, if not addressed immediately,
     * will lead to the termination of the application.
     * The log is printed to stderr if logging is enabled.
     * The supplied error object is thrown and will cause the termination of the application
     * if not handled by a caller in the stack.
     * @param {String} message The message to log as ERROR
     * @param {Error} error The underlying error object
     * @param {Object} source The caller object
     */
    static error(message, error, source = null) {
        if (this._enabled) {
            const logMessage = new LogMessage(this.LOG_LEVELS.ERROR, message, source);
            console.error(logMessage.toString());
        }
        throw error;
    }

    /**
     * Publish a result to stdout without any additional information like log level or caller class.
     * @param {String} message The result to log.
     * @param {Object} source The caller object
     */
    static result(message, source = null) {
        console.log(message);
    }

    /**
     * Disable logging. Result logs are not affected.
     * @return boolean If logging was previously enabled
     */
    static disableLogging() {
        const wasEnabled = this._enabled;
        this._enabled = false;
        return wasEnabled;
    }

    /**
     * Enable logging. Result logs are not affected.
     */
    static enableLogging() {
        this._enabled = true;
    }

    /**
     *  Start a timer if logging is enabled.
     */
    static startTimed() {
        if (this._enabled) {
            this._startTime = new Date().getTime();
        }
    }

    /**
     * End the timer if logging is enabled and return the elapsed time.
     * @returns {Number} The elapsed time in milliseconds.
     */
    static endTimed() {
        if (this._enabled) {
            if (this._startTime == null) {
                //Timer was reset by someone else in the meantime. This is not fatal but may invalidate stats.
                this.warn("Bad timer", this);
            }
            const elapsedTime = new Date().getTime() - this._startTime;
            this._startTime = null;
            return elapsedTime;
        }
    }

}