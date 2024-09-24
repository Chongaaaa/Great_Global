var Animals = artifacts.require("./SponsorAnimals.sol");
var Claims = artifacts.require("./ClaimProcessing.sol");

module.exports = function (deployer) {
  deployer.deploy(Animals);
  deployer.deploy(Claims);
};
