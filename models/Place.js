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
     stateId: new ObjectId(placeData.stateId), // Foreign key reference to states collection
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



  // Relational Join ($lookup): Fetch places joined with State metadata
  async getPlacesJoinedWithState(filterQuery = {}) {
    const pipeline = [];

    // Apply any initial category or state filters
    if (filterQuery.category) {
      pipeline.push({ $match: { category: filterQuery.category } });
    }

    if (filterQuery.stateId && ObjectId.isValid(filterQuery.stateId)) {
      pipeline.push({ $match: { stateId: new ObjectId(filterQuery.stateId) } });
    }

    // Join with 'states' collection
    pipeline.push({
      $lookup: {
        from: 'states',            // Target collection
        localField: 'stateId',      // Field in 'places'
        foreignField: '_id',        // Field in 'states'
        as: 'stateDetails'          // Output array field name
      }
    });

    // Unwind stateDetails array into a single object
    pipeline.push({
      $unwind: {
        path: '$stateDetails',
        preserveNullAndEmptyArrays: true
      }
    });

    return await this.collection.aggregate(pipeline).toArray();
  }



  // Relational Join ($lookup): Get a single place by ID with full State Details
  async getPlaceByIdWithState(placeId) {
    if (!ObjectId.isValid(placeId)) return null;

    const pipeline = [
      { $match: { _id: new ObjectId(placeId) } },
      {
        $lookup: {
          from: 'states',
          localField: 'stateId',
          foreignField: '_id',
          as: 'stateDetails'
        }
      },
      {
        $unwind: {
          path: '$stateDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    const results = await this.collection.aggregate(pipeline).toArray();
    return results.length > 0 ? results[0] : null;
  }
}

module.exports = PlaceModel;