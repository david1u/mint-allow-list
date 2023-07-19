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
    private address: string = '';
    private projectID: string = '';
    private apiKey: string = '';
    private projName: string = '';
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
        console.log(interaction.actionContext);
        //interaction.actionContext.wall...
        const projectID = '3fd819d8-8bd5-4d5b-a3b4-ae4820b58bf4';
        const apiKey = 'spsk_PiosaAbiHXn5I1paVlREGP5WfQZ5IleAzwBkSdtL';
        const address = interaction.actionContext?.gmPassAddress;
        const userId = interaction.member?.user.id;


        const airtable = new AirtableAPI();
        const listApi = new ListAPI();
        const records = await airtable.getRecords();

        if (interaction.type === InteractionType.ApplicationCommand) {

            const cmd = parseApplicationCommand(
                interaction as APIChatInputApplicationCommandInteraction,
            );
            const args = cmd.args;

            //{ create: { wallet: 'd', projectid: 'd', apikey: 'd' } }
            const isAdmin = interaction.actionContext?.isCommunityAdmin; //NO WORKING IGNORE FOR NOW

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
            } else if (args.initialize) {

                this.address = address;
                this.projectID = args.initialize.projectid;
                this.apiKey = args.initialize.apikey;
                this.projName = args.initialize.name;

                // Check if the name already exists in the Airtable
                const records = await airtable.getRecords();
                const existingRecord = records.find((record: any) => record.fields['Name'] === this.projName);
                if (existingRecord) {
                    const response: APIInteractionResponse = {
                        type: InteractionResponseType.ChannelMessageWithSource,
                        data: {
                            content: 'The name for the allow list already exists, please try against with another name or remove the current one',
                            flags: MessageFlags.Ephemeral,
                        },
                    };
                    return response;
                }

                // Adds inputted project ID into the array based on user input
                const recordData = {
                    "Name": this.projName,
                    'Proj ID': this.projectID,
                    'API key': this.apiKey,
                };

                // Call the createRecord method of AirtableAPI to save the data
                await airtable.createRecord(recordData);

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

                const records = await airtable.getRecords();
                const projectOptions: StringSelectMenuOptionBuilder[] = records.map(
                    (record: any) => {
                        const name = record.fields['Name'];
                        const recordID = record.id;
                        return new StringSelectMenuOptionBuilder()
                            .setLabel(name)
                            .setValue(name);
                    },
                );

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('list:select:project')
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
            if (args.create) {
                const response: APIInteractionResponse = {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        content: '1. Create an account on https://spearmint.xyz/\n2. Follow the instructions on https://docs.spearmint.xyz/docs/create-a-project to create your project \n3. Retrieve the project ID, and API key under the Developers tab \n4. Use \'/list initialize\' and input info to initialize the project into discord \nRead more about the allow list miniapp at [insert link]',
                        flags: MessageFlags.Ephemeral,
                    },
                };
                return response;
            }
        }

        if (
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:button:status'//add projectID to look up using API
        ) {
            const entryStatus = await listApi.getEntryStatus(
                projectID,
                apiKey,
                address,
            );
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
                                        .setLabel('Leave')
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

        if (
            //Checks if button is clicked?
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:button:join'
        ) {
            const status = 'not_selected';

            //Attempts to call API function here
            listApi.createOrUpdateEntry(
                projectID,
                apiKey,
                address,
                userId,
                status,
            );
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
                                    .setLabel('Status')
                                    .setCustomId('list:button:status')
                                    .setStyle(ButtonStyle.Primary),
                            ])
                            .addComponents([
                                new ButtonBuilder()
                                    .setLabel('Leave')
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

        if (
            //Checks if leave button is clicked?
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:button:leave'
        ) {
            // Sets Var
            const status = 'disqualified';
            listApi.createOrUpdateEntry(
                projectID,
                apiKey,
                address,
                userId,
                status,
            );

            const response: APIInteractionResponse = {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('[Name of allow list]')
                            .setDescription('you have left [Name of Allow List]')
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
        if (
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:select:project'
        ) {
            // Get the selected project from the interaction data
            const interactionData = interaction.data as APIMessageStringSelectInteractionData;

            if (interactionData.values) {
                const selectedProject = interactionData.values[0];

                // Find the corresponding record based on the selected project name
                const selectedRecord = records.find(
                    (record: any) => record.fields['Name'] === selectedProject,
                );

                // Check if a matching record is found
                if (selectedRecord) {
                    // Save the corresponding IDs
                    const projectIDTable = selectedRecord.fields['Proj ID'];
                    const apiKeyTable = selectedRecord.fields['API key'];

                    const entryStatus = await listApi.getEntryStatus(
                        projectIDTable,
                        apiKeyTable,
                        address,
                    );
                    const response: APIInteractionResponse = {
                        type: InteractionResponseType.ChannelMessageWithSource,
                        data: {
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(`${selectedProject} AllowList Status`)
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

                    return response;
                }
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
                        name: 'initialize',
                        description: 'Create new list',
                        options: [
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'name',
                                description: 'Enter Project Name',
                                required: true,
                            },
                            /*{
                                type: ApplicationCommandOptionType.String,
                                name: 'wallet',
                                description: 'Wallet Id',
                                required: true,
                            },
                            */
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
                ],
            },
        ];
        return commands;
    }
}
