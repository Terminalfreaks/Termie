const EventEmitter = require("events")
const qs = require("querystring")
const io = require("socket.io-client")
const Helpers = require("../helpers")
const { AuthError, ConnectError, GetChannelsError, GetMembersError } = Helpers.errors
const { Message, Channel, Member, ExtendedMap } = Helpers.classes

/**
 * Represents a Server.
 */
class Server extends EventEmitter {
  constructor(ip, port, token, client) {
    super()
    if (!token || !ip || !port || !client) throw new Error("Missing one of the required parameters.")
    if (!ip.startsWith("http")) throw new Error("IP must start with the http prefix (http:// or https://)")
    this.token = token
    this.ip = ip
    this.port = port
    this.secure = ip.startsWith("https")
    this.client = client

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
      port: this.port,
      secure: this.secure
    }
    try {
      let data = await this.client.makeRequest(options)
      this.channels = new ExtendedMap()
      for (let channel of data.channels) {
        this.channels.set(channel, new Channel(channel, { client: this.client, server: this }))
      }
      return this.channels
    } catch (e) {
      throw new GetChannelsError(e.message, e.type, e.code)
    }
  }

  /**
   * Requests an updated member list from the server, then sets it if told to.
   * @param {?string} [channel] - The channel to get the members for, if not provided it fetches all.
   * @param {boolean} [setList] - Whether to set the fetched list as the new member list (Not recommended if channel is not null).
   * @returns {Promise<ExtendedMap<number|string, Member>>}
   * @throws {GetMembersError}
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
      port: this.port,
      secure: this.secure
    }
    try {
      let data = await this.client.makeRequest(options)
      if (setList) {
        this.members = new ExtendedMap()
        for (let member of data.members) {
          if (member.lurkers) this.members.set("Lurkers", new Member(member.lurkers, null, null, null, null, null, { client: this.client, server: this }))
          else this.members.set(member.id, new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this.client, server: this }))
        }
        return this.members
      } else {
        let members = new ExtendedMap()
        for (let member of data.members) {
          if (member.lurkers) this.members.set("Lurkers", new Member(member.lurkers, null, null, null, null, null, { client: this.client, server: this }))
          else this.members.set(member.id, new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this.client, server: this }))
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
      let socket = io(`${ip}:${port}`, { secure: options.secure, timeout: options.timeout || 5000 })

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
        mem = new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this.client, server: this })
        this.members.set(mem.id, mem)
      }
      this.client.emit("memberConnect", mem)
    })

    this.socket.on("memberDisconnect", member => {
      member = member.member
      let found = this.members.get(member.id)
      let mem = found ? found : new Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, { client: this.client, server: this })
      if (found) {
        this.members.delete(found.id)
      }
      this.client.emit("memberDisconnect", mem)
    })

    this.socket.on("msg", data => this.client.emit("message", new Message(data.msg, {
      id: data.id,
      author: data.server ? "Server" : this.members.get(data.userID),
      channel: this.channels.get(data.channel),
      serverMessage: data.server || false,
      server: this,
      client: this.client
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
            this.client.emit("error", e)
          }
          this.setupListeners()
          this.emit("ready")
          resolve()
        }
      })
    })
  }
}

module.exports = Server