import { getFetch, handleFetchResponse, stringify } from '@collabland/common';
type Vote = {
  identifier: string;
  poll_id: string;
  option_id: string;
  created_at: string;
  updated_at: string;
  id: string;
  entity: 'Vote';
};
type CreateVoteResponse = {
  status: string;
  statusCode: number;
  data: Vote
}
type AllVoteAPIresponse = {
  status: string;
  statusCode: number;
  data: {
    docs: Vote[];
    totalDocs: number;
    offset: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: null;
    nextPage: null;
  };
};

type Option = {
  data: null | string;
  text: string;
  votes_count: number;
  poll_id: string;
  created_at: string;
  updated_at: string;
  id: string;
  entity: 'Option';
};

type Poll = {
  data: null | string;
  identifier: null;
  question: string;
  created_at: string;
  updated_at: string;
  id: string;
  entity: 'Poll';
  options: Option[];
};

type ApiResponse = {
  status: 'success';
  statusCode: number;
  data: Poll;
};

export class Pollsapi {
  private fetch = getFetch({
    headers: { 'api-key': 'F8CMMVTGA0MVPVHGFCA2M4HDJNA2' },
  });

  async createPoll(question: string, options: string[]) {
    const response = await this.fetch(
      'https://api.pollsapi.com/v1/create/poll',
      {
        method: 'post',
        body: JSON.stringify({
          question,
          options: options.map(opt => {
            return { text: opt };
          }),
        }),
      },
    );
    const data = await handleFetchResponse<ApiResponse>(response);
    return data;
  }

  async getPoll(id: string) {
    const response = await this.fetch(
      `https://api.pollsapi.com/v1/get/poll/${id}`,
      {
        method: 'get',
      },
    );
    const data = await handleFetchResponse<{ data: Poll }>(response);
    return data.data;
  }
  async createVote(vote: Pick<Vote, 'poll_id' | 'option_id' | 'identifier'>) {  // from the vote object, select poll_id, option_id, and identifier
    const url = 'https://api.pollsapi.com/v1/create/vote';

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(vote),
    };
    const response = await this.fetch(url, requestOptions);
    const data = await handleFetchResponse<CreateVoteResponse>(response);
    return data;
  }
  async getAllVotesOnPoll(pollId: string, offset = 0, limit = 100) {
    const url = `https://api.pollsapi.com/v1/get/votes/${pollId}?offset=${offset}&limit=${limit}`;
    const response = await this.fetch(url, {
      method: 'get',
    });
    const data = await handleFetchResponse<AllVoteAPIresponse>(response);
    return data;
  }
  async removeVote(vote_id: string) {
    const url = 'https://api.pollsapi.com/v1/remove/vote';
    const response = await this.fetch(url, {
      method: 'post',
      body: JSON.stringify({ vote_id })
    })
    const data = await handleFetchResponse(response);
    return data;
  }
}

async function main() {
  const api = new Pollsapi();
  const poll = await api.createPoll('What is your favorite color?', [
    'Red',
    'Blue',
    'Green',
  ]);
  console.log(stringify(poll));
  const pollId = poll.data.id;
  const found = await api.getPoll(pollId);
  console.log(found);
  const vote = await api.createVote({
    identifier: 'Jerry',
    option_id: found.options[0].id,
    poll_id: pollId,
  });
  console.log('This is your vote', vote);
  const allVotes = await api.getAllVotesOnPoll(pollId);
  console.log(stringify(allVotes));
  const votes = allVotes.data.docs.map(d => { return { pollId: d.poll_id, id: d.id, identifier: d.identifier } });
  console.log(stringify(votes));
  const deleteVote = await api.removeVote(vote.data.id)
  console.log(deleteVote);
}

if (require.main === module) {
  main();
}
