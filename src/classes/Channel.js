const Client = require("../Client")
const Helpers = require("../helpers")
const Errors = Helpers.errors
const Classes = Helpers.classes

class Channel {
  constructor(name, options) {
    this.name = name
    this.client = options.client
  }

  get name() {
    return this.channelName
  }

  get client() {
    return this.channelClient
  }

  set name(name) {
    this.channelName = name
  }

  set client(client) {
    this.channelClient = client
  }

  send(content) {
    return new Promise(async (resolve, reject) => {
      const options = {
        hostname: this.ip.startsWith("https") ? this.ip.slice(8) : this.ip.slice(7),
        path: `/channels/${this.name}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bot ${this.client.token}`
        },
        port: this.client.port
      }
      try {
        let data = await this.client.makeRequest(options, {
          userID: this.client.user.id,
          uid: this.client.user.uid,
          username: this.client.user.username,
          tag: this.client.user.tag,
          msg: content,
          sessionID: this.client.user.sessionID
        })
        let message = data.message
        return resolve(new Classes.Message(message.msg, { client: this.client, id: message.id, author: this.client.members.get(this.client.user.id) }))
      } catch (e) {
        return reject(new Errors.SendMessageError(e.message, e.type, e.status))
      }
    })
  }
}

module.exports = Channel