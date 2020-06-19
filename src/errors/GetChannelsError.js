/**
 * Thrown when the client fails to get the channel list.
 */
class GetChannelsError extends Error { 
  /**
   * Makes a new error.
   * @param {string} message - The message returned. 
   * @param {string} type - The type of error.
   * @param {number} status - The error status.
   */  
  constructor (message, type, status) {
    super(message)
    this.name = this.constructor.name
    this.type = type
    this.status = status
  }
}

module.exports = GetChannelsError  