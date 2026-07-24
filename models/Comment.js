const { ObjectId } = require('mongodb');

class PlaceModel {
  /**
   * @param {import('mongodb').Db} db 
   */
  constructor(db) {
    this.collection = db.collection('places');
  }

  /**
   * Fetch filtered destination options or invoke cascading fallback matches
   */
  async findByCategoryWithFallback(stateId, category) {
    const queryConditions = {};
    if (stateId) queryConditions.stateId = stateId;
    if (category) queryConditions.category = category;

    // Run primary search execution
    let searchResults = await this.collection.find(queryConditions).toArray();

    // Dynamic Fail-Safe Logic: Pull default fallback if category contains no entries
    if (searchResults.length === 0 && stateId && category) {
      searchResults = await this.collection.find({ 
        stateId, 
        isFallbackDefault: true 
      }).toArray();
      
      // Secondary absolute fallback to prevent UI card crashes
      if (searchResults.length === 0) {
        searchResults = await this.collection.find({ stateId }).limit(1).toArray();
      }
    }
    return searchResults;
  }

  /**
   * Insert fresh tourist spot data and safely override old fallback defaults
   */
  async create(placeData) {
    // If marked as fallback default, reset any prior defaults for that specific category inside the state
    if (placeData.isFallbackDefault) {
      await this.collection.updateMany(
        { stateId: placeData.stateId, category: placeData.category },
        { $set: { isFallbackDefault: false, updatedAt: new Date() } }
      );
    }

    const document = {
      name: placeData.name,
      stateId: placeData.stateId, // Stored relational reference string or ObjectId link
      category: placeData.category, // Restricted to: Heritage, Spiritual, Nature, Coastal, Wild India
      summary: placeData.summary,
      details: placeData.details,
      bestTime: placeData.bestTime,
      keyHighlights: Array.isArray(placeData.keyHighlights) ? placeData.keyHighlights : [],
      isFallbackDefault: !!placeData.isFallbackDefault,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(document);
    return { _id: result.insertedId, ...document };
  }
}

module.exports = PlaceModel;