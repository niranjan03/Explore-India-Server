require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DB_NAME = 'explore_india';

// Complete dataset for 28 States & 8 Union Territories
const all36RegionsData = [
  // ==================== 28 STATES ====================
  {
    name: "Andhra Pradesh",
    stateCode: "AP",
    type: "State",
    color: "#ccffcc",
    path: "M 235 390 L 265 380 L 285 435 L 235 470 Z",
    stateImage: "https://images.unsplash.com/photo-1621831985871-74d005129626",
    stateDescription: "Known for its rich heritage, long coastline, sacred pilgrimage centers, and royal forts[cite: 190]."
  },
  {
    name: "Arunachal Pradesh",
    stateCode: "AR",
    type: "State",
    color: "#ffcccc",
    path: "M 460 150 L 485 145 L 470 185 L 445 180 Z",
    stateImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
    stateDescription: "Land of the dawn-lit mountains featuring serene monasteries and pristine valleys[cite: 190]."
  },
  {
    name: "Assam",
    stateCode: "AS",
    type: "State",
    color: "#ccffff",
    path: "M 415 175 L 445 170 L 435 200 L 405 195 Z",
    stateImage: "https://images.unsplash.com/photo-1605649487212-47bdab064df7",
    stateDescription: "Famous for its lush tea gardens, silk heritage, and one-horned rhinoceros reserves[cite: 190]."
  },
  {
    name: "Bihar",
    stateCode: "BR",
    type: "State",
    color: "#ffccff",
    path: "M 325 190 L 360 200 L 355 235 L 320 230 Z",
    stateImage: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5",
    stateDescription: "A cradle of ancient history, Buddhism, and spiritual enlightenment[cite: 190]."
  },
  {
    name: "Chhattisgarh",
    stateCode: "CT",
    type: "State",
    color: "#ffffcc",
    path: "M 275 285 L 305 295 L 295 335 L 265 320 Z",
    stateImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23",
    stateDescription: "Home to dense forests, roaring waterfalls, and rich tribal heritage[cite: 190]."
  },
  {
    name: "Goa",
    stateCode: "GA",
    type: "State",
    color: "#e6ccb3",
    path: "M 150 390 L 165 390 L 165 405 L 150 405 Z",
    stateImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2",
    stateDescription: "Renowned for golden palm-fringed beaches, vibrant nightlife, and Portuguese architecture[cite: 190]."
  },
  {
    name: "Gujarat",
    stateCode: "GJ",
    type: "State",
    color: "#e6ccb3",
    path: "M 70 240 L 120 230 L 135 285 L 85 300 Z",
    stateImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3",
    stateDescription: "Land of the White Desert, royal palaces, Asiatic lions, and rich handicrafts[cite: 190]."
  },
  {
    name: "Haryana",
    stateCode: "HR",
    type: "State",
    color: "#ffe6cc",
    path: "M 170 155 L 190 150 L 185 170 L 165 165 Z",
    stateImage: "https://images.unsplash.com/photo-1609137144813-7d9921338f24",
    stateDescription: "Blending historic Vedic landmarks with thriving modern infrastructure[cite: 190]."
  },
  {
    name: "Himachal Pradesh",
    stateCode: "HP",
    type: "State",
    color: "#d9f2d9",
    path: "M 175 115 L 195 120 L 185 145 L 165 135 Z",
    stateImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23",
    stateDescription: "Majestic Himalayan mountain landscapes, hill stations, and adventure valleys[cite: 190]."
  },
  {
    name: "Jharkhand",
    stateCode: "JH",
    type: "State",
    color: "#ffe6f2",
    path: "M 320 240 L 360 240 L 350 275 L 315 265 Z",
    stateImage: "https://images.unsplash.com/photo-1621831985871-74d005129626",
    stateDescription: "Land of pristine forests, sacred hills, and cascading waterfalls[cite: 190]."
  },
  {
    name: "Karnataka",
    stateCode: "KA",
    type: "State",
    color: "#99ccff",
    path: "M 200 390 L 240 380 L 260 445 L 205 470 Z",
    stateImage: "https://images.unsplash.com/photo-1600100397608-f010e423b971",
    stateDescription: "Grand Indo-Saracenic royal palaces, ancient ruins of Hampi, and lush coffee estates[cite: 190]."
  },
  {
    name: "Kerala",
    stateCode: "KL",
    type: "State",
    color: "#ffe6b3",
    path: "M 195 495 L 215 485 L 225 520 L 205 520 Z",
    stateImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944",
    stateDescription: "God's Own Country, celebrated for serene backwaters, tea hills, and Ayurvedic wellness[cite: 190]."
  },
  {
    name: "Madhya Pradesh",
    stateCode: "MP",
    type: "State",
    color: "#e6ecb3",
    path: "M 220 225 L 290 225 L 295 285 L 225 285 Z",
    stateImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220",
    stateDescription: "The Heart of India, brimming with royal forts, ancient temples, and tiger reserves[cite: 190]."
  },
  {
    name: "Maharashtra",
    stateCode: "MH",
    type: "State",
    color: "#fff0b3",
    path: "M 150 305 L 215 295 L 235 355 L 175 380 Z",
    stateImage: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66",
    stateDescription: "A dynamic hub of Maratha hill forts, cave temples, coastal beaches, and modern trade[cite: 190]."
  },
  {
    name: "Manipur",
    stateCode: "MN",
    type: "State",
    color: "#e6ffcc",
    path: "M 430 205 L 455 205 L 445 230 L 425 230 Z",
    stateImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
    stateDescription: "Jewel of India featuring floating lake islands, ancient forts, and rich culture[cite: 190]."
  },
  {
    name: "Meghalaya",
    stateCode: "ML",
    type: "State",
    color: "#ffe6cc",
    path: "M 390 200 L 420 200 L 410 220 L 380 210 Z",
    stateImage: "https://images.unsplash.com/photo-1605649487212-47bdab064df7",
    stateDescription: "Abode of clouds boasting living root bridges, misty canyons, and clear rivers[cite: 190]."
  },
  {
    name: "Mizoram",
    stateCode: "MZ",
    type: "State",
    color: "#ffccff",
    path: "M 420 230 L 440 230 L 430 260 L 410 250 Z",
    stateImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
    stateDescription: "Rolling green hills, pleasant climate, and vibrant tribal customs[cite: 190]."
  },
  {
    name: "Nagaland",
    stateCode: "NL",
    type: "State",
    color: "#ccffff",
    path: "M 440 190 L 460 180 L 450 210 L 430 210 Z",
    stateImage: "https://images.unsplash.com/photo-1605649487212-47bdab064df7",
    stateDescription: "Land of festivals, majestic hill ranges, and ancestral warrior heritage[cite: 190]."
  },
  {
    name: "Odisha",
    stateCode: "OD",
    type: "State",
    color: "#d9f2e6",
    path: "M 305 285 L 345 280 L 330 320 L 295 310 Z",
    stateImage: "https://images.unsplash.com/photo-1609137144813-7d9921338f24",
    stateDescription: "Famous for classic Kalinga temple architecture, sacred coastlines, and wildlife lakes[cite: 190]."
  },
  {
    name: "Punjab",
    stateCode: "PB",
    type: "State",
    color: "#ffcccc",
    path: "M 150 125 L 175 130 L 170 150 L 148 145 Z",
    stateImage: "https://images.unsplash.com/photo-1609137144813-7d9921338f24",
    stateDescription: "Land of five rivers, sacred golden temples, vibrant folklore, and warm hospitality[cite: 190]."
  },
  {
    name: "Rajasthan",
    stateCode: "RJ",
    type: "State",
    color: "#ffb366",
    path: "M 95 160 L 170 145 L 195 215 L 120 260 Z",
    stateImage: "https://images.unsplash.com/photo-1599661046289-e31897846e41",
    stateDescription: "The Land of Kings, filled with golden desert dunes, majestic hill forts, and opulent palaces[cite: 190]."
  },
  {
    name: "Sikkim",
    stateCode: "SK",
    type: "State",
    color: "#ffffcc",
    path: "M 350 175 L 365 175 L 360 195 L 345 195 Z",
    stateImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
    stateDescription: "Nestled under Kanchenjunga, known for glacier lakes, monasteries, and organic valleys[cite: 190]."
  },
  {
    name: "Tamil Nadu",
    stateCode: "TN",
    type: "State",
    color: "#ffccff",
    path: "M 240 475 L 265 455 L 285 510 L 245 520 Z",
    stateImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220",
    stateDescription: "Dravidian architectural masterpieces, soaring temple gopurams, and coastal beauty[cite: 190]."
  },
  {
    name: "Telangana",
    stateCode: "TG",
    type: "State",
    color: "#ffe6cc",
    path: "M 215 350 L 255 340 L 265 385 L 225 395 Z",
    stateImage: "https://images.unsplash.com/photo-1600100397608-f010e423b971",
    stateDescription: "Rich Nizam heritage, historic monuments, and booming modern innovation[cite: 190]."
  },
  {
    name: "Tripura",
    stateCode: "TR",
    type: "State",
    color: "#ccffff",
    path: "M 400 230 L 415 230 L 405 250 L 392 245 Z",
    stateImage: "https://images.unsplash.com/photo-1605649487212-47bdab064df7",
    stateDescription: "White marble royal palaces, stone-carved hills, and peaceful hill greenery[cite: 190]."
  },
  {
    name: "Uttar Pradesh",
    stateCode: "UP",
    type: "State",
    color: "#cc99cc",
    path: "M 235 170 L 300 185 L 285 240 L 225 215 Z",
    stateImage: "https://images.unsplash.com/photo-1564507592333-c60657eea523",
    stateDescription: "Home to the Taj Mahal, holy river ghats of Varanasi, and imperial heritage[cite: 190]."
  },
  {
    name: "Uttarakhand",
    stateCode: "UK",
    type: "State",
    color: "#d9f2d9",
    path: "M 200 145 L 220 150 L 210 170 L 190 160 Z",
    stateImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23",
    stateDescription: "Land of Gods featuring sacred river sources, hill stations, and yoga capitals[cite: 190]."
  },
  {
    name: "West Bengal",
    stateCode: "WB",
    type: "State",
    color: "#ffeb99",
    path: "M 360 255 L 395 255 L 385 310 L 350 280 Z",
    stateImage: "https://images.unsplash.com/photo-1558431382-27e303142255",
    stateDescription: "Cultural heartland known for colonial architecture, tea gardens, and the Royal Bengal Tiger[cite: 190]."
  },

  // ==================== 8 UNION TERRITORIES ====================
  {
    name: "Andaman & Nicobar Islands",
    stateCode: "AN",
    type: "Union Territory",
    color: "#b3f0ff",
    path: "M 480 450 L 485 450 L 485 510 L 480 510 Z",
    stateImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    stateDescription: "Exotic tropical archipelago with turquoise waters, coral reefs, and colonial penal heritage."
  },
  {
    name: "Chandigarh",
    stateCode: "CH",
    type: "Union Territory",
    color: "#ffd9b3",
    path: "M 162 138 L 165 138 L 165 141 L 162 141 Z",
    stateImage: "https://images.unsplash.com/photo-1609137144813-7d9921338f24",
    stateDescription: "India's premier planned city designed by Le Corbusier, famous for its Rock Garden."
  },
  {
    name: "Dadra & Nagar Haveli and Daman & Diu",
    stateCode: "DH",
    type: "Union Territory",
    color: "#ffe0b2",
    path: "M 110 280 L 115 280 L 115 285 L 110 285 Z",
    stateImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2",
    stateDescription: "Charming Portuguese coastal forts, quiet beaches, and historical seafront battlements."
  },
  {
    name: "Delhi",
    stateCode: "DL",
    type: "Union Territory",
    color: "#ffcccc",
    path: "M 180 170 L 185 170 L 185 175 L 180 175 Z",
    stateImage: "https://images.unsplash.com/photo-1587474260584-136574528ed5",
    stateDescription: "The capital territory showcasing centuries of imperial Mughal and modern history[cite: 190]."
  },
  {
    name: "Jammu & Kashmir",
    stateCode: "JK",
    type: "Union Territory",
    color: "#e6ffcc",
    path: "M 135 75 L 165 85 L 155 120 L 130 110 Z",
    stateImage: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d",
    stateDescription: "Paradise on Earth, celebrated for snow peaks, alpine lakes, and shikara rides[cite: 190]."
  },
  {
    name: "Ladakh",
    stateCode: "LA",
    type: "Union Territory",
    color: "#e6f2ff",
    path: "M 145 80 L 190 85 L 180 115 L 150 105 Z",
    stateImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2",
    stateDescription: "High-altitude cold mountain desert, Buddhist monasteries, and crystal blue lakes[cite: 190]."
  },
  {
    name: "Lakshadweep",
    stateCode: "LD",
    type: "Union Territory",
    color: "#b3ffff",
    path: "M 120 490 L 125 490 L 125 510 L 120 510 Z",
    stateImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
    stateDescription: "Pristine coral atolls, secluded coconut groves, and vibrant marine life lagunas."
  },
  {
    name: "Puducherry",
    stateCode: "PY",
    type: "Union Territory",
    color: "#f0b3ff",
    path: "M 268 470 L 272 470 L 272 474 L 268 474 Z",
    stateImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220",
    stateDescription: "French colonial quarters, mustard-yellow villas, spiritual ashrams, and quiet beaches."
  }
];

async function seedAll36Regions() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🍃 Connected to MongoDB instance...');
    const db = client.db(DB_NAME);
    const statesCollection = db.collection('states');

    // Reset existing states collection to prevent duplicate entries
    await statesCollection.deleteMany({});
    console.log('🧹 Purged existing administrative region documents.');

    const formattedData = all36RegionsData.map(region => ({
      ...region,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await statesCollection.insertMany(formattedData);
    console.log(`✅ Successfully seeded ALL ${result.insertedCount} Indian States & Union Territories into MongoDB!`);

  } catch (error) {
    console.error('❌ Error executing database seeding script:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedAll36Regions();