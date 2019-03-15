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

A health-check can be performed with a simple `HTTTP GET`:

```
curl -X GET 'http://localhost:3000?url=turn:domain.tld:3478%3Ftransport=udp&username=example&credential=example'
```

It accepts the following query parameters:

| Parameter    | Required | Description                                                                              |
|--------------|----------|------------------------------------------------------------------------------------------|
| `url`        | yes      | The turn server url                                                                      |
| `username`   | no       | The username, used for authentication                                                    |
| `credential` | no       | The credential, used for authentication                                                  |
| `format`     | no       | The format of the response. Accepts `json`, `flag`, or `http-status`. Defaults to `json` |

The answer of the health check depends on the chosen format:

| Format        | Response                                                                                        |
|---------------|-------------------------------------------------------------------------------------------------|
| `json`        | The body is a json object with a boolean field `available`. The HTTP status is always `200`     |
| `flag`        | The body is `1` if the turn-server is online, otherwise `0`. The HTTP status is always `200`    |
| `http-status` | Always an empty body. The HTTP status is `200` if the turn server is available, otherwise `418` |

#### Why does `http-status` format exist?

The only REST-conform response code for a failed health-check is `200`, as the request itself was successful, only the health-check did fail.
It is wrong to send a `4xx CLIENT ERROR` (or even worse `5xx SERVER ERROR`), as it is in fact no client error. However, many health-checks (e.g. for
Kubernetes) do not look at the response body, but only at the http status code. For these clients, you can use the
`http-status` format.


### Starting the server

`yarn dev` will build the project and start it afterwards. 
Alternatively, you can also run `yarn build`, followed by `yarn start`.