/*!
 Copyright 2020 Caf.js Labs and contributors

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

'use strict';

/**
 *  Proxy that allows a CA to send email.
 *
 * @module caf_smtp/proxy_smtp
 * @augments external:caf_components/gen_proxy
 */
// @ts-ignore: augments not attached to a class
const caf_comp = require('caf_components');
const genProxy = caf_comp.gen_proxy;

exports.newInstance = async function($, spec) {
    try {
        const that = genProxy.create($, spec);

        /**
         * Blocking email send.
         *
         * There is no checkpointing for this action, and this call may never
         * be executed if, e.g., the server fails.
         *
         * @param {string} to A destination email address.
         * @param {string} subject A subject line.
         * @param {string} body The message body (html expected).
         *
         * @return {Promise<Object>}  A promise that we can `await` to
         * block further message processing. The promise is rejected with an
         * if the message cannot be sent.
         *
         * @memberof! module:caf_smtp/proxy_smtp#
         * @alias dirtySend
         */
        that.dirtySend = function(to, subject, body) {
            return $._.dirtySend(to, subject, body);
        };

        /**
         * Non-Blocking email send.
         *
         * The action is checkpointed first, executing at least once. Calls do
         * not block message processing for this CA, and responses can be
         * arbitrarily interleaved with new requests.
         *
         * The result of this operation is processed in a separate message with
         * the handle method previously set by `setHandleReplyMethod`.
         *
         * A unique id is returned to match responses.
         *
         * @param {string} to A destination email address.
         * @param {string} subject A subject line.
         * @param {string} body The message body (html expected).
         *
         * @return {string} A unique identifier to match
         * replies for this request.
         *
         * @memberof! module:caf_smtp/proxy_smtp#
         * @alias send
         */
        that.send = function(to, subject, body) {
            return $._.send(to, subject, body);
        };

        /**
         * Sets the name of the method in this CA that will process
         * reply `send` messages.
         *
         * The type of the method is `async function(requestId, response)`
         *
         * where:
         *
         *  *  `requestId`: is an unique identifier to match the request.
         *  *  `response` is a tuple using the standard  `[Error, jsonType]`
         * Caf.js convention.
         *
         * @param {string| null} methodName The name of this CA's method that
         *  process replies.
         *
         * @memberof! module:caf_smtp/proxy_smtp#
         * @alias setHandleReplyMethod
         *
         */
        that.setHandleReplyMethod = function(methodName) {
            $._.setHandleReplyMethod(methodName);
        };

        /**
         * Instantiates a preloaded mustache template with some properties.
         *
         * @param {string} templateName The name of the preloaded template.
         * @param {Object} props The properties to instantiate the template.
         *
         * @return {string} The instantiated template.
         *
         * @throws {Error} When template not found.
         *
         * @memberof! module:caf_smtp/proxy_smtp#
         * @alias instantiateTemplate
         *
         */
        that.instantiateTemplate = function(templateName, props) {
            return $._.instantiateTemplate(templateName, props);
        };

        Object.freeze(that);

        return [null, that];
    } catch (err) {
        return [err];
    }
};
