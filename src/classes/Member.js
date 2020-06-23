const SendMessageError = require("../errors/SendMessageError")
const Message = require("./Message")

/**
 * Represents a member.
 */
class Member {
  /**
   * Creates a new member.
   * @param {string} uid - The UID of the member.
   * @param {number} id - The ID of the member.
   * @param {string} username - The username of the member.
   * @param {string} tag - The tag of the member.
   * @param {boolean} bot - Whether the member is a bot or not.
   * @param {boolean} admin - Whether the member is an admin or not.
   * @param {Object} options - The options.
   * @param {Server} options.server - The server this member is connect to.
   * @param {Client} options.client - The client connected to the member.
   */
  constructor(uid, id, username, tag, bot, admin, options) {

    /**
     * Whether this member represents all lurkers. If true, username will be the lurkers message
     * @type {boolean}
     */
    this.lurkers = false

    if(!id){
      this.lurkers = true
      this.username = uid
    }

    /**
     * The UID of the member.
     * @type {string}
     */
    this.uid = uid

    /**
     * The ID of the member.
     * @type {number|string}
     */
    this.id = id

    /**
     * The username of the member.
     * @type {string}
     */
    this.username = username

    /**
     * The tag of the member.
     * @type {string}
     */
    this.tag = tag

    /**
     * Whether the member is a bot or not.
     * @type {boolean}
     */
    this.bot = bot

    /**
     * Whether the member is an admin or not.
     * @type {boolean}
     */
    this.admin = admin

    /**
     * The server the member is in.
     * @type {Server}
     */
    this.server = options.server

    /**
     * The client connected to the member.
     * @type {Client}
     */
    this.client = options.client
  }

  /**
   * Sends a message to this member.
   * @param {string} content - The message to send
   * @returns {Promise<Message>} - The Message that was sent.
   * @example
   * let message = await client.members.get(1234567890).send("Hi")
   */
  send(content) {
    return new Promise(async (resolve, reject) => {
      const options = {
        hostname: this.server.ip.startsWith("https") ? this.server.ip.slice(8) : this.server.ip.slice(7),
        path: `/members/${this.id}/messages`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bot ${this.server.token}`
        },
        port: this.server.port,
        secure: this.server.secure
      }
      try {
        let data = await this.client.makeRequest(options, {
          id: this.server.user.id,
          uid: this.server.user.uid,
          username: this.server.user.username,
          tag: this.server.user.tag,
          msg: content,
          sessionID: this.server.user.sessionID
        })
        let message = data.message
        return resolve(new Message(message.msg, { client: this.client, id: message.id, author: this.server.members.get(this.server.user.id), channel: this.server.channels.get(message.channel), server: this.server }))
      } catch (e) {
        return reject(new SendMessageError(e.message, e.type, e.code))
      }
    })
  }

}

module.exports = Member