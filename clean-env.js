const fs = require('fs');

try {
    const envPath = '.env';
    if (!fs.existsSync(envPath)) {
        console.error('.env files does not exist');
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const uniqueKeys = new Map();
    const commentLines = [];

    // Process lines to find keys and keep comments
    // We want to keep the LAST occurrence of a key as the value (standard dotenv behavior)
    // But we might want to preserve the order or structure? 
    // Standard approach: parse everything, then reconstruct.

    // Better approach matching updateEnvVar strategy:
    // Read all keys. If a key appears multiple times, keep the last one.

    // Actually, let's just use dotenv.parse to get the final values, 
    // and then write them back? 
    // But that loses comments and structure.

    // Alternative: iterate lines. If it's a key we've seen before? 
    // No, if it's a key that appears LATER, ignore this one?

    // Let's go with: Keep the FIRST occurrence of a key, but update its value to the LAST occurrence's value.
    // And remove subsequent occurrences.

    const finalValues = {};
    const keyRegex = /^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/;

    // First pass: find final values
    lines.forEach(line => {
        const match = line.match(keyRegex);
        if (match) {
            const key = match[1];
            const value = match[2] || '';
            finalValues[key] = value;
        }
    });

    const keysSeen = new Set();
    const newLines = [];

    lines.forEach(line => {
        const match = line.match(keyRegex);
        if (match) {
            const key = match[1];
            if (!keysSeen.has(key)) {
                // First time checking this key. Use the FINAL value.
                newLines.push(`${key}=${finalValues[key]}`);
                keysSeen.add(key);
            } else {
                // Duplicate key. Remove it (skip adding to newLines).
                console.log(`Removed duplicate key: ${key}`);
            }
        } else {
            // Comment or empty line, keep it
            newLines.push(line);
        }
    });

    const newContent = newLines.join('\n');
    fs.writeFileSync(envPath, newContent);
    console.log('Successfully cleaned .env file');

    // Log crucial values
    console.log('Final Config State:');
    console.log('NAME_ENABLED:', finalValues['NAME_ENABLED']);
    console.log('EVENT_ENABLED:', finalValues['EVENT_ENABLED']);

} catch (error) {
    console.error('Error cleaning .env:', error);
}
