import { getFetch, handleFetchResponse } from '@collabland/common';

type responseAPI = {
    data: Array<{
        //id, name ,creator, community id, entries[]
        name: string;
        type: string;
        defaultValue: string | boolean;
    }>;
};


export class ListAPI {
    private fetch = getFetch({
        headers: { 'api-key': 'spsk_9U84OvT1ReIc8r0XP3nPZQsUEwYVnDtCMdtWajfI' }, //might need user to submit their own API key as well
    });

    async createAttestationSchema(projectID: string) {
        const response = await this.fetch(
            `https://api.spearmint.xyz/projects/${projectID}/attestationSchema`
            ,
            {
                method: 'PUT',
                headers: {
                    accept: 'application/json',
                    Authorization: 'spsk_9U84OvT1ReIc8r0XP3nPZQsUEwYVnDtCMdtWajfI',
                    'content-type': 'application/json'
                }
            },
        );
        const data = await handleFetchResponse<responseAPI>(response);
        return data;
    }

    async createOrUpdateEntry(projectID: string, address: string) {

    }

    async getProof(projectID: string, address: string) {

    }

    async getEntryStatus(projectID: string, address: string) {

    }

    async getEntry(projectID: string, address: string) {

    }
}

async function main() {

}
