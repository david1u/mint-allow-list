// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/allow-list-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { getFetch, handleFetchResponse } from '@collabland/common';

type responseAPI = {
  data: Array<{
    //id, name ,creator, community id, entries[]
    name: string;
    type: string;
    defaultValue: string | boolean;
  }>;
};
type GetEntryStatusAPI = {
  data: {
    status:
    | 'submitted'
    | 'selected'
    | 'waitlisted'
    | 'not_selected'
    | 'disqualified';
  };
};
type GetEntryAPI = {
  data: {
    address: string;
    status:
    | 'submitted'
    | 'selected'
    | 'waitlisted'
    | 'not_selected'
    | 'disqualified';
    tentativeStatus:
    | 'selected'
    | 'waitlisted'
    | 'not_selected'
    | 'disqualified';
    attestationData: Record<string, string | boolean> | null;
  };
};
type GetEntryResponseAPI = {
  data: {
    address: string;
    status:
    | 'submitted'
    | 'selected'
    | 'waitlisted'
    | 'not_selected'
    | 'disqualified';
    tentativeStatus:
    | 'selected'
    | 'waitlisted'
    | 'not_selected'
    | 'disqualified';
    attestationData: Record<string, string | boolean> | null;
  };
};

type GetProofAPIResponse = {
  data: {
    proof: string[];
    attestationData: Record<string, string | boolean> | null;
  };
};

export class ListAPI {
  private fetch = getFetch({
    headers: { 'api-key': 'spsk_9U84OvT1ReIc8r0XP3nPZQsUEwYVnDtCMdtWajfI' }, //might need user to submit their own API key as well
  });

  async createAttestationSchema(projectID: string, apiKey: string) {
    const response = await this.fetch(
      `https://api.spearmint.xyz/projects/${projectID}/attestationSchema`,
      {
        method: 'PUT',
        body: JSON.stringify([
          {
            name: 'userId',
            type: 'string',
            defaultValue: 'user-id',
          },

          {
            name: 'timestamp',
            type: 'uint256',
            defaultValue: '0',
          },
        ]),
        headers: {
          authorization: `Bearer ${apiKey}`,
          accept: 'application/json',
        },
      },
    );
    const data = await handleFetchResponse<responseAPI>(response);
    return data;
  }

  async createOrUpdateEntry(
    projectID: string,
    apiKey: string,
    address: string,
    ID: string = '',
    status: string,
  ) {
    await this.createAttestationSchema(projectID, apiKey);

    const response = await this.fetch(
      `https://api.spearmint.xyz/projects/${projectID}/entries/${address}`,
      {
        headers: {
          authorization: `Bearer ${apiKey}`,
          accept: 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({
          tentativeStatus: status,
          shouldFinalize: false,

          attestationData: {
            userId: ID,
            timestamp: Date.now().toString(),
          },
        }),
      },
    );
    const data = await handleFetchResponse<GetEntryResponseAPI>(response);
    return data;
  }

  async getProof(projectID: string, apiKey: string, address: string) {
    const response = await this.fetch(
      `https://api.spearmint.xyz/projects/${projectID}/proofs/${address}`,
      {
        headers: { authorization: `Bearer ${apiKey}` },

        method: 'get',
      },
    );
    const data = await handleFetchResponse<GetProofAPIResponse>(response);
    return data;
  }

  async getEntryStatus(projectID: string, apiKey: string, address: string) {
    const response = await this.fetch(
      `https://api.spearmint.xyz/projects/${projectID}/entries/${address}/status`,
      {
        headers: { authorization: `Bearer ${apiKey}` },
        method: 'get',
      },
    );
    const data = await handleFetchResponse<GetEntryStatusAPI>(response);
    return data;
  }

  async getEntry(projectID: string, apiKey: string, address: string) {
    const response = await this.fetch(
      `https://api.spearmint.xyz/projects/${projectID}/entries/${address}`,
      {
        headers: { authorization: `Bearer ${apiKey}` },
        method: 'get',
      },
    );
    const data = await handleFetchResponse<GetEntryAPI>(response);
    return data;
  }
}

async function main() { }