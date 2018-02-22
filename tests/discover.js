const { Discover } = require('../index')

const discover = new Discover({ port: 6220, remote_port: 6221, repeat: 1, timeout: 1000 })

discover.start(function () {
    return {
        cmd: "discover",
        application: "GrandChef"
    }
}).discover(function (response) {
    console.log(response)
}).finish(function () {
    console.log('Terminou ;(')
})

