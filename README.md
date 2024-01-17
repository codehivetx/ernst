# Ernst - terminal server in Node.js

## What is this

Ernst is something like [getty](https://linux.die.net/man/8/agetty) but for Node.js.

It spends its time in the following loop:

1. Open a serial port
2. Display a welcome banner
3. If the user requests connection, sublaunch some process
4. Forward text from that process to and from the port
5. Clean up and loop back to step 2


## Why?

This allows you to set up some kind of terminal, whether physical or virtual, and
offer a process over it.

## How to use

1. Create a `config.json` file (as below)
2. `npm i`
3. `node index.js`

### Config

create `config.json`

```json
{
    "portPath": "/dev/tty.whatever",
    "saltCmd": "/usr/bin/ssh",
    "saltArgs": [
        "…"
    ],
    "baudRate": 19200
}
```

## License

Copyright (c) 2023-2024 Code Hive Tx, LLC

SPDX-License-Identifier: Apache-2.0

Licensed under [Apache-2.0](./LICENSE)

## Author

[Steven R. Loomis @srl295](https://github.com/srl295) of [@codehivetx](https://github.com/codehivetx)
