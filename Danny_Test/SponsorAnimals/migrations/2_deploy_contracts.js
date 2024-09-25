var Claims = artifacts.require("./ClaimProcessing.sol");
var Users = artifacts.require("./UserAuth.sol");
var PaymentModule = artifacts.require("./PaymentModule.sol");
var AdminInsurancePolicy = artifacts.require("./AdminInsurancePolicy.sol");

module.exports = async function (deployer) {
  // Deploy UserAuth first
  await deployer.deploy(Users);
  const userAuthInstance = await Users.deployed();

  // Deploy other contracts
  await deployer.deploy(Claims);
  await deployer.deploy(PaymentModule);
  
  // Now deploy AdminInsurancePolicy, passing the address of UserAuth
  await deployer.deploy(AdminInsurancePolicy, userAuthInstance.address);
};
