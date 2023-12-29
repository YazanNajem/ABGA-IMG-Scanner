const express = require('express'); 
const cors = require('cors');
const fileup = require('express-fileupload');  // Middleware for handling file uploads
const fs = require('fs');  // File system module for interacting with the file system
const Tesseract = require('tesseract.js');  // OCR (Optical Character Recognition) library

const app = express();
const PORT = 5000;
// const sharp = require('sharp');

// Middleware setup
app.use(cors());
app.use(fileup()); // Enable file upload handling
app.use(express.json());
app.use(express.urlencoded({ extended: false }));  // Enable parsing of URL-encoded data in request bodies
app.use('/img', express.static('storage'));

// Define a route to handle root requests (GET request)
app.get('/', (req, res) => {
    res.send('<h1>Scanner (Server-side)</h1>');
});

// Configure CORS options for a specific route
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,  // Include credentials in CORS requests
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Define a function to handle image capture and OCR processing
const imgScreenShot = async (req, res, next) => {
    try {
        const path = './storage/scan_img.jpeg';

        // Check if the request contains a file named 'img'
        if (req.files && req.files.img) {
            const imgdata = req.files.img;  // Get the image data from the request
            const base64Data = imgdata.data.toString('base64');  // Convert image data to base64 format
            console.log('Received base64 data length:', base64Data.length);

            // Write the base64 data to a file
            fs.writeFileSync(path, base64Data, { encoding: 'base64' });

            // await sharp(path)
            //     .resize(300) // Resize the image
            //     .threshold(150) // Apply thresholding
            //     .toFile(path);

            console.log('Image saved successfully:', path);

            // OCR processing using Tesseract.js
            await Tesseract.recognize(
                `http://localhost:${PORT}/img/scan_img.jpeg`,
                'eng',
                {
                    logger: (message) => console.log(message),
                    charBlacklist: '*/!@#$%^&*()_+}={||:"<>?-=[];\'\\,./§~/\/',
                    preprocess: 'blur',
                }
            ).then(({ data: { text } }) => {
                console.log('Scan Text:', text);
                return res.send({
                    image: `data:image/jpeg;base64,${base64Data}`,
                    path: path,
                    text: text,
                });
            });
        } else {
            // If no image is provided in the request, send an error response
            console.error('No image provided in the request');
            return res.status(400).send('No image provided');
        }
    } catch (err) {
        console.error('Error in imgScreenShot function:', err.message, err.code);
        next(err); // Pass the error to the next middleware in the stack
    }
};

app.post('/shot', imgScreenShot);

app.post('/upload', (req, res) => {
    // Check if the request contains a file named 'file'
    if (req.files && req.files.file) {
        const fileupFile = req.files.file;
        const nameFile = fileupFile.name;

        // Move the uploaded file to the 'storage' directory
        fileupFile.mv(`./storage/${nameFile}`, (err) => {
            if (err) {
                // Handle errors during file upload
                console.log(err);
                return res.status(500).send(err);
            }

            // OCR processing using Tesseract.js on the uploaded file
            Tesseract.recognize(
                `./storage/${nameFile}`,
                'eng',
                {
                    logger: (message) => console.log(message),
                    charBlacklist: '!@#$%^&*()_+{}|:"<>?-=[];\'\\,./§',
                    preprocess: 'blur',
                    engineMode: Tesseract.OEM.LSTM_ONLY,
                }

            )
                .then(({ data: { text } }) => {
                    console.log(text);
                    // Send the response with image URL, file path, and OCR text
                    return res.send({
                        image: `http://localhost:${PORT}/img/${nameFile}`,
                        path: `http://localhost:${PORT}/img/${nameFile}`,
                        text: text,
                    });
                })
                .catch((err) => {
                    // Handle errors during OCR processing
                    console.error('Error:', err.message, err.code);
                    res.status(500).send(err);
                });
        });
    } else {
        // If no file is provided in the request, send an error response
        return res.status(400).send('No file provided');
    }
});

// Error handling middleware for the entire application
app.use((err, req, res, next) => {
    console.error('Error:', err.message, err.code);
    res.status(500).send(err.message);
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is active @port ${PORT}!`);
});
