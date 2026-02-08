const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for different file types
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = '';

        if (file.fieldname === 'csvFile') {
            uploadPath = './data';
        } else if (file.fieldname === 'templateImage') {
            uploadPath = './templates';
        }

        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        if (file.fieldname === 'csvFile') {
            // Always save as participants.xlsx or participants.csv
            const ext = path.extname(file.originalname);
            cb(null, 'participants' + ext);
        } else if (file.fieldname === 'templateImage') {
            // Save as certificate.png
            cb(null, 'certificate.png');
        } else {
            cb(null, file.originalname);
        }
    }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'csvFile') {
        // Accept CSV and Excel files
        const allowedMimes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedMimes.includes(file.mimetype) ||
            file.originalname.match(/\.(csv|xlsx|xls)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'), false);
        }
    } else if (file.fieldname === 'templateImage') {
        // Accept PNG images only
        if (file.mimetype === 'image/png' || file.originalname.match(/\.png$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only PNG images are allowed'), false);
        }
    } else {
        cb(null, true);
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = upload;
