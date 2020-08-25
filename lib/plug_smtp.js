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
 * Calls an external service to send email.
 *
 *  Properties:
 *
 *       {smtpDir: string=, smtpFile: string, templates: [{name: string,
 *        dir: string|null, fileName: string}]=}
 *
 * where:
 *
 * * `smtpDir:` a directory for the SMTP client config.
 * * `smtpFile`: a json file to configure SMTP. See `nodemailer` documentation
 * for details (https://nodemailer.com)
 * * `templates`: an optional set of mustache templates identified by a `name`
 * and in a file with name `fileName` in directory `dir` (or relative to the
 * first module loaded if `null` or `undefined`).
 *
 * @module caf_smtp/plug_smtp
 * @augments external:caf_components/gen_plug
 */
// @ts-ignore: augments not attached to a class
const assert = require('assert');
const caf_comp = require('caf_components');
const genPlug = caf_comp.gen_plug;
const mustache = require('mustache');

const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const htmlToText = require('nodemailer-html-to-text').htmlToText;

exports.newInstance = async function($, spec) {
    try {
        const that = genPlug.create($, spec);

        let transport = null;

        $._.$.log && $._.$.log.debug('New SMTP plug');

        const smtpDir = spec.env.smtpDir || $.loader.__ca_firstModulePath__();

        const loadSMTP = function(fileName) {
            if (fileName) {
                try {
                    const buf = fs.readFileSync(path.resolve(smtpDir,
                                                             fileName));
                    return JSON.parse(buf.toString('utf8'));
                } catch (err) {
                    return null;
                }
            } else {
                return null;
            }
        };

        assert.equal(typeof spec.env.smtpFile, 'string',
                     "'spec.env.smtpFile' is not a string");
        const smtpConfig = loadSMTP(spec.env.smtpFile);

        if (!smtpConfig) {
            $._.$.log && $._.$.log.warn('SMTP plug disabled');
        } else {
            transport = nodemailer.createTransport(smtpConfig);
            transport.use('compile', htmlToText());
        }

        const loadOneTemplate = function(template) {
            const dir = template.dir || $.loader.__ca_firstModulePath__();
            const mus = fs.readFileSync(path.resolve(dir, template.fileName),
                                        {encoding: 'utf8'});
            mustache.parse(mus); // caching
            return mus;
        };

        const loadTemplates = function(templates) {
            const result = {};
            templates && templates.forEach((x) => {
                result[x.name] = loadOneTemplate(x);
            });
            return result;
        };

        spec.env.templates && assert(Array.isArray(spec.env.templates),
                                     "'spec.env.templates' is not an array");

        const templates = loadTemplates(spec.env.templates);

        that.send = async function(to, subject, body) {
            if (smtpConfig) {
                const mailOptions = {
                    from: smtpConfig.auth && smtpConfig.auth.user,
                    to: to,
                    subject: subject,
                    html: body
                };
                return transport.sendMail(mailOptions);
            } else {
                $._.$.log && $._.$.log.warn(`SMTP: Ignoring send to ${to}`);
                return null;
            }
        };

        that.instantiateTemplate = function(templateName, props) {
            const mus = templates[templateName];
            if (mus) {
                return mustache.render(mus, props);
            } else {
                throw new Error(`Template ${templateName} not found`);
            }
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
