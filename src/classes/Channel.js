const SendMessageError = require("../errors/SendMessageError")
const Message = require("./Message")
const Client = require("../Client")

/**
 * Represents a channel in a server.
 */
class Channel {
  /**
   * Creates a new channel
   * @param {string} name - The name of the channel. 
   * @param {Object} options - The options.
   * @param {Client} options.client - The client connected to the channel.
   */
  constructor(name, options) {
    /**
     * The name of the channel
     * @type {string}
     */
    this.name = name

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
        hostname: this.client.ip.startsWith("https") ? this.client.ip.slice(8) : this.client.ip.slice(7),
        path: `/channels/${this.name}/messages`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bot ${this.client.token}`
        },
        port: this.client.port
      }
      try {
        let data = await this.client.makeRequest(options, {
          id: this.client.user.id,
          uid: this.client.user.uid,
          username: this.client.user.username,
          tag: this.client.user.tag,
          msg: content,
          sessionID: this.client.user.sessionID
        })
        let message = data.message
        return resolve(new Message(message.msg, { client: this.client, id: message.id, author: this.client.members.get(this.client.user.id), channel: this.client.channels.get(data.channel) }))
      } catch (e) {
        return reject(new SendMessageError(e.message, e.type, e.code))
      }
    })
  }
}

module.exports = Channel