// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/allow-list-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { getFetch, handleFetchResponse } from '@collabland/common';

export class AirtableAPI {

    private pToken = 'patWO6UMOxAld43uD.945260094b1fd37858a02c909977c2698420af0e4acbcf632677619909bb4e87'; //getEnvVar('AIRTABLE_ACCESS_TOKEN');
    private baseId = 'appJFQ6xdXqbJCmoN';
    private tableName = 'tblEzMUXEKUMR0iBA';

    private fetch = getFetch({
        headers: {
            Authorization: `Bearer ${this.pToken}`,
            'Content-Type': 'application/json',
        },
    });

    // Create a table
    async createTable() {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/Tables`;

        const fields = [
            { name: 'Allow List Name', type: 'text' },
            { name: 'Proj-ID', type: 'text' },
            { name: 'API-Key', type: 'text' },
            { name: 'Status', type: 'singleSelect', options: ['open', 'closed'] },
        ];

        const tableData = {
            fields: fields,
            name: this.tableName,
        };

        try {
            const response = await this.fetch(endpoint, {
                method: 'post',
                body: JSON.stringify(tableData),
            });
            const result = await handleFetchResponse(response);
            console.log('Table created successfully:', result);
        } catch (error) {
            console.error('Error creating table:', error);
        }
    }

    //get specific record
    async getRecord(recordId: string) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}/${recordId}`;
        const headers = {
            Authorization: `Bearer ${this.pToken}`,
            'Content-Type': 'application/json',
        };

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: headers,
            });
            if (!response.ok) {
                throw new Error('Failed to retrieve record from Airtable');
            }
            const result = await response.json();
            console.log('Record retrieved successfully:', result);
            return result;
        } catch (error) {
            console.error('Error retrieving record:', error);
            return [];
        }
    }

    // Retrieve records from a table
    async getRecords() {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
        const headers = {
            Authorization: `Bearer ${this.pToken}`,
            'Content-Type': 'application/json',
        };

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: headers,
            });
            if (!response.ok) {
                throw new Error('Failed to retrieve records from Airtable');
            }
            const result = await response.json();
            console.log('Records retrieved successfully:', result);
            return result.records as any[];
        } catch (error) {
            console.error('Error retrieving records:', error);
            return [];
        }
    }

    // Create a record in a table
    async createRecord(data: any) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;

        try {
            const response = await this.fetch(endpoint, {
                method: 'post',
                body: JSON.stringify({ fields: data }),
            });
            const result = await handleFetchResponse(response);
            console.log('Record created successfully:', result);
        } catch (error) {
            console.error('Error creating record:', error);
        }
    }

    // Update a record in a table
    async updateRecord(recordId: string, data: any) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}/${recordId}`;

        try {
            const response = await this.fetch(endpoint, {
                method: 'patch',
                body: JSON.stringify({ fields: data }),
            });
            const result = await handleFetchResponse(response);
            console.log('Record updated successfully:', result);
        } catch (error) {
            console.error('Error updating record:', error);
        }
    }

    // Delete a record from a table
    async deleteRecord(recordId: string) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}/${recordId}`;

        try {
            const response = await this.fetch(endpoint, { method: 'post' });
            const result = await handleFetchResponse(response);
            console.log('Record deleted successfully:', result);
        } catch (error) {
            console.error('Error deleting table:', error);
        }
    }
}
