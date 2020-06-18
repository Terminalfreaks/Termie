const SendMessageError = require("../errors/SendMessageError")
const Message = require("./Message")

/**
 * @typedef {import('../Client').Client} Client
 */

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
    this.name = name
    this.client = options.client
  }

  /**
   * @returns {string} - The name of the channel
   */
  get name() {
    return this.channelName
  }

  /**
   * @returns {Client} The client connected to the channel.
   */
  get client() {
    return this.channelClient
  }

  /**
   * Sets the channel's name (Using this will cause sending to break).
   */
  set name(name) {
    this.channelName = name
  }

  /**
   * Sets the client.
   * @param {Client} client - The client connected to the channel.
   */
  set client(client) {
    this.channelClient = client
  }

  /**
   * Sends a message to a channel.
   * @param {string} content - The message to send
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
        return resolve(new Message(message.msg, { client: this.client, id: message.id, author: this.client.members.get(this.client.user.id) }))
      } catch (e) {
        return reject(new SendMessageError(e.message, e.type, e.code))
      }
    })
  }
}

module.exports = Channel