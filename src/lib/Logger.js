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
import {log} from "util";
import {stat} from "fs";

/**
 * A simple logging class.
 * @property {Object} LOG_LEVELS The five log levels available
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
     * A default handler that prints the formatted log message to stdout.
     * @param {LogMessage} logMsg The incoming log message.
     * @private
     */
    static _logToConsoleHandler = (logMsg) => {
        console.log(logMsg.toString());
    }

    /**
     * A map of handlers for each log level. By default, log messages are redirected to stdout.
     * @type Map<String,Set<Function>>
     * @private
     */
    static _handlers = new Map();
    /**
     * A list of default handlers for log messages where no specific handlers are available.
     * @type [Function]
     * @private
     */
    static _defaultHandlers = [this._logToConsoleHandler];

    /**
     * Handle an incoming log message.. Either log level specific handlers or default handlers are used.
     * @param {LogMessage} logMsg The incoming log message.
     * @private
     */
    static _handleLog(logMsg) {
        if(this._enabled) {
            //handle with specific handlers
            if(this._handlers.has(logMsg.level)) {
                for(const handler of this._handlers.get(logMsg.level)) {
                    handler(logMsg);
                }
            } else {
                //handle with default handlers
                for(const handler of this._defaultHandlers) {
                    handler(logMsg);
                }
            }
        }
    }

    static info(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.INFO, message, source);
        this._handleLog(logMessage);
    }

    static stat(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.STAT, message, source);
        this._handleLog(logMessage);
    }

    static debug(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.DEBUG, message, source);
        this._handleLog(logMessage);
    }

    static warn(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.WARN, message, source);
        this._handleLog(logMessage);
    }

    static error(message, source = null) {
        const logMessage = new LogMessage(this.LOG_LEVELS.ERROR, message, source);
        this._handleLog(logMessage);
    }

    static _enabled = true;

    static disableLogging() {
     this._enabled = false;
    }

    static enableLogging() {
        this._enabled = true;
    }

    static _startTime;

    static startTimed() {
        this._startTime = new Date().getTime();
    }

    static endTimed() {
        return  new Date().getTime() - this._startTime;
    }

}