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

  async send(content) {

  }
}

module.exports = Channel