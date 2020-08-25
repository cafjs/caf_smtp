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
 * Calls an external app CA method.
 *
 *
 * @module caf_smtp/plug_ca_smtp
 * @augments external:caf_components/gen_plug_ca
 */
// @ts-ignore: augments not attached to a class
const caf_comp = require('caf_components');
const myUtils = caf_comp.myUtils;
const genPlugCA = caf_comp.gen_plug_ca;
const json_rpc = require('caf_transport').json_rpc;

exports.newInstance = async function($, spec) {
    try {
        const that = genPlugCA.create($, spec);

        /*
         * The contents of this variable are always checkpointed before
         * any state externalization (see `gen_transactional`).
         */
        that.state = {}; // handleMethod:string

        // transactional ops
        const target = {
            async sendImpl(id, to, subject, body) {
                const result = [null];
                try {
                    result[1] = await $._.$.smtp.send(to, subject, body);
                } catch (err) {
                    result[0] = err;
                }
                if (that.state.handleMethod) {
                    /* Response processed in a separate transaction, i.e.,
                     using a fresh message */
                    const m = json_rpc.systemRequest(
                        $.ca.__ca_getName__(), that.state.handleMethod,
                        id, result
                    );
                    $.ca.__ca_process__(m, function(err) {
                        err && $.ca.$.log && $.ca.$.log.error(
                            'Got handler exception ' +
                                myUtils.errToPrettyStr(err)
                        );
                    });
                } else {
                    const logMsg = 'Ignoring reply ' + JSON.stringify(result);
                    $.ca.$.log && $.ca.$.log.warn(logMsg);
                }
                return [];
            },
            async setHandleReplyMethodImpl(methodName) {
                that.state.handleMethod = methodName;
                return [];
            }
        };

        that.__ca_setLogActionsTarget__(target);


        that.send = function(to, subject, body) {
            const id = myUtils.uniqueId();
            const allArgs = [id, to, subject, body];
            that.__ca_lazyApply__('sendImpl', allArgs);
            return id;
        };

        that.setHandleReplyMethod = function(methodName) {
            that.__ca_lazyApply__('setHandleReplyMethodImpl', [methodName]);
        };

        that.dirtySend = function(to, subject, body) {
            return $._.$.smtp.send(to, subject, body);
        };

        that.instantiateTemplate = function(template, props) {
            return  $._.$.smtp.instantiateTemplate(template, props);
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
