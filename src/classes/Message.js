class Message {
  constructor(content, options) {
    this.content = content
    this.author = options.author
    this.id = options.id
    this.server = options.server
    this.client = options.client
  }

  get content() {
    return this.messageContent
  }

  get author() {
    return this.messageAuthor
  }

  get id() {
    return this.messageID
  }
  
  get server() {
    return this.messageServer
  }

  get client() {
    return this.messageClient
  }

  set content(content) {
    this.messageContent = content
  }

  set author(member) {
    this.messageAuthor = member
  }

  set id(id) {
    this.messageID = id
  }

  set server(bool) {
    this.messageServer = bool
  }

  set client(client) {
    this.messageClient = client
  }

}

module.exports = Message