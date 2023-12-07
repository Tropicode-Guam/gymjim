const bcrypt = require('bcrypt');

const saltRounds = 10; // The cost factor for hashing
const myPlaintextPassword = 'paris'; // The password you want to hash

bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Hashed Password:', hash);

  // Store this hash in the database
});
