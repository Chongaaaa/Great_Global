var Claims = artifacts.require("./ClaimProcessing.sol");
var Users = artifacts.require("./UserAuth.sol");
var payment = artifacts.require("./PaymentModule.sol");

module.exports = function (deployer) {
  deployer.deploy(Claims);
  deployer.deploy(Users);
  deployer.deploy(payment);
};
