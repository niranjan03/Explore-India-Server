const {ObjectId} = require('mongodb');

class NewsletterModel {
    /**
     * @param {import('mongodb').Db} db
     *  
     */
    constructor(db) {
        this.collection = db.collection('newsletter');
    }

    /**
     * Insert a new newsletter subscription entry
     */ 
    async subscribe(email) {
        const existing = await this.collection.findOne({ email });
        if (existing) {
            return { message: 'Email already subscribed.' };
        }
        const document = {
            email,
            subscribedAt: new Date()
        };
        const result = await this.collection.insertOne(document);
        return { _id: result.insertedId, ...document };
    }   

}
module.exports = NewsletterModel;