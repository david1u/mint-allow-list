import { getFetch, handleFetchResponse } from '@collabland/common';

export class AirtableAPI {
    private pToken = 'patWO6UMOxAld43uD.945260094b1fd37858a02c909977c2698420af0e4acbcf632677619909bb4e87';
    private baseId = 'appJFQ6xdXqbJCmoN';
    private tableName = 'tblEzMUXEKUMR0iBA';

    private fetch = getFetch(
        {
            headers: {
                'Authorization': `Bearer ${this.pToken}`,
                'Content-Type': 'application/json'
            }
        });


    // Create a table
    async createTable() {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/Tables`;

        const fields = [
            { name: 'Allow List Name', type: 'text' },
            { name: 'Proj-ID', type: 'text' },
            { name: 'APIKey', type: 'text' },
        ];

        const tableData = {
            fields: fields,
            name: this.tableName
        };

        try {
            const response = await this.fetch(endpoint, { method: 'post', body: JSON.stringify(tableData) });
            const result = await handleFetchResponse(response);
            console.log('Table created successfully:', result);
        } catch (error) {
            console.error('Error creating table:', error);
        }
    };

    // Retrieve records from a table
    async getRecords() {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;

        try {
            const response = await this.fetch(endpoint, { method: 'post' });
            const result = await handleFetchResponse(response);
            console.log('Table created successfully:', result);
        } catch (error) {
            console.error('Error creating table:', error);
        }
    };

    // Create a record in a table
    async createRecord(data: any) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;

        try {
            const response = await this.fetch(endpoint, { method: 'post', body: JSON.stringify({ fields: data }) });
            const result = await handleFetchResponse(response);
            console.log('Record created successfully:', result);
        } catch (error) {
            console.error('Error creating record:', error);
        }
    };

    // Update a record in a table
    async updateRecord(recordId: string, data: any) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}/${recordId}`;

        try {
            const response = await this.fetch(endpoint, { method: 'post', body: JSON.stringify({ fields: data }) });
            const result = await handleFetchResponse(response);
            console.log('Record created successfully:', result);
        } catch (error) {
            console.error('Error creating record:', error);
        }
    };

    // Delete a record from a table
    async deleteRecord(recordId: string) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}/${recordId}`;

        try {
            const response = await this.fetch(endpoint, { method: 'post' });
            const result = await handleFetchResponse(response);
            console.log('Table created successfully:', result);
        } catch (error) {
            console.error('Error creating table:', error);
        }
    };
}
