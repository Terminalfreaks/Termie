let http = null
const qs = require("querystring")
const io = require("socket.io-client")
const EventEmitter = require("events")
const Helpers = require("./helpers")
const Errors = Helpers.errors
const Classes = Helpers.classes


class Client extends EventEmitter {
  constructor(token, ip, port) {
    super()
    this.token = token
    this.ip = ip
    this.port = port
    this.secure = ip.startsWith("https")
    http = this.secure ? require("https") : require("http")

    this.channelList = new Map()
    this.memberList = new Map()
  }

  makeRequest(opts, postData) {
    return new Promise((resolve, reject) => {
      if (!opts) return reject("No options provided.")
      if (opts.method == "POST" && opts.headers["content-type"] == "application/json") postData = JSON.parse(postData)
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

  get channels() {
    return this.channelList
  }

  set channels(list) {
    this.channelList = list
  }

  get members() {
    return this.memberList
  }

  set members(list) {
    this.memberList = list
  }

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
      this.channels = new Map()
      for(let channel of data.channels){
        this.channels.set(channel, new Classes.Channel(channel, {client: this}))
      }
      return this.channels
    } catch (e) {
      throw new Errors.GetChannelsError(e.message, e.type, e.code)
    }
  }

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
      if (setList){
        this.members = new Map()
        for(let member of data.members){
          this.members.set(member.id, new Classes.Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, {client:this}))
        }
        return this.members
      }else { 
        let members = new Map()
        for(let member of data.members){
          members.set(member.id, new Classes.Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, {client:this}))
        }
        return members
      }
    } catch (e) {
      throw new Errors.GetMembersError(e.message, e.type, e.code)
    }
  }

  connect(ip, port, options) {
    if (!options) options = {}
    return new Promise((resolve, reject) => {
      const reconnectionAttempts = options.reconnectionAttempts || 5
      let socket = io(`${ip}:${port}`, { secure: options.secure || this.secure })

      let attempt = 0

      socket.on("connect_error", () => {
        attempt++
        if (attempt == reconnectionAttempts) {
          socket.close(true)
          socket.removeAllListeners()
          reject(new Errors.ConnectError(`Unable to establish connect to the server (${ip}:${port}) after ${reconnectionAttempts} attempts`, "noConnection"))
        }
      })

      socket.on('connect', () => {
        socket.on("methodResult", (d) => {
          if (!d.success) {
            reject(new Errors.ConnectError(d.message, d.type))
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
      if(!found){
        mem = new Classes.Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, {client:this})
        this.members.set(mem.id, mem)
      }
      this.emit("memberConnect", mem)
    })

    this.socket.on("memberDisconnect", member => {
      member = member.member
      let found = this.members.get(member.id)
      let mem = found ? found : new Classes.Member(member.uid, member.id, member.username, member.tag, !!member.bot, member.admin, {client:this})
      if(found){
        this.members.delete(found.id)
      }
      this.emit("memberDisconnect", mem)
    })

    this.socket.on("msg", data => this.emit("message", new Classes.Message(data.msg, {
      id: data.id,
      author: data.server ? "Server" : this.members.get(data.uid),
      server: data.server || false,
      client: this
    })))
  }

  async login(options) {
    this.socket = await this.connect(this.ip, this.port, options)
    this.socket.emit("login", { bot: true, token: this.token })
    this.socket.once("authResult", async (data) => {
      if (!data.success) {
        this.socket.removeAllListeners()
        this.socket.close(true)
        throw new Errors.AuthError(data.message, data.type)
      } else {
        this.socket.removeAllListeners()
        this.user = data.bot
        try{
          await this.requestChannels()
          await this.requestMembers(null, true)
        }catch(e){
          this.emit("error", e)
        }
        this.setupListeners()
        this.emit("ready")
      }
    })
  }
}

module.exports = Client