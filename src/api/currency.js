
const API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR';

export const fetchRates = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch rates');
        }
        const data = await response.json();
        return data.rates;
    } catch (error) {
        console.error('Error fetching rates:', error);
        return null;
    }
};
