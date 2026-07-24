const { ObjectId } = require('mongodb');

class PlaceModel {
  /**
   * @param {import('mongodb').Db} db 
   */
  constructor(db) {
    this.collection = db.collection('places');
  }

  /**
   * Fetch all places (optional filters: stateId, category)
   */
  async findAll(filter = {}) {
    return await this.collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Insert a new tourist destination and enforce category fallback logic
   */
  async create(placeData) {
    // If marked as fallback default, reset previous defaults for the same category in this state [cite: 66]
    if (placeData.isFallbackDefault) {
      await this.collection.updateMany(
        { stateId: placeData.stateId, category: placeData.category },
        { $set: { isFallbackDefault: false, updatedAt: new Date() } }
      );
    }

    const document = {
      name: placeData.name,
      stateId: placeData.stateId, // Stored as state ObjectId or stateCode string
      category: placeData.category, // Heritage & Palaces, Spiritual/Temples, Nature/Mountains, Coastal/Beaches, Wild India [cite: 13, 354]
      summary: placeData.summary,
      details: placeData.details,
      bestTime: placeData.bestTime,
      keyHighlights: Array.isArray(placeData.keyHighlights) 
        ? placeData.keyHighlights 
        : (placeData.keyHighlights ? placeData.keyHighlights.split(',').map(item => item.trim()).filter(Boolean) : []),
      isFallbackDefault: !!placeData.isFallbackDefault, // Ensure boolean [cite: 13, 66]
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(document);
    return { _id: result.insertedId, ...document };
  }

  /**
   * Delete a place by its ObjectId
   */
  async delete(id) {
    if (!ObjectId.isValid(id)) return false;
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

module.exports = PlaceModel;