class GetChannelsError extends Error {  
  constructor (message, type, status) {
    super(message)
    this.name = this.constructor.name
    this.type = type
    this.status = status
  }
}

module.exports = GetChannelsError  