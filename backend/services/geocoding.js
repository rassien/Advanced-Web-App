const { Client } = require('@googlemaps/google-maps-services-js');

class GeocodingService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️ Google Maps API key not found. Geocoding services will not work.');
    }
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<{lat: number, lng: number}>} - Coordinates
   */
  async geocodeAddress(address) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.apiKey,
          language: 'tr',
          region: 'tr'
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formatted_address: response.data.results[0].formatted_address
        };
      } else {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  /**
   * Get distance matrix between origins and destinations
   * @param {Array<string>} origins - Array of origin addresses
   * @param {Array<string>} destinations - Array of destination addresses
   * @returns {Promise<Array>} - Distance matrix results
   */
  async getDistanceMatrix(origins, destinations) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await this.client.distancematrix({
        params: {
          origins: origins,
          destinations: destinations,
          key: this.apiKey,
          units: 'metric',
          language: 'tr',
          region: 'tr'
        }
      });

      if (response.data.status === 'OK') {
        return response.data.rows.map(row => 
          row.elements.map(element => ({
            distance: element.status === 'OK' ? element.distance : null,
            duration: element.status === 'OK' ? element.duration : null,
            status: element.status
          }))
        );
      } else {
        throw new Error(`Distance Matrix failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Distance Matrix error:', error.message);
      throw new Error(`Distance Matrix failed: ${error.message}`);
    }
  }

  /**
   * Get detailed directions between two points
   * @param {string} origin - Origin address
   * @param {string} destination - Destination address
   * @param {string} mode - Travel mode (driving, walking, transit, bicycling)
   * @returns {Promise<Object>} - Directions result
   */
  async getDirections(origin, destination, mode = 'driving') {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await this.client.directions({
        params: {
          origin: origin,
          destination: destination,
          mode: mode,
          key: this.apiKey,
          language: 'tr',
          region: 'tr'
        }
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance,
          duration: leg.duration,
          start_address: leg.start_address,
          end_address: leg.end_address,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions,
            distance: step.distance,
            duration: step.duration,
            travel_mode: step.travel_mode
          }))
        };
      } else {
        throw new Error(`Directions failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Directions error:', error.message);
      throw new Error(`Directions failed: ${error.message}`);
    }
  }

  /**
   * Batch geocode multiple addresses
   * @param {Array<string>} addresses - Array of addresses to geocode
   * @returns {Promise<Array>} - Array of geocoding results
   */
  async batchGeocode(addresses) {
    const results = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const batchPromises = batch.map(async (address, index) => {
        try {
          const result = await this.geocodeAddress(address);
          return { index: i + index, address, ...result, success: true };
        } catch (error) {
          return { index: i + index, address, error: error.message, success: false };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}

module.exports = new GeocodingService();