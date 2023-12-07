const bcrypt = require("bcrypt")

const connection_hashes = {}

function expired(hash) {
    if (connection_hashes[hash]) {
        return connection_hashes[hash] - (new Date()) <= 0
    }
    return true
}

function expire_key(hash) {
    delete connection_hashes[hash]
}

function expire_hashes() {
    for (let hash of Object.keys(connection_hashes)) {
        if (expired(hash)) {
            expire_key(hash)
        }
    }
}

async function hash(username, password, expires_in_days) {
    expire_hashes()
    const ms = expires_in_days*24*60*60*1000
    const expiry = new Date(new Date().getTime() + ms)
    const hash = await bcrypt.hash(username + '|' + password, 10)
    connection_hashes[hash] = expiry
    return hash
}

function authenticate(key) {
    console.log(`Authenticating key: ${key}`);
    if (connection_hashes[key]) {
        if (expired(key)) {
            console.log(`Key expired: ${key}`);
            expire_key(key);
            return false;
        }
        console.log(`Key authenticated: ${key}`);
        return true;
    }
    console.log(`Key not found: ${key}`);
    return false;
}


function comparePassword(password, hash) {
    console.log(password, hash)
    return bcrypt.compare(password, hash)
}

module.exports = {
    hash,
    authenticate,
    comparePassword
}