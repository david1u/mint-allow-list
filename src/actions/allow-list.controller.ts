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
    InteractionType
} from '@collabland/discord';
import { MiniAppManifest } from '@collabland/models';
import { BindingScope, injectable } from '@loopback/core';
import { api, get, param } from '@loopback/rest';
import {
    APIInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    MessageFlags,
    ModalActionRowComponentBuilder,
    //ModalBuilder,
    //RoleSelectMenuBuilder,
    //StringSelectMenuBuilder,
    //StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { ListAPI } from './spearmint-api';
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

        const { Events, ModalBuilder } = require('discord.js');

        console.log('interaction: %O', interaction);
        const listApi = new ListAPI();
        //if (
        //    interaction.type === InteractionType.ApplicationCommand &&
        //    interaction.data.name === 'list'
        //) {
        //    const data = new ModalBuilder()
        //        .setTitle('Create an allow list')
        //        .setCustomId('list:modal:modal')
        //        .addComponents(
        //            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        //                new TextInputBuilder()
        //                    .setCustomId('list:text:interaction')
        //                    .setLabel('Input')
        //                    .setStyle(TextInputStyle.Paragraph)
        //                    .setPlaceholder('Project ID:')
        //            ),
        //        )
        //        .toJSON();
        //    return {
        //        type: InteractionResponseType.Modal,
        //        data,
        //    };
        //}

        if (//Checks if button is clicked?
            interaction.type === InteractionType.MessageComponent &&
            interaction.data.custom_id === 'list:button:join'
        ) {
            //Creates the first modal to input your wallet address manually (will be automated)
            const data = new ModalBuilder()
                .setTitle('Join Info')
                .setCustomId('list:modal:modal')
                .addComponents(
                    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('list:text:address')
                            .setLabel('Please input your wallet address')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Wallet Address'),
                    ),
                )
                .toJSON();
            return {
                type: InteractionResponseType.Modal,
                data,
            };
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            // Sets Var
            const projectID = '3fd819d8-8bd5-4d5b-a3b4-ae4820b58bf4';
            const apiKey = 'spsk_PiosaAbiHXn5I1paVlREGP5WfQZ5IleAzwBkSdtL';
            //const address = '0x0F5c4b3d79D99D405949193a85719f29408d8637';//justin address for now
            const userId = interaction.member?.user.id;
            //address = user input
            const address = interaction.data.components[0].components[0].value.trim();
            try {
                //Attempts to call API function here
                const result = await listApi.createOrUpdateEntry(
                    projectID,
                    apiKey,
                    address,
                    userId
                );
                console.log(result);
            } catch (error) {
                console.error('Error:', error);
            }
        }
        //Bot message that is sent when '/list' slash command is called
        const response: APIInteractionResponse = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: MessageFlags.Ephemeral,
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
                description: 'list command',
            },
        ];
        return commands;
    }
}