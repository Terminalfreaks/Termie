/**
* Represents a message.
*/
class Message {
  /**
   * Creates a message.
   * @param {string} content - The string content.
   * @param {Object} options - The options.
   * @param {Member} options.author - The member that created the message.
   * @param {Channel} options.channel - The channel the message was sent in.
   * @param {number} options.id - The id of the message.
   * @param {boolean} options.serverMessage - Whether the message is from the server.
   * @param {Server} options.server - The server the message was sent in.
   * @param {Client} options.client - The client that is connected to the server.
   */
  constructor(content, options) {

    /**
     * The content of the message.
     * @type {string}
     */
    this.content = content

    /**
     * The author of the message.
     * @type {Member}
     */
    this.author = options.author

    /**
     * The channel the message was sent in.
     * @type {Channel}
     */
    this.channel = options.channel

    /**
     * The id of the message.
     * @type {string|number}
     */
    this.id = options.id

    /**
     * Whether the message was sent by the server or not.
     * @type {boolean}
     */
    this.serverMessage = options.serverMessage || false

    /**
     * The server the message is in.
     * @type {Server}
     */
    this.server = options.server

    /**
     * The client connected to the message.
     * @type {Client}
     */
    this.client = options.client
  }
}

module.exports = Message