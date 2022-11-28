"use strict"

const hello = require('./hello/main.js');
const app = hello;

const caf_core= require('caf_core');
const caf_comp = caf_core.caf_components;
const myUtils = caf_comp.myUtils;
const async = caf_comp.async;
const cli = caf_core.caf_cli;

const crypto = require('crypto');

const APP_FULL_NAME = 'root-smtp';

const CA_OWNER_1='me'+ crypto.randomBytes(8).toString('hex');
const CA_LOCAL_NAME_1='ca1';
const FROM_1 =  CA_OWNER_1 + '-' + CA_LOCAL_NAME_1;
const FQN_1 = APP_FULL_NAME + '#' + FROM_1;

process.on('uncaughtException', function (err) {
               console.log("Uncaught Exception: " + err);
               console.log(myUtils.errToPrettyStr(err));
               process.exit(1);

});

module.exports = {
    setUp: function (cb) {
       const self = this;
        app.init( {name: 'top'}, 'framework.json', null,
                      function(err, $) {
                          if (err) {
                              console.log('setUP Error' + err);
                              console.log('setUP Error $' + $);
                              // ignore errors here, check in method
                              cb(null);
                          } else {
                              self.$ = $;
                              cb(err, $);
                          }
                      });
    },
    tearDown: function (cb) {
        const self = this;
        if (!this.$) {
            cb(null);
        } else {
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },

    send: function(test) {
        const self = this;
        let s1;
        const from1 = FROM_1;
        test.expect(6);
        let lastId;
        async.series(
            [
                function(cb) {
                    s1 = new cli.Session('ws://root-smtp.localtest.me:3000',
                                         from1, {
                                             from : from1
                                         });
                    s1.onopen = async function() {
                        try {
                            await s1.dirtySend('test1', "<b>test1</b>")
                                .getPromise();
                            test.ok(true);
                            cb(null);
                        } catch (err) {
                            test.ok(false, 'Got exception ' + err);
                            cb(err);
                        }
                    };
                },

                // transactional call
                async function(cb) {
                    try {
                        const d = await s1.send('test2', "<b>test2</b>")
                              .getPromise();
                        test.ok(d.pendingId, 'should get an id');
                        lastId = d.pendingId;
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                function(cb) {
                    setTimeout(() => cb(null), 1000);
                },
                async function(cb) {
                    try {
                        const d = await s1.getState().getPromise();
                        test.equal(d.pendingId, lastId, 'should get same id');
                        test.equals(d.nCalls, 1);
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                function(cb) {
                    s1.onclose = function(err) {
                        test.ifError(err);
                        cb(null, null);
                    };
                    s1.close();
                }
            ], function(err, res) {
                test.ifError(err);
                test.done();
            });
    }

};
