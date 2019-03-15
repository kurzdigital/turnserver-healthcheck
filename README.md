# Turnserver Healthcheck

A microservice to perform health checks on turn servers.

## Configuration

The following environment variables can be set:

### `SERVER_PORT`

The port of the microservice. Defaults to `3000`.

### `TURNSERVER_WHITELIST`

Can be used to restrict the microservice to specific turnservers. If not set, it will allow health-checks for any
turnserver. Multiple turn-servers must be separated by `;` like so:
```
turn:domain.tld:3478?transport=udp;turn:example.com:1234
``` 

### `LOG_LEVEL`

The used log level. Accepts the following values: `error`, `warn`, `info`, `debug`, and `trace`. Defaults to `info`.

### Performing a health-check

A healthcheck can be performed with a simple `HTTTP GET`:

```
curl -X GET 'http://localhost:3000?url=turn:domain.tld:3478%3Ftransport=udp&username=example&credential=example'
```

It accepts the following query parameters:

| Parameter    | Required | Description                                                              |
|--------------|----------|--------------------------------------------------------------------------|
| `url`        | yes      | The turn server url                                                      |
| `username`   | no       | The username, used for authentication                                    |
| `credential` | no       | The credential, used for authentication                                  |
| `format`     | no       | The format of the response. Accepts `json` or `flag`. Defaults to `json` |

The server will answer with `1` if the server is up, otherwise with `0`.

### Starting the server

`yarn dev` will build the project and start it afterwards. 
Alternatively, you can also run `yarn build`, followed by `yarn start`.