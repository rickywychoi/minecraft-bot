const constants = require('./constants')
const { v4: uuidv4 } = require('uuid')
const Discord = require('discord.js')
const client = new Discord.Client()

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

let requestId = undefined // request id
let isServerRunning = false // current status of server

client.on('message', msg => {
  switch (msg.content) {
    case constants.commands.PLAY_CREATIVE:
      reply(msg)('creative', true)
      break
    case constants.commands.PLAY_SURVIVAL:
      reply(msg)('survival', true)
      break
    case constants.commands.STOP:
      reply(msg)('stop', false)
      break
  }
})

// helper function for replying to request
function reply (msg) {
  return function (modeName, isForStart) {
    // if and only if server is not running for play request, vice versa for stop request
    if (isServerRunning !== isForStart) {
      requestId = uuidv4() // generate request Id
      msg.reply(
        `Request for ***${modeName}*** mode has been made. Request ID: ${requestId}`
      ) // reply to the user who made request
      // send message to the server owner to take action
      client.users
        .fetch(process.env.SERVER_OWNER_DISCORD_ID)
        .then(user =>
          user
            .send(
              `== ${new Date()} ==
              Request has made for ***${modeName}*** mode from **${msg.author.username}**.
              ${
                isForStart
                ?
                `Please run the server in ***${modeName}*** mode.`
                :
                `Please ***${modeName}*** the running server.`
              } Request ID: ${requestId}
              React to this message with ${isForStart ? constants.emojis.RUN_SERVER : constants.emojis.STOP_SERVER} once you are done.`
            )
            .then(msg.react(constants.emojis.SUCCESS))
            .catch(e => console.error(e))
        )
        .catch(e => console.error(e))
    }
  }
}

// When the server owner receives the DM from bot and react after running a server
client.on('messageReactionAdd', msg => {
  const channel = client.channels.cache.get(process.env.BOT_RESIDING_CHANNEL_ID)
  if (msg.emoji.name === constants.emojis.RUN_SERVER && !isServerRunning) {
    channel.send(`The server is now running - Request ID: ${requestId}`) // send message to channel
    isServerRunning = true
  } else if (msg.emoji.name === constants.emojis.STOP_SERVER && isServerRunning) {
    channel.send(`The server is now closed - Request ID: ${requestId}`) // send message to channel
    isServerRunning = false
  }
})

client.login(process.env.BOT_TOKEN)