module.exports.up = async (helper) => {
  await helper.executeStatement({ sql: 'CREATE TABLE users (id int, email varchar)' })
}

module.exports.down = async (helper) => {
  await helper.executeStatement({ sql: 'DROP TABLE users' })
}