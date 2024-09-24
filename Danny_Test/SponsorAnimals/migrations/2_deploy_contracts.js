var Claims = artifacts.require("./ClaimProcessing.sol");

module.exports = function (deployer) {
  deployer.deploy(Claims);
};
