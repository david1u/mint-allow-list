// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/example-poll-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { HttpErrors, debugFactory } from '@collabland/common';
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
} from '@collabland/discord';
import { MiniAppManifest } from '@collabland/models';
import { BindingScope, injectable } from '@loopback/core';
import { api, get, param } from '@loopback/rest';
import {
  APIInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  MessageFlags,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Pollsapi } from './polls-api';
const debug = debugFactory('collabland:poll-action');
/**
 * CollabActionController is a LoopBack REST API controller that exposes endpoints
 * to support Collab.Land actions for Discord interactions.
 */
@injectable({
  scope: BindingScope.SINGLETON,
})
@api({ basePath: '/poll-action' }) // Set the base path to `/poll-action`
export class PollActionController extends BaseDiscordActionController {
  private interactions: {
    request: DiscordActionRequest<APIInteraction>;
    response: APIInteractionResponse;
    timestamp: number;
  }[] = [];
  private pollsApi = new Pollsapi();
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
        appId: 'poll-action',
        developer: 'collab.land',
        name: 'PollAction',
        platforms: ['discord'],
        shortName: 'poll-action',
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

  // ========================================== ^TEMPLATE^ ========================================

  /**
   * Handle the Discord interaction
   * @param interaction - Discord interaction with Collab.Land action context
   * @returns - Discord interaction response
   */

  protected async handle(
    interaction: DiscordActionRequest<APIInteraction>,
  ): Promise<DiscordActionResponse | undefined> {
    console.log('interaction: %O', interaction);
    if (
      interaction.type === InteractionType.ApplicationCommand &&
      interaction.data.name === 'poll'
    ) {
      // creates the pop up (Modal) when user inputs slash command
      const data = new ModalBuilder()
        .setTitle('Create a poll')
        .setCustomId('poll:modal:modal')
        .addComponents(
          // creates the text box for user input 
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('poll:text:description')
              .setLabel('Poll Description')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Hello'),
          ),
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('poll:text:options')
              .setLabel('Options for the poll')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('World'),
          ),
        )
        .toJSON();
      // returns 
      return {
        type: InteractionResponseType.Modal,
        data,
      };
    }
    if (interaction.type === InteractionType.ModalSubmit) {
      //interaction.data.components[] contains the inputted values
      const description = interaction.data.components[0].components[0].value;
      const options = interaction.data.components[1].components[0].value.trim();
      // choices splits each option by newlin   
      const choices = options.split('\n');
      console.log(choices);
      const poll = await this.pollsApi.createPoll(description, choices);
      const buttons = poll.data.options.map((c, index) => {
        return new ButtonBuilder()
          .setLabel(c.text)
          .setCustomId(`poll:${poll.data.id}:${c.id}`)
          .setStyle(ButtonStyle.Secondary);
      });
      //const joinList = new ButtonBuilder()
      //  .setLabel('Join')
      const viewResult = new ButtonBuilder()
        .setLabel('View Results')
        .setCustomId(`poll:${poll.data.id}:view-results`)
        .setStyle(ButtonStyle.Primary);

      //returns the textbox for how many votes in each choice
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [
            new EmbedBuilder()
              .setTitle(description)
              .setFields({ name: 'pollID', value: poll.data.id })
              .setDescription(options)
              .toJSON(),
          ],
          // ASK JERRYS DAD   <------ ASK
          components: [
            new ActionRowBuilder<MessageActionRowComponentBuilder>()
              .addComponents(buttons)
              .toJSON(),
            new ActionRowBuilder<MessageActionRowComponentBuilder>()
              .addComponents(viewResult)
              .toJSON(),
          ],
        },
      };
    }

    // ????????

    if (interaction.type === InteractionType.MessageComponent) {
      if (interaction.data.component_type === ComponentType.Button) {
        const customId = interaction.data.custom_id;
        const vote = customId.split(':'); //vote id 
        let voteCreated = undefined;
        if (vote[2] !== 'view-results') {  //MEANS THERE HAS TO BE 2 OPTIONS (has to be changed to 1 join option)
          const allVotes = await this.pollsApi.getAllVotesOnPoll(
            vote[1],
            0,
            1000,
          );
          const existingVote = allVotes.data.docs.find(
            d => d.identifier === interaction.member?.user.id,
          );
          if (existingVote != null) {
            await this.pollsApi.removeVote(existingVote.id);
          }

          voteCreated = await this.pollsApi.createVote({
            poll_id: vote[1],
            option_id: vote[2],  //why is there only 1 option id  <------- ASK
            identifier: interaction.member!.user.id,
          });
        }
        const poll = await this.pollsApi.getPoll(vote[1]); // isnt pollid vote[1]? <--------- ASK
        const counts: Record<string, number> = {}; // wth is a record 
        poll.options.forEach(p => {   //p is a function, option is the parameter, void is the return 
          counts[p.text] = p.votes_count;
        });
        //const label = choices[index]
        const embed = new EmbedBuilder().setTitle(poll.question).setFields(
          poll.options.map(p => ({
            name: p.text,
            value: p.votes_count.toString(),
            inline: true,
          })),
        );
        if (voteCreated != null) {
          embed.setDescription('Vote ID: ' + voteCreated?.data.id);
        }

        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            flags: MessageFlags.Ephemeral,
            embeds: [embed.toJSON()],
          },
        };
      }
    }
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
        names: ['poll*'],
      },
      {
        // Handle slash command with auto complete
        type: InteractionType.ApplicationCommandAutocomplete,
        names: ['poll*'],
      },
      {
        // Handle buttons/selections
        type: InteractionType.MessageComponent,
        ids: ['poll:*'],
      },
      {
        // Handle modal
        type: InteractionType.ModalSubmit,
        ids: ['poll:*'],
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
          name: 'PollAction',
          shortName: 'poll-action',
          supportedEnvs: ['poll', 'qa', 'staging'],
        },
        type: ApplicationCommandType.ChatInput,
        name: 'poll',
        description: 'Poll command',
      },
    ];
    return commands;
  }
}
