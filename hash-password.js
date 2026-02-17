const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'd49N6!sT9gexk81Sn9GYvbH$';
  const hash = await bcrypt.hash(password, 10);
  console.log('Neuer Hash:');
  console.log(hash);
}

hashPassword();