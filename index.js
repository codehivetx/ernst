#!/usr/bin/env node

/*
  Copyright (c) 2023-2024 Code Hive Tx, LLC
  SPDX-License-Identifier: Apache-2.0
*/

const { spawn } = require('node:child_process');
const { SerialPort } = require('serialport')
const { name, version } = require('./package.json');
const { readFileSync } = require('node:fs');
const config = JSON.parse(readFileSync('./config.json', 'utf-8'));
const { baudRate, portPath, saltCmd, saltArgs } = config;
const port = new SerialPort({ path: portPath, baudRate })

// print a welcome message to the console
console.log(name, version, portPath, baudRate);

// TODO: localize!
function now() {
    return new Date().toLocaleString("en");
}

// Greeting message.
// TODO: parameterize
const HELLOMSG = `${name} ${version}\n\r\n\r` + `Send a '*' to connect to SALT\n\r\n\r`;

// the spawned command
let salt = null;

// timeout till we say hello again
let timeout = null;

// Countdown until we say hello again if no text comes in
let cc = 100;

// initial hello of 5 seconds
timeout = setTimeout(() => sayHello(), 5000);

// greet the user
function sayhello() {
    if (timeout) {
        clearTimeout(timeout);
        cc = 100;
    }
    port.write(now() + "\r\n" + HELLOMSG, function (err) {
        if (err) {
            return console.log('Error on write: ', err.message)
        }
        console.log('message written');
        if (!salt) {
            // greet the user again 15s later.
            timeout = setTimeout(() => sayhello(), 15000);
        }
    });
}

// greet the user once. Then, on a timeout
sayhello();

// spinner while waiting for the sublaunched program to write something
let spin = 0;
let spinInterval = null;

// data handler
port.on('data', function (data) {
    if (salt) {
        clearTimeout(timeout);
        timeout = null;
        cc = 100;
        // forward data
        const str = data.toString('utf-8');
        const str2 = str.replaceAll('\r', ''); // strip CR (TODO: configurable?)
        salt.stdin.write(str2);
    } else {
        const str = data.toString('utf-8');

        console.log('Data:', data.toString('utf-8'));

        // If they type a '*' then connect.
        if (str === '*') {
            port.write('\r\nConnecting...');
            spinInterval = setInterval(() => { port.write('\b' + (`/|\\-`[(++spin) % 4])) }, 500);
            console.log('connect');

            salt = spawn(saltCmd, saltArgs);

            salt.stdout.on('data', (data) => port.write(data, (err) => {
                clearInterval(spinInterval);
                console.error(err);
            }));

            salt.stderr.on('data', (data) => port.write(data, (err) => {
                clearInterval(spinInterval);
                console.error(err);
            }));

            salt.on('close', (code) => {
                port.write('\n\r\n\rDISCONNECTED\n\r\n\r', () => { });
                console.error(`salt close with ${code}`);
                salt = null;
                sayhello();
            });

        } else {
            // if we get enough garbage input, say hello again
            cc--;
            if (cc < 10) {
                timeout = setTimeout(() => sayhello(), 15000);
            }
        }
    }
});

// log errs to console
port.on('error', function (err) {
    console.log('Error: ', err.message)
});

