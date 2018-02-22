const ip = require('ip')
const os = require('os')

module.exports = class Discover
{
    constructor(params) {
        this.dgram = require('dgram')
        this.server = this.dgram.createSocket('udp4')
        this.port = params.port
        this.remote_port = params.remote_port || this.port + 1
        this.host = params.host || '0.0.0.0'
        this.timeout = params.timeout || 3000
        this.repeat = params.repeat || -1

        this._error = function (err) {
            console.error(err)
        }
        this._discover = function () {
        }
        this._finish = function () {
        }
    }

    error(errorCallback) {
        this._error = errorCallback
        return this
    }

    discover(discoverCallback) {
        this._discover = discoverCallback
        return this
    }

    finish(finishCallback) {
        this._finish = finishCallback
        return this
    }

    start(callback) {
        let self = this
        this._remaining = this.repeat
        this.server.on('message', function (message) {
            try {
                let request = JSON.parse(message.toString())
                self._discover(request)
            } catch (e) {
                self._error(e)
            }
        });
        this.server.bind(this.remote_port, this.host)

        this.server.on('listening', function () {
            this.setBroadcast(true)
            const buffer = new Buffer(JSON.stringify(callback()))
            const broadcast_list = self._broadcastAddress()
            self._dispatch(buffer, broadcast_list)
        })

        this.server.on('close', function () {
            clearTimeout(this._repeater)
            self._finish()
        })
        this.server.on('error', function (err) {
            self._error(err)
        })
        return this
    }

    _dispatch(buffer, broadcast_list) {
        let self = this
        broadcast_list.forEach(function (broadcast_address) {
            self.server.send(buffer, 0, buffer.length, self.port, broadcast_address, function (err) {
                if (err) {
                    self._error(err)
                }
            })
        });
        this._repeater = setTimeout(function () {
            if (self._remaining > 0) {
                self._remaining--
            }
            if (self._remaining == 0) {
                self.server.close()
                return
            }
            self._dispatch(buffer, broadcast_list)
        }, this.timeout);
    }

    _broadcastAddress() {
        let interfaces = os.networkInterfaces()
        let ipv4Interfaces = []
        Object.keys(interfaces).forEach(function (key) {
            let addressList = interfaces[key].filter(function (item) {
                return !item.internal && item.family == 'IPv4'
            })
            ipv4Interfaces = ipv4Interfaces.concat(addressList)
        });
        const broadcast_list = ipv4Interfaces.map(function (item) {
            return ip.or(ip.cidr(item.cidr), ip.not(item.netmask))
        })
        return broadcast_list
    }

    stop() {
        clearTimeout(this._repeater)
        this.server.close()
    }
}