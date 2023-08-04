# @collabland/example-allow-list

This example illustrates how to implement a Collab action for Discord using
different interaction types:

- [Slash commands](https://discord.com/developers/docs/interactions/application-commands#slash-commands)
- [Interactions](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object)
- [Buttons](https://discord.com/developers/docs/interactions/message-components#buttons)
- [Select menus](https://discord.com/developers/docs/interactions/message-components#select-menus)

SPEARMINT API ALLOW LIST

# Try it out
In your terminal:
npm run build npm run server 
In NGROK:
ngrok http 3000

```
/list create
/list initialize
/list status
/list close
```

In your Discord server:
First, make sure you have the CollabLand Bot installed into your Discord server. You can find the bot here. https://collabland.freshdesk.com/support/solutions/articles/70000036689-discord-bot-walkthrough. Next, make sure the Test-Flight miniapp is downloaded from the marketplace. Type: 
/test-flight install <https-url-from-ngrok>/allow-list
in discord. Copy and paste your link from NGROK where instructed.
There are a few different commands. 
1. /list create - Run this command to start the process. This will link you to Spearmint. Follow the instructions on Spearmint to create your own project. 

![/list create](docs/listcreate.png)

2. /list initialize - This command connects your spearmint project with our Discord Bot miniapp. After entering your ProjectID, APIKey, Project name, and End Date, it will connect our Discord bot to Spearmint. 

![/list initialize](docs/listinitialize.png)


3. /list status - This command is meant for the people who enter your allowlist draw to find out the status of their entry, whether that be selected, not selected, or still in the process of selecting winners. Creators of a project can run this command to be linked back to their Spearmint webpage where they can view the status of their project. 


![/list status](docs/dropdownmenuliststatus.png)



```


