// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/allow-list-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { HttpErrors, stringify } from '@collabland/common';
import {
    APIInteractionResponse,
    ApplicationCommandSpec,
    ApplicationCommandType,
    BaseDiscordActionController,
    DiscordActionMetadata,
    DiscordActionRequest,
    DiscordActionResponse,
    DiscordInteractionPattern,
    InteractionResponseType,
    InteractionType,
    parseApplicationCommand,
} from '@collabland/discord';
import { MiniAppManifest } from '@collabland/models';
import { BindingScope, injectable } from '@loopback/core';
import { api, get, param } from '@loopback/rest';
import {
    APIChatInputApplicationCommandInteraction,
    APIInteraction,
    APIMessageStringSelectInteractionData,
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js';
import { AirtableAPI } from './airtable-api.js';
import { ListAPI } from './spearmint-api.js';

//const debug = debugFactory('collabland:poll-action');
/**
 * CollabActionController is a LoopBack REST API controller that exposes endpoints
 * to support Collab.Land actions for Discord interactions.
 */
@injectable({
    scope: BindingScope.SINGLETON,
})

@api({ basePath: '/allow-list' }) // Set the base path to `/allow-list`
export class AllowListController extends BaseDiscordActionController {
    private interactions: {
        request: DiscordActionRequest<APIInteraction>;
        response: APIInteractionResponse;
        timestamp: number;
    }[] = [];

    @get('/interactions/{id}')
    async getInteraction(@param.path.string('id') interactionId: string) {
        const interactions = [];
        let interaction = undefined;
        for (const i of this.interactions) {
            if (i.request.id === interactionId) {
                interaction = i;
            }
            if (i.timestamp + 900 * 1000 <= Date.now()) {
                interactions.push(i);
            }
        }
        this.interactions = interactions;
        if (interaction == null) {
            throw new HttpErrors.NotFound(
                `Interaction ${interactionId} does not exist`,
            );
        }
        return interaction;
    }

    /**
     * Expose metadata for the action
     * @returns
     */
    async getMetadata(): Promise<DiscordActionMetadata> {
        const metadata: DiscordActionMetadata = {
            /**
             * Miniapp manifest
             */
            manifest: new MiniAppManifest({
                appId: 'allow-list',
                developer: 'collab.land',
                name: 'AllowList',
                platforms: ['discord'],
                shortName: 'allow-list',
                version: { name: '0.0.1' },
                website: 'https://collab.land',
                description:
                    'An example Collab action to illustrate various Discord UI elements',
            }),
            /**
             * Supported Discord interactions. They allow Collab.Land to route Discord
             * interactions based on the type and name/custom-id.
             */
            supportedInteractions: this.getSupportedInteractions(),
            /**
             * Supported Discord application commands. They will be registered to a
             * Discord guild upon installation.
             */
            applicationCommands: this.getApplicationCommands(),
            requiredContext: ['isCommunityAdmin', 'gmPassAddress', 'guildName'],
        };
        return metadata;
    }

    /**
     * Handle the Discord interaction
     * @param interaction - Discord interaction with Collab.Land action context
     * @returns - Discord interaction response
     */

    protected async handle(
        interaction: DiscordActionRequest<APIInteraction>,
    ): Promise<DiscordActionResponse | undefined> {

        const userAddress = interaction.actionContext?.gmPassAddress;
        const isAdmin = interaction.actionContext?.isCommunityAdmin;
        const userId = interaction.member?.user.id;
        const airtable = new AirtableAPI();
        const listApi = new ListAPI();

        const accessDenied = this.privateMessage('This command is only accessible to administrators.');

        if (interaction.type === InteractionType.ApplicationCommand) {

            const cmd = parseApplicationCommand(
                interaction as APIChatInputApplicationCommandInteraction,
            );

            const args = cmd.args;

            const guildName = interaction.actionContext?.guildName;

            if (!isAdmin && args.initialize) {
                return accessDenied;

            } else if (args.initialize) {

                const projectID = args.initialize.projectid;
                const apiKey = args.initialize.apikey;
                const projName = args.initialize.name;

                // Check if the name already exists in the Airtable
                const records = await airtable.getRecords();
                const existingRecord = records.find((record: any) => record.fields['Name'] === projName);

                if (existingRecord) {
                    return this.privateMessage(`The name ${projName} already exists for allow list, please try against with another name or remove the current one`);
                }

                // Adds inputted project ID into the array based on user input
                const currentDate = new Date();
                const recordData = {
                    'Name': projName,
                    'Proj ID': projectID,
                    'API key': apiKey,
                    'status': 'open',
                    'server name': guildName,
                    'creation date': currentDate.toISOString()
                };

                // Call the createRecord method of AirtableAPI to save the data
                await airtable.createRecord(recordData);

                //get the current Entry ID to make button unique
                const recordsUpdated = await airtable.getRecords();

                const currEntry = recordsUpdated.find((record: any) => record.fields['Name'] === projName);
                const currEntryID = currEntry.id;

                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`${projName} Allowlist`)
                                .setDescription('Click join the be a part of this Allowlist!')
                                .toJSON(),
                        ],
                        components: [
                            new ActionRowBuilder<MessageActionRowComponentBuilder>()
                                .addComponents([
                                    new ButtonBuilder()
                                        .setLabel('Join')
                                        .setCustomId(`list:button:join:${currEntryID}`)
                                        .setStyle(ButtonStyle.Success),
                                ])
                                .toJSON(),
                        ],
                    },
                };
                this.interactions.push({
                    request: interaction,
                    response,
                    timestamp: Date.now(),
                });
                return response;
            }

            if (args.status || (args.close) || args.join) { //these three commands all use a dropdown menu
                var customid: string;
                var content: string;
                const records = await airtable.getRecords();
                const projectOptions: StringSelectMenuOptionBuilder[] = records.map(
                    (record: any) => {
                        const name = record.fields['Name'];
                        //const recordID = record.id;
                        return new StringSelectMenuOptionBuilder()
                            .setLabel(name)
                            .setValue(name);
                    },
                );
                if (args.status) {
                    customid = 'pstatus';
                    content = 'to check the status of:';
                }
                else if (args.close) {
                    customid = 'pclose';
                    content = 'to close:';
                }
                else if (args.join) {
                    customid = 'pjoin';
                    content = 'to join';
                } else {
                    customid = 'this should not ever be' //this has to be here for it to compile for some reason
                    content = 'this should not ever be'
                }

                if (!isAdmin && args.close) {
                    return accessDenied;
                }

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('list:select:' + customid)
                    .setPlaceholder('Select a project')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(projectOptions);

                const actionRow =
                    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                        selectMenu,
                    );

                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral,
                        content: 'Please select a project ' + content,
                        components: [actionRow.toJSON()],
                    },
                };

                this.interactions.push({
                    request: interaction,
                    response,
                    timestamp: Date.now(),
                });
                return response;



            } else
                if (args.create) {
                    return this.privateMessage('1. Create an account on https://spearmint.xyz/\n2. Follow the instructions on https://docs.spearmint.xyz/docs/create-a-project to create your project \n3. Retrieve the project ID, and API key under the Developers tab \n4. Use \'/list initialize\' and input info to initialize the project into discord \nRead more about the allow list miniapp at [insert link]');
                }

        }

        if (
            interaction.type === InteractionType.MessageComponent &&
            ((interaction.data.custom_id === ('list:select:pstatus')) || (interaction.data.custom_id === ('list:select:pclose')) || (interaction.data.custom_id === ('list:select:pjoin')))
        ) {
            // Get the selected project from the interaction data
            const interactionData = interaction.data as APIMessageStringSelectInteractionData;

            if (interactionData.values) {
                const selectedProject = interactionData.values[0];

                // Find the corresponding record based on the selected project name
                const records = await airtable.getRecords();
                const selectedRecord = records.find(
                    (record: any) => record.fields['Name'] === selectedProject,
                );

                // Check if a matching record is found
                if (selectedRecord) {
                    // Save the corresponding IDs
                    const projectIDTable = selectedRecord.fields['Proj ID'];
                    const apiKeyTable = selectedRecord.fields['API key'];
                    const projectStatusTable = selectedRecord.fields['status'];
                    const recordID = selectedRecord.id;
                    var entryStatus;

                    if (interaction.data.custom_id === ('list:select:pstatus')) {
                        if (isAdmin) {
                            try {
                                entryStatus = await listApi.getEntryStatus(
                                    projectIDTable,
                                    apiKeyTable,
                                    userAddress,
                                );
                            } catch (error) { //if the above errors, that means that person isn't in that project
                                return this.privateMessage('You did not submit an entry to this list');

                            }


                            const response: APIInteractionResponse = {
                                type: InteractionResponseType.ChannelMessageWithSource,
                                data: {
                                    flags: MessageFlags.Ephemeral,
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`${selectedProject} Allowlist Status`)
                                            .setDescription(`Status: ${entryStatus.data.status}\nThe list is ${projectStatusTable}`)
                                            .toJSON(),
                                    ],
                                    components: [
                                        new ActionRowBuilder<MessageActionRowComponentBuilder>()
                                            .addComponents([
                                                new ButtonBuilder()
                                                    .setLabel('Leave')
                                                    .setCustomId(`list:button:leave:${recordID}`)
                                                    .setStyle(ButtonStyle.Danger),
                                            ])
                                            .toJSON(),
                                    ],
                                },
                            };
                            return response;
                        } else {
                            var link = 'https://spearmint.xyz/projects/' + projectIDTable + '/dashboard'
                            return this.privateMessage("Check out your selected project at " + link)
                        }
                    } else if (interaction.data.custom_id === ('list:select:pclose')) {

                        airtable.updateRecord(recordID, { 'status': 'closed' });

                        const response: APIInteractionResponse = {
                            type: InteractionResponseType.ChannelMessageWithSource,
                            data: {
                                content: `Allowlist ${selectedProject} has been closed`,
                            },
                        };
                        return response;

                    } else if (interaction.data.custom_id === ('list:select:pjoin')) {
                        const status = 'not_selected';

                        //Attempts to call API function here
                        listApi.createOrUpdateEntry(
                            projectIDTable,
                            apiKeyTable,
                            userAddress,
                            userId,
                            status,
                        );
                        const response: APIInteractionResponse = {
                            type: InteractionResponseType.ChannelMessageWithSource,
                            data: {
                                flags: MessageFlags.Ephemeral,
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Green')
                                        .setAuthor({ name: 'Success!', iconURL: 'https://i.imgur.com/kLfE9HY.png' })
                                        .setTitle(`${selectedProject} Allowlist`)
                                        .setDescription(`You have been entered to the ${selectedProject} Allowlist`)
                                        .toJSON(),
                                ],
                                components: [
                                    new ActionRowBuilder<MessageActionRowComponentBuilder>()
                                        .addComponents([
                                            new ButtonBuilder()
                                                .setLabel('Status')
                                                .setCustomId(`list:button:status:${recordID}`)
                                                .setStyle(ButtonStyle.Primary),
                                        ])
                                        .addComponents([
                                            new ButtonBuilder()
                                                .setLabel('Leave')
                                                .setCustomId(`list:button:leave:${recordID}`)
                                                .setStyle(ButtonStyle.Danger),
                                        ])
                                        .toJSON(),
                                ],
                            },
                        };
                        this.interactions.push({
                            request: interaction,
                            response,
                            timestamp: Date.now(),
                        });
                        return response;
                    }
                }
            }
        }

        if (interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id.startsWith('list:button:')) {

            const customId = interaction.data.custom_id;

            // Extract the project ID from the custom ID (assuming the custom ID has the format 'list:button:join/status/leave<projectID>')
            const entryId = customId.split(':')[3]; // The project ID will be at index 4 in the split array
            const currRecord = await airtable.getRecord(entryId);

            // Check if a matching record is found

            // Save the corresponding IDs
            const listNameTable = currRecord.fields['Name'];
            const projectIDTable = currRecord.fields['Proj ID'];
            const apiKeyTable = currRecord.fields['API key'];


            if (customId.startsWith('list:button:join')) {
                const status = 'not_selected';

                //Attempts to call API function here
                listApi.createOrUpdateEntry(
                    projectIDTable,
                    apiKeyTable,
                    userAddress,
                    userId,
                    status,
                );
                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setAuthor({ name: 'Success!', iconURL: 'https://i.imgur.com/kLfE9HY.png' })
                                .setTitle(`You have been entered to the ${listNameTable} Allow List`)
                                .setImage('https://i.imgur.com/hxvxuOS.png')
                                .toJSON(),
                        ],
                        components: [
                            new ActionRowBuilder<MessageActionRowComponentBuilder>()
                                .addComponents([
                                    new ButtonBuilder()
                                        .setLabel('Status')
                                        .setCustomId(`list:button:status:${entryId}`)
                                        .setStyle(ButtonStyle.Primary),
                                ])
                                .addComponents([
                                    new ButtonBuilder()
                                        .setLabel('Leave')
                                        .setCustomId(`list:button:leave:${entryId}`)
                                        .setStyle(ButtonStyle.Danger),
                                ])
                                .toJSON(),
                        ],
                    },
                };
                this.interactions.push({
                    request: interaction,
                    response,
                    timestamp: Date.now(),
                });
                return response;
            } else if (customId.startsWith('list:button:status')) {
                const entryStatus = await listApi.getEntryStatus(
                    projectIDTable,
                    apiKeyTable,
                    userAddress,
                );
                {
                    const response: APIInteractionResponse = {
                        type: InteractionResponseType.ChannelMessageWithSource,
                        data: {
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('White')
                                    .setTitle(`${listNameTable} Allow List Status`)
                                    .setDescription(entryStatus.data.status)
                                    .setImage('https://i.imgur.com/5sNOgLA.png')
                                    .toJSON(),
                            ],
                            components: [
                                new ActionRowBuilder<MessageActionRowComponentBuilder>()
                                    .addComponents([
                                        new ButtonBuilder()
                                            .setLabel('Leave')
                                            .setCustomId(`list:button:leave:${entryId}`)
                                            .setStyle(ButtonStyle.Danger),
                                    ])
                                    .toJSON(),
                            ],
                        },
                    };
                    this.interactions.push({
                        request: interaction,
                        response,
                        timestamp: Date.now(),
                    });
                    return response;
                }
            } else if (customId.startsWith('list:button:leave')) {
                // Sets Var
                const status = 'disqualified';
                listApi.createOrUpdateEntry(
                    projectIDTable,
                    apiKeyTable,
                    userAddress,
                    userId,
                    status,
                );

                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`You have left ${listNameTable}`)
                                .setImage('https://i.imgur.com/b49Eg1I.png')
                                .toJSON(),
                        ],
                        components: [
                            new ActionRowBuilder<MessageActionRowComponentBuilder>()

                                .addComponents([
                                    new ButtonBuilder()
                                        .setLabel('Join')
                                        .setCustomId(`list:button:join:${entryId}`)
                                        .setStyle(ButtonStyle.Success),
                                ])
                                .toJSON(),
                        ],
                    },
                };
                this.interactions.push({
                    request: interaction,
                    response,
                    timestamp: Date.now(),
                });
                return response;
            }

        }
    }

    private renderInteractionData(
        interaction: DiscordActionRequest<APIInteraction>,
        md = true,
    ): string {
        const data = stringify(interaction.data);
        return md ? '```json\n' + data + '```' : data;
    }

    /**
     * Build a list of supported Discord interactions
     * @returns
     */
    private getSupportedInteractions(): DiscordInteractionPattern[] {
        return [
            {
                // Handle slash command
                type: InteractionType.ApplicationCommand,
                names: ['list*'],
            },
            {
                // Handle slash command with auto complete
                type: InteractionType.ApplicationCommandAutocomplete,
                names: ['list*'],
            },
            {
                // Handle buttons/selections
                type: InteractionType.MessageComponent,
                ids: ['list:*'],
            },
            {
                // Handle modal
                type: InteractionType.ModalSubmit,
                ids: ['list:*'],
            },
        ];
    }

    /**
     * Build a list of Discord application commands. It's possible to use tools
     * like https://autocode.com/tools/discord/command-builder/.
     * @returns
     */
    private getApplicationCommands(): ApplicationCommandSpec[] {
        //const selectMenuOptions = this.storeProjects.map((project) => { THIS VERSION IS FOR IF WE WANT THE MENU IN THE SLASH COMMAND
        //    return {
        //        name: project.projectID,
        //        value: project.apiKey,
        //    };
        //});
        const commands: ApplicationCommandSpec[] = [
            // `/poll-action` slash command
            {
                metadata: {
                    name: 'Allowlist',
                    shortName: 'allow-list',
                    supportedEnvs: ['list', 'qa', 'staging'],
                },

                type: ApplicationCommandType.ChatInput,
                name: 'list',
                description: 'List command',
                options: [
                    // Subcommand: /list create
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: 'initialize',
                        description: 'Create new list',
                        options: [
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'name',
                                description: 'Enter Project Name',
                                required: true,
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'projectid',
                                description: 'Enter Project ID',
                                required: true,
                            },
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'apikey',
                                description: 'Enter API key',
                                required: true,
                            },
                        ],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: 'status',
                        description: 'list status',
                        //options: [   THIS VERSION IS FOR IF WE WANT THE MENU IN THE SLASH COMMAND
                        //    {
                        //        type: ApplicationCommandOptionType.String,
                        //        name: 'project',
                        //        description: 'Select a project',
                        //        required: true,
                        //        choices: selectMenuOptions,
                        //    },
                        //],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: 'close',
                        description: 'close list',
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: 'create',
                        description: 'Create your allowlist on the spearmint website',
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: 'join',
                        description: 'Join an open allowlist'
                    },
                ],
            },
        ];
        return commands;
    }
    private privateMessage(message: string) { //method to return a private message. Only has a message, no title, no other embeds
        const response: APIInteractionResponse = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: message,
                flags: MessageFlags.Ephemeral,
            },
        };
        return response;
    }

}
