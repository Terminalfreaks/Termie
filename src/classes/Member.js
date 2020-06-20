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
   * @param {Client} options.client - The client connected to the channel.
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

    this.client = options.client
  }

  /**
   * Sends a message to this member.
   * @param {string} content - The message to send
   * @returns {Promise<Message>} - The Message that was sent.
   * @example
   * let message = client.members.get(1234567890).send("Hi")
   */
  send(content) {
    return new Promise(async (resolve, reject) => {
      const options = {
        hostname: this.client.ip.startsWith("https") ? this.client.ip.slice(8) : this.client.ip.slice(7),
        path: `/members/${this.id}/messages`,
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
        return resolve(new Message(message.msg, { client: this.client, id: message.id, author: this.client.members.get(this.client.user.id), channel: this.client.channels.get(message.channel) }))
      } catch (e) {
        return reject(new SendMessageError(e.message, e.type, e.code))
      }
    })
  }

}

module.exports = Member