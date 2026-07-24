class AdminModel {
  /**
   * @param {import('mongodb').Db} db 
   */
  constructor(db) {
    this.collection = db.collection('admins');
  }

  /**
   * Find an admin account by email
   * @param {string} email 
   */
  async findByEmail(email) {
    return await this.collection.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Helper function to manually insert or update an admin
   */
  async createAdmin(email, hashedPassword) {
    const document = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await this.collection.insertOne(document);
    return { _id: result.insertedId, ...document };
  }
}

module.exports = AdminModel;