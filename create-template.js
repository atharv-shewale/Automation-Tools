const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a sample certificate template
const width = 2480;
const height = 3508;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background - cream color
ctx.fillStyle = '#f5f5dc';
ctx.fillRect(0, 0, width, height);

// Border - dark blue
ctx.strokeStyle = '#1e3a8a';
ctx.lineWidth = 40;
ctx.strokeRect(100, 100, width - 200, height - 200);

// Inner border - gold
ctx.strokeStyle = '#d4af37';
ctx.lineWidth = 10;
ctx.strokeRect(150, 150, width - 300, height - 300);

// Decorative corners
const cornerSize = 200;
ctx.strokeStyle = '#d4af37';
ctx.lineWidth = 5;

// Top left corner
ctx.beginPath();
ctx.moveTo(200, 300);
ctx.lineTo(200, 200);
ctx.lineTo(300, 200);
ctx.stroke();

// Top right corner
ctx.beginPath();
ctx.moveTo(width - 300, 200);
ctx.lineTo(width - 200, 200);
ctx.lineTo(width - 200, 300);
ctx.stroke();

// Bottom left corner
ctx.beginPath();
ctx.moveTo(200, height - 300);
ctx.lineTo(200, height - 200);
ctx.lineTo(300, height - 200);
ctx.stroke();

// Bottom right corner
ctx.beginPath();
ctx.moveTo(width - 300, height - 200);
ctx.lineTo(width - 200, height - 200);
ctx.lineTo(width - 200, height - 300);
ctx.stroke();

// Title
ctx.fillStyle = '#1e3a8a';
ctx.font = 'bold 120px Arial';
ctx.textAlign = 'center';
ctx.fillText('CERTIFICATE', width / 2, 600);

ctx.font = 'bold 80px Arial';
ctx.fillText('OF PARTICIPATION', width / 2, 720);

// Subtitle
ctx.font = '40px Arial';
ctx.fillStyle = '#4a4a4a';
ctx.fillText('This is to certify that', width / 2, 1100);

// Placeholder for name (will be filled dynamically)
ctx.font = 'italic 50px Arial';
ctx.fillStyle = '#888888';
ctx.fillText('[Participant Name]', width / 2, 1400);

// Event description
ctx.font = '40px Arial';
ctx.fillStyle = '#4a4a4a';
ctx.fillText('has successfully participated in', width / 2, 1750);

// Placeholder for event (will be filled dynamically)
ctx.font = 'italic 50px Arial';
ctx.fillStyle = '#888888';
ctx.fillText('[Event Name]', width / 2, 1900);

// Date
ctx.font = '35px Arial';
ctx.fillStyle = '#4a4a4a';
ctx.fillText('February 2026', width / 2, 2400);

// Signature line
ctx.strokeStyle = '#1e3a8a';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(width / 2 - 300, 2800);
ctx.lineTo(width / 2 + 300, 2800);
ctx.stroke();

ctx.font = '30px Arial';
ctx.fillStyle = '#4a4a4a';
ctx.fillText('Authorized Signature', width / 2, 2850);

// Certificate ID placeholder (bottom left)
ctx.font = '25px Arial';
ctx.textAlign = 'left';
ctx.fillStyle = '#888888';
ctx.fillText('Certificate ID: [ID]', 200, 3200);

// QR Code placeholder (bottom right)
ctx.fillStyle = '#e0e0e0';
ctx.fillRect(2100, 3000, 200, 200);
ctx.fillStyle = '#888888';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('QR', 2200, 3100);
ctx.fillText('CODE', 2200, 3130);

// Save the image
const outputPath = path.join(__dirname, 'templates', 'certificate.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log('Certificate template created successfully at:', outputPath);
