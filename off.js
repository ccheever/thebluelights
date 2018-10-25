module.exports = () => {
  require('.')().allLights(false);
};

if (require.main === module) {
  module.exports();
}
