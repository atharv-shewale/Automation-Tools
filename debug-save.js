const fs = require('fs');

function updateEnvVar(content, key, value) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
        console.log(`Found ${key}, updating to ${value}`);
        return content.replace(regex, `${key}=${value}`);
    } else {
        console.log(`Key ${key} not found, appending ${value}`);
        return content + `\n${key}=${value}`;
    }
}

try {
    let envContent = fs.readFileSync('.env', 'utf-8');
    console.log('Original NAME_ENABLED:', envContent.match(/^NAME_ENABLED=.*$/m)?.[0]);

    // Simulate setting to false
    envContent = updateEnvVar(envContent, 'NAME_ENABLED', false);

    console.log('Updated NAME_ENABLED:', envContent.match(/^NAME_ENABLED=.*$/m)?.[0]);

    // Don't write back, just check memory
} catch (error) {
    console.error('Error:', error);
}
