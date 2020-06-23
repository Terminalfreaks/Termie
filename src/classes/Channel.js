const SendMessageError = require("../errors/SendMessageError")
const Message = require("./Message")

/**
 * Represents a channel in a server.
 */
class Channel {
  /**
   * Creates a new channel
   * @param {string} name - The name of the channel. 
   * @param {Object} options - The options.
   * @param {Server} options.server - The server the channel is on.
   * @param {Client} options.client - The client connected to the channel.
   */
  constructor(name, options) {
    /**
     * The name of the channel
     * @type {string}
     */
    this.name = name

    /**
     * The server the channel is on.
     * @type {Server}
     */
    this.server = options.server

    /**
     * The client connected to the channel.
     * @type {Client}
     */
    this.client = options.client
  }

  /**
   * Sends a message to a channel.
   * @param {string} content - The message to send.
   * @returns {Promise<Message>} - The Message that was sent.
   * @example
   * let message = await client.channels.get("General").send("Hi")
   */
  send(content) {
    return new Promise(async (resolve, reject) => {
      const options = {
        hostname: this.server.ip.startsWith("https") ? this.server.ip.slice(8) : this.server.ip.slice(7),
        path: `/channels/${this.name}/messages`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bot ${this.server.token}`
        },
        port: this.server.port,
        secure: this.server.secure
      }
      try {
        let data = await this.server.client.makeRequest(options, {
          id: this.server.user.id,
          uid: this.server.user.uid,
          username: this.server.user.username,
          tag: this.server.user.tag,
          msg: content,
          sessionID: this.server.user.sessionID
        })
        let message = data.message
        return resolve(new Message(message.msg, { client: this.server, id: message.id, author: this.server.members.get(this.server.user.id), channel: this.server.channels.get(message.channel) }))
      } catch (e) {
        return reject(new SendMessageError(e.message, e.type, e.code))
      }
    })
  }
}

module.exports = Channel