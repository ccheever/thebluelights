module.exports = () => {
  require('.')().allLights(true);
};

if (require.main === module) {
  module.exports();
}
