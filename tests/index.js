const Termie = require("../index.js")

Termie.Client.createBot("Ayame", "Ayame", "weeb", {hostname:"localhost",secure:false,port:"3000",ownerUid:"sammy",ownerPassword:"pass123"}).then(d => {
	console.log(d)
 }).catch(e => {
	if(e.type === "userExists") return;
	console.log(e)
})

const ayame = new Termie.Client("MTU5MjUwNDQzNTQ0OA==.MTI5NjA1NDgwMzk2OTIyODg=.$2b$20$lNxcHW0BY8tiNrdXCEiwUu", "http://localhost", "3000")
ayame.on("ready", async () => {
	console.log("ready")
	// console.log(ayame.channels)
	// console.log(ayame.members)
	// console.log(ayame.members.get(ayame.user.id))
	ayame.channels.get("General").send("Test").then(m => console.log(m)).catch(e => console.log(e))
	ayame.on("message", message => {
		console.log(message)
	})

	ayame.on("memberDisconnect", member => {
		console.log("dc")
	})

	ayame.on("memberConnect", member => {
		console.log("connect")
	})
})

ayame.on("error", e => {
	console.log(e)
})

ayame.login()