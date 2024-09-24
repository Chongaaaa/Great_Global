var Claims = artifacts.require("./ClaimProcessing.sol");
var Users = artifacts.require("./UserAuth.sol");

module.exports = function (deployer) {
  deployer.deploy(Claims);
  deployer.deploy(Users);
};
