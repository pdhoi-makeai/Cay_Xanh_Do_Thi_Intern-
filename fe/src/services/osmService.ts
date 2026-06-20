import axios from 'axios';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export const osmService = {
  /**
   * Search for a street or park geometry using Overpass API
   * @param query The search query, e.g., "Nguyễn Văn Linh, Đà Nẵng"
   * @param type "route" (polyline) or "park" (polygon)
   * @returns GeoJSON feature
   */
  async fetchGeometry(query: string, type: 'route' | 'park' = 'route'): Promise<any> {
    // Basic conversion of query into an OSM search query
    // This is a simplified Overpass QL query.
    // For production, a more robust geocoder (like Nominatim) combined with Overpass is better.
    // Here we assume the user provides a precise street name in Da Nang for demonstration.

    let overpassQuery = '';
    
    if (type === 'route') {
      overpassQuery = `
        [out:json][timeout:25];
        area["name"="Đà Nẵng"]->.searchArea;
        (
          way["name"~"${query}", i](area.searchArea);
        );
        out geom;
      `;
    } else {
      overpassQuery = `
        [out:json][timeout:25];
        area["name"="Đà Nẵng"]->.searchArea;
        (
          way["leisure"="park"]["name"~"${query}", i](area.searchArea);
          relation["leisure"="park"]["name"~"${query}", i](area.searchArea);
        );
        out geom;
      `;
    }

    try {
      const response = await axios.post(OVERPASS_API_URL, `data=${encodeURIComponent(overpassQuery)}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const elements = response.data.elements;
      if (!elements || elements.length === 0) {
        throw new Error('Không tìm thấy dữ liệu hình học cho truy vấn này.');
      }

      // Convert Overpass geometry to GeoJSON
      // Take the first matching way
      const way = elements.find((e: any) => e.type === 'way');
      if (!way || !way.geometry) {
        throw new Error('Dữ liệu trả về không chứa thông tin hình học hợp lệ.');
      }

      const coordinates = way.geometry.map((point: any) => [point.lon, point.lat]);

      return {
        type: "Feature",
        properties: {
          name: way.tags?.name || query,
          osm_id: way.id
        },
        geometry: {
          type: type === 'route' ? "LineString" : "Polygon",
          coordinates: type === 'route' ? coordinates : [coordinates] // Polygon needs an extra nested array
        }
      };

    } catch (error: any) {
      console.error('OSM Fetch Error:', error);
      throw new Error(error.response?.data || error.message || 'Lỗi khi kết nối với Overpass API');
    }
  }
};
