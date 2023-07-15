import axios from 'axios';

export class AirtableAPI {

    private apiKey = 'fldLsh8ICJDyMivki';
    private baseId = 'appJFQ6xdXqbJCmoN';
    private tableName = 'tblEzMUXEKUMR0iBA';

    // Create a table
    async createTable() {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/Tables`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        const fields = [
            { name: 'Allow List Name', type: 'text' },
            { name: 'Proj ID', type: 'text' },
            { name: 'API Key', type: 'text' },
            { name: 'User IDs and Wallet IDs', type: 'array' }
        ];

        const tableData = {
            fields: fields,
            name: this.tableName
        };

        try {
            const response = await axios.post(endpoint, tableData, { headers });
            console.log('Table created successfully:', response.data);
        } catch (error) {
            console.error('Error creating table:', error.response.data);
        }
    };

    // Retrieve records from a table
    async getRecords() {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.get(endpoint, { headers });
            console.log('Records retrieved successfully:', response.data.records);
        } catch (error) {
            console.error('Error retrieving records:', error.response.data);
        }
    };

    // Create a record in a table
    async createRecord(data: any) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.post(endpoint, { fields: data }, { headers });
            console.log('Record created successfully:', response.data);
        } catch (error) {
            console.error('Error creating record:', error.response.data);
        }
    };

    // Update a record in a table
    async updateRecord(recordId: string, data: any) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}/${recordId}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.patch(endpoint, { fields: data }, { headers });
            console.log('Record updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating record:', error.response.data);
        }

    };

    // Delete a record from a table
    async deleteRecord(recordId: string) {
        const endpoint = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}/${recordId}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.delete(endpoint, { headers });
            console.log('Record deleted successfully:', response.data);
        } catch (error) {
            console.error('Error deleting record:', error.response.data);
        }
    };
}
