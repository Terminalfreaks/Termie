const SendMessageError = require("../errors/SendMessageError")
const Message = require("./Message")

/**
 * @typedef {import('../Client').Client} Client
 */

/**
 * Represents a member.
 */
class Member {
  /**
   * Creates a new member.
   * @param {string} uid - The UID of the member.
   * @param {string} id - The ID of the member.
   * @param {string} username - The username of the member.
   * @param {string} tag - The tag of the member.
   * @param {boolean} bot - Whether the member is a bot or not.
   * @param {boolean} admin - Whether the member is an admin or not.
   * @param {Object} options - The options.
   * @param {Client} options.client - The client connected to the channel.
   */
  constructor(uid, id, username, tag, bot, admin, options) {
    this.uid = uid
    this.id = id
    this.username = username
    this.tag = tag
    this.bot = bot
    this.admin = admin
    this.client = options.client
  }

  get uid() {
    return this.userUID
  }

  get id() {
    return this.userID
  }

  get username() {
    return this.userUsername
  }

  get tag() {
    return this.userTag
  }

  get bot() {
    return this.userBot
  }

  get admin() {
    return this.userAdmin
  }

  get client() {
    return this.userClient
  }

  set uid(uid) {
    this.userUID = uid
  }

  set id(id) {
    this.userID = id
  }

  set username(username) {
    this.userUsername = username
  }

  set tag(tag) {
    this.userTag = tag
  }

  set bot(bool) {
    this.userBot = bool
  }

  set admin(bool) {
    this.userAdmin = bool
  }

  set client(client) {
    this.userClient = client
  }

  /**
   * Sends a message to this member.
   * @param {string} content - The message to send
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
        return resolve(new Message(message.msg, { client: this.client, id: message.id, author: this.client.members.get(this.client.user.id) }))
      } catch (e) {
        return reject(new SendMessageError(e.message, e.type, e.code))
      }
    })
  }

}

module.exports = Member