class Member {
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

}

module.exports = Member