'use strict';

/* eslint-disable @typescript-eslint/no-require-imports -- LHCI loads configuration through CommonJS. */

const { chromium } = require('playwright');
const config = require('./lighthouserc.json');

config.ci.collect.chromePath = chromium.executablePath();

module.exports = config;
