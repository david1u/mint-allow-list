# @collabland/example-poll-action

This example illustrates how to implement a Collab action for Discord using
different interaction types:

- [Slash commands](https://discord.com/developers/docs/interactions/application-commands#slash-commands)
- [Interactions](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object)
- [Responses](https://discord.com/developers/docs/interactions/receiving-and-responding#responding-to-an-interaction)
- [Buttons](https://discord.com/developers/docs/interactions/message-components#buttons)
- [Select menus](https://discord.com/developers/docs/interactions/message-components#select-menus)
- [Modals (with text inputs)](https://discord.com/developers/docs/interactions/message-components#text-inputs)

/poll allows you to create a poll and keep count of votes from users. To create the poll, enter your question in the top text box and enter the different answers to the poll, each on a different line. For example, in the top box if your question is "What is your favorite color?", enter a few different colors in the bottom box with each color on a new line. For example:
red
green
blue
would create a new poll with three different color options. A user can only vote once in a poll. 

# Try it out

npm run build
npm run server
ngrok http 3000
```

In your Discord server:

```
/test-flight install <https-url-from-ngrok>/poll-action
```

![Slash commands](docs/poll-action-commands.png)

![Screenshot](docs/poll-action.png)
