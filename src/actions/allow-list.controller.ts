// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-dev-action
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
    parseApplicationCommand
} from '@collabland/discord';
import { MiniAppManifest } from '@collabland/models';
import { BindingScope, injectable } from '@loopback/core';
import { api, get, param } from '@loopback/rest';
import {
    APIChatInputApplicationCommandInteraction,
    APIInteraction,
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
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
class projectInfo {
    projectIDObject: string;
    apiKeyObject: string;
    constructor(id: string, key: string) {
        this.projectIDObject = id;
        this.apiKeyObject = key;
    }
}

@api({ basePath: '/allow-list' }) // Set the base path to `/allow-list`
export class AllowListController extends BaseDiscordActionController {
    private address: string = "";
    private projectID: string = "";
    private apiKey: string = "";
    private interactions: {
        request: DiscordActionRequest<APIInteraction>;
        response: APIInteractionResponse;
        timestamp: number;
    }[] = [];
    private storeProjects: string[] = [];

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
        };
        return metadata;
    }
    private async getProjectOptions(): Promise<StringSelectMenuOptionBuilder[]> {
        const projectOptions: StringSelectMenuOptionBuilder[] = [];
        console.log('storeProjects:', this.storeProjects); // Check if storeProjects is accessible and its current value

        for (const apiKey of this.storeProjects) {
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(apiKey);
            projectOptions.push(option);
        }
        /*for (const project of this.storeProjects) {
            console.log('project:', project); // Check each project object in the loop
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(project.projectIDObject)
                .setValue(project.apiKeyObject);
            projectOptions.push(option);
        }
        */
        console.log('projectOptions:', projectOptions); // Check the resulting projectOptions array

        return projectOptions;
    }

    /**
     * Handle the Discord interaction
     * @param interaction - Discord interaction with Collab.Land action context
     * @returns - Discord interaction response
     */

    protected async handle(
        interaction: DiscordActionRequest<APIInteraction>,
    ): Promise<DiscordActionResponse | undefined> {

        //interaction.actionContext.wall...
        const projectID = '3fd819d8-8bd5-4d5b-a3b4-ae4820b58bf4';
        const apiKey = 'spsk_PiosaAbiHXn5I1paVlREGP5WfQZ5IleAzwBkSdtL';
        const address = '0x0F5c4b3d79D99D405949193a85719f29408d8637';
        const userId = interaction.member?.user.id;

        const airtable = new AirtableAPI();
        const listApi = new ListAPI();
        if (
            interaction.type === InteractionType.ApplicationCommand
        ) {
            const cmd = parseApplicationCommand(interaction as APIChatInputApplicationCommandInteraction);
            const args = cmd.args;

            //{ create: { wallet: 'd', projectid: 'd', apikey: 'd' } }
            const isAdmin = interaction.member?.permissions;//NO WORKING IGNORE FOR NOW

            if (!isAdmin) {
                console.log(isAdmin);
                // User is not an admin, handle the access denied case
                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        content: 'This command is only accessible to administrators.',
                        flags: MessageFlags.Ephemeral,
                    },
                };
                return response;
            } else if (args.create) {
                //console.log(isAdmin);
                this.address = args.create.wallet;
                this.projectID = args.create.projectid;
                this.apiKey = args.create.apikey;

                // Adds inputted project ID into the array based on user input

                if (this.projectID && this.apiKey) {
                    console.log(this.projectID);
                    this.storeProjects.push(this.apiKey);
                }


                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Spearmint Allow List')
                                .setDescription(this.describeInteraction(interaction))
                                .toJSON(),
                        ],
                        components: [
                            new ActionRowBuilder<MessageActionRowComponentBuilder>()
                                .addComponents([
                                    new ButtonBuilder()
                                        .setLabel('Join')
                                        .setCustomId('list:button:join')
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

            if (args.status) {
                //const selectedProject = args.status[0].options[0].value;
                const entryStatus = await listApi.getEntryStatus(projectID, apiKey, address);
                const projectOptions = await this.getProjectOptions();
                console.log(projectOptions);
                console.log(this.storeProjects);

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('list:select:project')
                    .setPlaceholder('Select a project')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(projectOptions);

                const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents(selectMenu);
                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral,
                        content: 'Please select a project:',
                        components: [actionRow.toJSON()],
                    },
                };

                this.interactions.push({
                    request: interaction,
                    response,
                    timestamp: Date.now(),
                });

                return response;
            }
            //{
            //    const entryStatus = await listApi.getEntryStatus(projectID, apiKey, address);
            //    const response: APIInteractionResponse = {
            //        type: InteractionResponseType.ChannelMessageWithSource,
            //        data: {
            //            flags: MessageFlags.Ephemeral,
            //            embeds: [
            //                new EmbedBuilder()
            //                    .setTitle('AllowList Status')
            //                    .setDescription(`Your current status is: ${entryStatus.data.status}`)
            //                    .toJSON(),
            //            ],
            //            components: [
            //                new ActionRowBuilder<MessageActionRowComponentBuilder>()
            //                    .addComponents([
            //                        new ButtonBuilder()
            //                            .setLabel('leave')
            //                            .setCustomId('list:button:leave')
            //                            .setStyle(ButtonStyle.Danger),
            //                    ])
            //                    .toJSON(),
            //            ],
            //        },
            //    };
            //    this.interactions.push({
            //        request: interaction,
            //        response,
            //        timestamp: Date.now(),
            //    });
            //    return response;
            //}
        }


        if (
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:button:status'
        ) {
            const entryStatus = await listApi.getEntryStatus(projectID, apiKey, address);
            {
                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('AllowList Status')
                                .setDescription(entryStatus.data.status)
                                .toJSON(),
                        ],
                        components: [
                            new ActionRowBuilder<MessageActionRowComponentBuilder>()
                                .addComponents([
                                    new ButtonBuilder()
                                        .setLabel('leave')
                                        .setCustomId('list:button:leave')
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

        if (//Checks if button is clicked?
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:button:join'
        ) {
            const status = 'not_selected'
            try {
                //Attempts to call API function here
                const result = await listApi.createOrUpdateEntry(
                    projectID,
                    apiKey,
                    address,
                    userId,
                    status
                );
                console.log(result);
            } catch (error) {
                console.error('Error:', error);
            }
            const response: APIInteractionResponse = {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Spearmint Allow List')
                            .setDescription('You Have Been Entered')
                            .toJSON(),
                    ],
                    components: [
                        new ActionRowBuilder<MessageActionRowComponentBuilder>()
                            .addComponents([
                                new ButtonBuilder()
                                    .setLabel('status')
                                    .setCustomId('list:button:status')
                                    .setStyle(ButtonStyle.Primary),
                            ])
                            .addComponents([
                                new ButtonBuilder()
                                    .setLabel('leave')
                                    .setCustomId('list:button:leave')
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

        if (//Checks if leave button is clicked?
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:button:leave'
        ) {
            // Sets Var
            const status = 'disqualified'
            try {
                //Attempts to call API function here
                const result = await listApi.createOrUpdateEntry(
                    projectID,
                    apiKey,
                    address,
                    userId,
                    status
                );
                console.log(result);
            } catch (error) {
                console.error('Error:', error);
            }
            const response: APIInteractionResponse = {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('[Name of allow list]')
                            .setDescription("you have left [Name of Allow List]")
                            .toJSON(),
                    ],
                    components: [
                        new ActionRowBuilder<MessageActionRowComponentBuilder>()

                            .addComponents([
                                new ButtonBuilder()
                                    .setLabel('join')
                                    .setCustomId('list:button:join')
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
        if (
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:select:project'
        ) {
            // Get the selected project from the interaction data
            const selectedProject = interaction.data;

            // TODO: Handle the selected project here and generate the response

            // Example response
            const response: APIInteractionResponse = {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    content: `You selected project: ${selectedProject}`,
                },
            };

            return response;
        }
    }

    private renderInteractionData(
        interaction: DiscordActionRequest<APIInteraction>,
        md = true,
    ): string {
        const data = stringify(interaction.data);
        return md ? '```json\n' + data + '```' : data;
    }

    private describeInteraction(
        interaction: DiscordActionRequest<APIInteraction>,
    ): string {
        return 'Create/Join/Leave various allow lists with the help of Spearmints API.';
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
                    name: 'AllowList',
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
                        name: 'create',
                        description: 'Create new list',
                        options: [
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'wallet',
                                description: 'wallet id',
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
                ],
            },
        ];
        return commands;
    }
}