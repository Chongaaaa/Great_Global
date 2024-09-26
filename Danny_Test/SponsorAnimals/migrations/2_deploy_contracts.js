var Claims = artifacts.require("./ClaimProcessing.sol");
var Users = artifacts.require("./UserAuth.sol");
var PaymentModule = artifacts.require("./PaymentModule.sol");
var AdminInsurancePolicy = artifacts.require("./AdminInsurancePolicy.sol");
var PurchasePackage = artifacts.require("./PurchasePackage.sol");

module.exports = async function (deployer) {
  // Deploy UserAuth first
  await deployer.deploy(Users);
  const userAuthInstance = await Users.deployed();

  // Now deploy AdminInsurancePolicy, passing the address of UserAuth
  await deployer.deploy(AdminInsurancePolicy, userAuthInstance.address);
  const adminInsuraceInstance = await AdminInsurancePolicy.deployed();

  await deployer.deploy(PurchasePackage, userAuthInstance.address, adminInsuraceInstance.address);

  // Deploy other contracts
  await deployer.deploy(Claims);
  await deployer.deploy(PaymentModule);


};
