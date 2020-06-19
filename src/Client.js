let http = null
const qs = require("querystring")
const io = require("socket.io-client")
const EventEmitter = require("events")
const Helpers = require("./helpers")
const { AuthError, ConnectError, GetChannelsError, GetMembersError } = Helpers.errors
const { Message, Channel, Member, ExtendedMap } = Helpers.classes

/**
 * Login options.
 * @typedef {Object} LoginOptions
 * @property {number} [reconnectionAttempts=5] - The number of time to attempt to reconnect.
 * @property {number} [timeout=5000] - The time, in ms, to wait for a connection while connecting.
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
   * @param {string} token - The bot's token.
   * @param {string} ip - The IP to connect to, including the http protocol to use. 
   * @param {string|number} port - The port of the server.
   */
  constructor(token, ip, port) {
    super()
    if (!token || !ip || !port) throw new Error("Missing one of the required parameters.")
    if (!ip.startsWith("http")) throw new Error("IP must start with the http prefix (http:// or https://)")
    this.token = token
    this.ip = ip
    this.port = port
    this.secure = ip.startsWith("https")
    http = this.secure ? require("https") : require("http")

    /**
     * The channels the bot can see.
     * @type {ExtendedMap<String, Channel>}
     */
    this.channels = new ExtendedMap()

    /**
     * The members the bot can see.
     * @type {ExtendedMap<number, Member>}
     */
    this.members = new ExtendedMap()
  }

  makeRequest(opts, postData) {
    return new Promise((resolve, reject) => {
      if (!opts) return reject("No options provided.")
      if (opts.method == "POST" && opts.headers["Content-Type"] == "application/json") postData = JSON.stringify(postData)
      else if (opts.method == "GET" && postData) opts.path += `?${qs.encode(postData)}`
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

      if (opts.method == "POST") req.write(postData)
      req.end()
    })
  }

  /**
   * Requests an updated channel list from the server, then sets it automatically.
   * @returns {Promise<ExtendedMap<String, Channel>>}
   * @throws {GetChannelsError}
   */
  async requestChannels() {
    const options = {
      hostname: this.ip.startsWith("https") ? this.ip.slice(8) : this.ip.slice(7),
      path: "/channels?" + qs.stringify({ sessionID: this.user.sessionID }),
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bot ${this.token}`
      },
      port: this.port
    }
    try {
      let data = await this.makeRequest(options)
      this.channels = new ExtendedMap()
      for (let channel of data.channels) {
        this.channels.set(channel, new Channel(channel, { client: this }))
      }
      return this.channels
    } catch (e) {
      throw new GetChannelsError(e.message, e.type, e.code)
    }
  }

  /**
   * Requests an updated member list from the server, then sets it if told to.
   * @param {?string} [channel] - The channel to get the members for, if not provided it fetches all.
   * @param {boolean} [setList] - Whether to set the fetched list as the new member list. (Not recommended if channel is not null)
   * @returns {Promise<ExtendedMap<String, Channel>>}
   * @throws {GetChannelsError}
   */
  async requestMembers(channel, setList) {
    const options = {
      hostname: this.ip.startsWith("https") ? this.ip.slice(8) : this.ip.slice(7),
      path: "/members?" + qs.stringify({ sessionID: this.user.sessionID, channel }),
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bot ${this.token}`
      },
      port: this.port
    }
    try {
      let data = await this.makeRequest(options)
      if (setList) {
        this.members = new ExtendedMap()
        for (let member of data.members) {
          this.members.set(member.id, new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this }))
        }
        return this.members
      } else {
        let members = new ExtendedMap()
        for (let member of data.members) {
          members.set(member.id, new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this }))
        }
        return members
      }
    } catch (e) {
      throw new GetMembersError(e.message, e.type, e.code)
    }
  }

  _connect(ip, port, options) {
    if (!options) options = {}
    return new Promise((resolve, reject) => {
      const reconnectionAttempts = options.reconnectionAttempts || 5
      let socket = io(`${ip}:${port}`, { secure: this.secure, timeout: options.timeout || 5000 })

      let attempt = 0

      socket.on("connect_error", () => {
        attempt++
        if (attempt == reconnectionAttempts) {
          socket.close(true)
          socket.removeAllListeners()
          reject(new ConnectError(`Unable to establish connect to the server (${ip}:${port}) after ${reconnectionAttempts} attempts`, "noConnection"))
        }
      })

      socket.on('connect', () => {
        socket.on("methodResult", (d) => {
          if (!d.success) {
            reject(new ConnectError(d.message, d.type))
          } else {
            return resolve(socket)
          }
        })
      })
    })
  }

  setupListeners() {
    this.socket.on("memberConnect", member => {
      member = member.member
      let found = this.members.get(member.id)
      let mem = !found ? null : found
      if (!found) {
        mem = new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this })
        this.members.set(mem.id, mem)
      }
      this.emit("memberConnect", mem)
    })

    this.socket.on("memberDisconnect", member => {
      member = member.member
      let found = this.members.get(member.id)
      let mem = found ? found : new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this })
      if (found) {
        this.members.delete(found.id)
      }
      this.emit("memberDisconnect", mem)
    })

    this.socket.on("msg", data => this.emit("message", new Message(data.msg, {
      id: data.id,
      author: data.server ? "Server" : this.members.get(data.userID),
      channel: this.channels.get(data.channel),
      server: data.server || false,
      client: this
    })))
  }

  /**
   * Attempts to connect then login to the server.
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
      try {
        this.socket = await this._connect(this.ip, this.port, options)
      } catch (e) {
        return reject(e)
      }
      this.socket.emit("login", { bot: true, token: this.token })
      this.socket.once("authResult", async (data) => {
        if (!data.success) {
          this.socket.removeAllListeners()
          this.socket.close(true)
          reject(new AuthError(data.message, data.type))
        } else {
          this.socket.removeAllListeners()
          this.user = data.bot
          try {
            await this.requestChannels()
            await this.requestMembers(null, true)
          } catch (e) {
            this.emit("error", e)
          }
          this.setupListeners()
          this.emit("ready")
          resolve()
        }
      })
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
      if(!options) return reject("No options provided.")
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