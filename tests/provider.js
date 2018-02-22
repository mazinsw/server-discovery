const os = require("os")
const ip = require('ip')
const { Provider } = require('../index')

const server = new Provider({ host: '0.0.0.0', port: 6220 })

server.start(function (request) {
    if (request.cmd != 'discover') {
        throw new Error('Invalid request command')
    }
    if (request.application != 'GrandChef') {
        throw new Error('Unknow application request')
    }
    var hostname = os.hostname()
    var response = {
        reply: 'discover',
        application: 'GrandChef',
        computer: hostname,
        ip: ip.address() + ':8001'
    }
    return response
})
server.success(
    (request) => console.log(request)
)
server.error(
    () => console.log('error')
)
