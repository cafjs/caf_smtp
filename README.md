# Caf.js

Co-design permanent, active, stateful, reliable cloud proxies with your web app and gadgets.

See https://www.cafjs.com

## Library for sending email using SMTP


This repository contains a `Caf.js` library to send email with SMTP transports.

## Dependencies Warning

To eliminate expensive dependencies for apps in the workspace that do not need `caf_smtp`, the packages `nodemailer@^6.4.11`, and `nodemailer-html-to-text^3.1.0` have been declared as optional dependencies even though they are always needed.

Applications that depend on `caf_smtp` should also include these dependencies in package.json as normal dependencies.

## API

See {@link module:caf_smtp/proxy_smtp}

## Configuration

### framework.json

See {@link module:caf_smtp/plug_smtp}

### ca.json

See {@link module:caf_smtp/plug_ca_smtp}
