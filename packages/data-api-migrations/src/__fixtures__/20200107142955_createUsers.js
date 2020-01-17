module.exports.up = async (dataAPI) => {
  await dataAPI.query('CREATE TABLE users (id int, email varchar)')
}

module.exports.down = async (dataAPI) => {
  await dataAPI.query('DROP TABLE users')
}