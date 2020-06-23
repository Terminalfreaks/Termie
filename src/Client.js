const http = require("http")
const https = require("https")
const qs = require("querystring")
const EventEmitter = require("events")
const ExtendedMap = require("./helpers").classes.ExtendedMap
const Server = require("./classes/Server")

/**
 * Login options.
 * @typedef {Object} LoginOptions
 * @property {number} [reconnectionAttempts=5] - The number of time to attempt to reconnect.
 * @property {number} [timeout=5000] - The time, in ms, to wait for a connection while connecting.
 * @property {boolean} [secure=false] - Whether to use SSL or not.
 */


/**
 * Request options.
 * @typedef {Object} RequestOptions
 * @property {string} hostname - The hostname to request to.
 * @property {string} path - The path to request to.
 * @property {RequestHeaders} headers - Request headers.
 * @property {string|number} port - The port to send the request to.
 */

/**
 * Client options.
 * @typedef {Object} clientOptions
 * @param {string} token - The bot's token.
 * @param {string} ip - The IP to connect to, including the http protocol to use. 
 * @param {string|number} port - The port of the server.
 */

/**
 * A websocket from socket.io-client.
 * @typedef {Object} Socket
 */

/**
 * Client class.
 * @extends EventEmitter
 */
class Client extends EventEmitter {
  /**
   * Create a new client.
   * @param {clientOptions|clientOptions[]} - The client options, or an array of them if connecting to multiple servers.
   */
  constructor(clientOptions) {
    super()
    this.servers = new ExtendedMap()
    if (clientOptions.length >= 1) {
      for (let server of clientOptions) {
        if(!this.servers.has(`${server.ip}:${server.port}`)) this.servers.set(`${server.ip}:${server.port}`, new Server(server.ip, server.port, server.token, this))
        else { 
          let count = this.servers.keyArray().reduce((a, b) => a + b.includes(`${server.ip}:${server.port}`) ? 1 : 0, 0) + 1
          this.servers.set(`${server.ip}:${server.port}#${count}`, new Server(server.ip, server.port, server.token, this))
        }
      }
    } else {
      if (!clientOptions.token || !clientOptions.ip || !clientOptions.port) throw new Error("Missing one of the required parameters.")
      if (!clientOptions.ip.startsWith("http")) throw new Error("IP must start with the http prefix (http:// or https://)")
      this.servers.set(`${clientOptions.ip}:${clientOptions.port}`, new Server(clientOptions.ip, clientOptions.port, clientOptions.token, this))
    }
  }

  makeRequest(opts, postData) {
    return new Promise((resolve, reject) => {
      if (!opts) return reject("No options provided.")
      if (opts.method == "POST" && opts.headers["Content-Type"] == "application/json") postData = JSON.stringify(postData)
      else if (opts.method == "GET" && postData) opts.path += `?${qs.encode(postData)}`
      let protocol = http
      if(opts.secure) protocol = https
      const req = protocol.request(opts, (res) => {
        let statusCode = res.statusCode

        let data = ""
        res.setEncoding('utf8')
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => {
          if (res.headers["content-type"] == "application/json") data = JSON.parse(data)
          if (statusCode < 200 || statusCode >= 300) {
            return reject(data)
          }
          return resolve(data)
        })
      })

      req.on("error", (e) => {
        return reject(e)
      })

      if (opts.method == "POST") req.write(postData)
      req.end()
    })
  }

  /**
   * Attempts to connect then login to every server.
   * @param {LoginOptions} options - The login options. 
   * @emits Client#ready
   * @emits Client#error
   * @returns {Promise}
   * @throws {AuthError}
   * @example
   * client.login({reconnectionAttempts:10})
   */
  login(options) {
    return new Promise(async (resolve, reject) => {
      let ready = 0
      for (let [ip, server] of this.servers) {
        server.on("ready", () => {
          ready++
          if(ready == this.servers.size) this.emit("ready")
        })
        try{
          await server.login(options)
        }catch(e){
          return reject(e)
        }
      }
    })
  }

  /**
   * The bot creation additional options.
   * @typedef {Object} BotCreationOptions
   * @property {string} hostname - The hostname to use without the http prefix.
   * @property {string|number} port - The port of the server.
   * @property {string} ownerUid - The UID of the owner of the bot.
   * @property {string} ownerPassword - The password of the owner of the bot.
   * @property {boolean} secure - Whether to use https or not.
   */

  /**
   * Creates a bot.
   * @param {string} uid - The UID of the bot.
   * @param {string} username - The username of the bot.
   * @param {string} tag - The tag of the bot.
   * @param {BotCreationOptions} options - The additional options
   * @returns {Promise<Object>} - The object containing the token
   * @example
   * Client.createBot("BottyBot", "BottyBotsUsername", "0001", {hostname:"localhost",secure:false,port:"3000",ownerUid:"BestOwner",ownerPassword:"verySecurePassword"})
   * .then(d => {
   *   console.log(d.token)
   * }).catch(e => {
   *   console.log(e)
   * })
   * 
   * 
   */
  static createBot(uid, username, tag, options) {
    return new Promise((resolve, reject) => {
      let http = options.secure ? require("https") : require("http")
      if (!uid || !username || !tag) return reject("Not all bot create options were supplied.")
      if (!options) return reject("No options provided.")
      if (!options.hostname || !options.port) return reject("Provide proper options.")
      if (!options.ownerUid || !options.ownerPassword) return reject("Please provide owner information.")
      let opts = {
        hostname: options.hostname,
        port: options.port,
        path: "/bots/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      }
      let postData = JSON.stringify({
        ownerUid: options.ownerUid,
        ownerPassword: options.ownerPassword,
        uid,
        username,
        tag
      })
      const req = http.request(opts, (res) => {
        let statusCode = res.statusCode

        let data = ""
        res.setEncoding('utf8')
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => {
          if (res.headers["content-type"] == "application/json") data = JSON.parse(data)
          if (statusCode < 200 || statusCode >= 300) {
            return reject(data)
          }
          return resolve(data)
        })
      })

      req.on("error", (e) => {
        return reject(e)
      })

      req.write(postData)
      req.end()
    })
  }
}

module.exports = Client

/**
 * Emitted when the client enters a ready state.
 * @event Client#ready
 */

/**
 * Emitted when an error happens that doesn't crash the client.
 * @event Client#error
 * @param {Error} - The error.
 */

/**
 * Emitted when the client receives a message.
 * @event Client#message
 * @param {Message} - The message.
 */

/**
 * Emitted when a member connects.
 * @event Client#memberConnect
 * @param {Member} - The member.
 */

/**
 * Emitted when a member disconnects.
 * @event Client#memberDisconnect
 * @param {Member} - The member.
 */