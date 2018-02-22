module.exports = class Provider
{
    constructor(params) {
        this.dgram = require('dgram')
        this.server = this.dgram.createSocket('udp4')
        this.host = params.host
        this.port = params.port

        this._error = function (err) {
            console.error(err)
        }
        this._success = function () {
        }
    }
    error (errorCallback) {
        this._error = errorCallback
        return this
    }

    success (successCallback) {
        this._success = successCallback
        return this
    }

    start(callback) {
        const self = this
        this.server.on('message', function (message, remote) {
            try {
                var request = JSON.parse(message.toString())
                var buffer = new Buffer(JSON.stringify(callback(request)))
                this.send(buffer, 0, buffer.length, remote.port, remote.address, function (err) {
                    if (err) {
                        self._error(err)
                    } else {
                        self._success(request)
                    }
                })
            } catch (e) {
                self._error(e)
            }
        });
        this.server.bind(this.port, this.host)
        return this
    }
}