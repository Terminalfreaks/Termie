module.exports = {
  errors: {
    AuthError: require("./errors/AuthError"),
    ConnectError: require("./errors/ConnectError"),
    GetChannelsError: require("./errors/GetChannelsError"),
    GetMembersError: require("./errors/GetMembersError")
  },
  classes: {
    Member: require("./classes/Member"),
    Message: require("./classes/Message"),
    Channel: require("./classes/Channel")
  }
}