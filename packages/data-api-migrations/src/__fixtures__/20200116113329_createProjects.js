module.exports.up = async (dataAPI) => {
  await dataAPI.query('CREATE TABLE projects (id int, name)')
}

module.exports.down = async (dataAPI) => {
  await dataAPI.query('DROP TABLE projects')
}