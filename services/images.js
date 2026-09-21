// Read and Parse JSON File
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('pexels');
const API_PEXELS_KEY = process.env.API_PEXELS_KEY;
const URL = 'https://api.pexels.com/v1/search';

if (!API_PEXELS_KEY) {
    throw new Error('API_PEXELS_KEY is missing from the project .env file.');
}
// const places = fs.readFile('../data/place.json', 'utf8', (err, data) => {
//     if (err) {
//         console.error('Error reading places.json:', err);
//     } else {
//         const places = JSON.parse(data);
//         console.log('Places data:', places);
//     }   
// });

const places = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/place.json'), 'utf8')
);
console.log('Places data:', places);




const  PlaceState =()=> {
    for ( const place of places) {
        const{name, state} = place;
        console.log(`${name}, ${state}`);
    }   
}
// PlaceState();

const client=createClient(API_PEXELS_KEY);  
const searchImages = async (query, perPage = 10) => {
    try {
        const response = await client.photos.search({ query, per_page: perPage });
        const images = response.photos.map(photo => ({
            id: photo.id,
            name: query,
            url: photo.url,
            original: photo.src.original,
            // src: photo.src,
            alt: photo.alt,
        }));
        return images;

    }
    catch (error) {
        console.error('Error searching images:', error);
        throw error;
    }
};

for (const place of places) {
    const { name, state } = place;
    const query = `${name}, ${state}`;
    searchImages(query, 5)
        .then(images => {
            console.log(`Images for ${query}:`, images);
            const imagesFilePath = path.join(__dirname, '../data/images.json');
            let existingImages = [];
            if (fs.existsSync(imagesFilePath)) {
                const existingData = fs.readFileSync(imagesFilePath, 'utf8');
                if (existingData.trim()) {
                    existingImages = JSON.parse(existingData);
                }
            }
            existingImages.push({ query, images });
            fs.writeFileSync(imagesFilePath, JSON.stringify(existingImages, null, 2), 'utf8');


        })
        .catch(error => {
            console.error(`Error fetching images for ${query}:`, error);
        });
    };





