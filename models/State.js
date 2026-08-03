const { ObjectId } = require('mongodb');

class StateModel {
  /**
   * @param {import('mongodb').Db} db 
   */
  constructor(db) {
    this.collection = db.collection('states');
  }

  /**
   * Fetch all states sorted alphabetically by name
   */
  async findAll() {
    return await this.collection.find({}).sort({ name: 1 }).toArray();
  }

  // Find a state by its BSON ObjectId or State Code (e.g., 'RJ' or 'KA')
  async getStateByIdOrCode(identifier) {
    if (ObjectId.isValid(identifier)) {
      return await this.collection.findOne({ _id: new ObjectId(identifier) });
    }
    return await this.collection.findOne({ stateCode: identifier.toUpperCase() });
  }


  /**
   * Find a single state by its hex ObjectId
   * @param {string} id 
   */
  async findById(id) {
    if (!ObjectId.isValid(id)) return null;
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Seed or insert a new state entry
   */
  async create(stateData) {
    const document = {
      name: stateData.name,
      stateCode: stateData.stateCode, // e.g., 'RJ', 'KA'
      stateImage: stateData.stateImage,
      stateDescription: stateData.stateDescription,
      path: stateData.path, // Custom SVG map path element
      color: stateData.color || '#ffe6cc',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await this.collection.insertOne(document);
    return { _id: result.insertedId, ...document };
  }
}

module.exports = StateModel;