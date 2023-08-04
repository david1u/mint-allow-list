# @collabland/example-allow-list

This example illustrates how to implement a Collab action allow list for Discord using
different interaction types:

- [Slash commands](https://discord.com/developers/docs/interactions/application-commands#slash-commands)
- [Interactions](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object)
- [Buttons](https://discord.com/developers/docs/interactions/message-components#buttons)
- [Select menus](https://discord.com/developers/docs/interactions/message-components#select-menus)

# Why use this miniapp? 
This miniapp allows teams (NFT creators, developers, community managers) to use allowlists integrated into discord, giving them more control over their launches, mints and communities. For community members, it gives an easy way for them to join, leave, or check the status of allowlists they have joined.

# Try it out 
In your terminal:
npm run build npm run server 
In NGROK:
ngrok http 3000

```
/list create
/list initialize
/list status
/list join
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

4. /list join - This command is another way for community members to enter an open allowlist. It will provide a dropdown menu of all open allowlists and members can select which allowlist to join.

![list join](https://github.com/david1u/mint-allow-list/assets/129913826/6c04df8b-8dfa-4e9f-b3ad-df9797186d0e)

5. /list close - This command allows for the list manager to close the allow list with the Discord Bot miniapp. It will provide a dropdown menu of all active allowlists and managers can select which allowlist to close.

![list close](https://github.com/david1u/mint-allow-list/assets/129913826/eba912ef-3afb-4070-a444-f3a069cfc11e)

# High Level Architecture Diagram  

![arhachite guadmar](https://github.com/david1u/mint-allow-list/assets/129913826/c61bc504-7d2e-4676-9b30-5290ff0418cb)

TBA

# Whats Next  

- We plan on automating the closure of allow lists based on their inputted termination dates
- Currently, /list close only closes the list within the airtable. We hope to be able to close the spearmint allow list directly in the future.
- UI fixes where the collab.land bot will tell you you joined an already closed allow list.
- Will update our code in accordance to the spearmint API changes that we proposed.

# How to Contribute to this Project

Don't
