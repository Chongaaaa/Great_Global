var Claims = artifacts.require("./ClaimProcessing.sol");
var Users = artifacts.require("./UserAuth.sol");
var PaymentModule = artifacts.require("./PaymentModule.sol");
var AdminInsurancePolicy = artifacts.require("./AdminInsurancePolicy.sol");
var PurchasePackage = artifacts.require("./PurchasePackage.sol");

module.exports = async function (deployer) {
  // Deploy UserAuth first
  console.log("Deploying UserAuth...");
  await deployer.deploy(Users);
  const userAuthInstance = await Users.deployed();
  console.log("UserAuth deployed at:", userAuthInstance.address);

  // Now deploy AdminInsurancePolicy, passing the address of UserAuth
  console.log("Deploying AdminInsurancePolicy...");
  await deployer.deploy(AdminInsurancePolicy, userAuthInstance.address);
  const adminInsuranceInstance = await AdminInsurancePolicy.deployed();
  console.log("AdminInsurancePolicy deployed at:", adminInsuranceInstance.address);

  await deployer.deploy(PurchasePackage, userAuthInstance.address, adminInsuraceInstance.address);

  // Deploy other contracts
  console.log("Deploying Claims...");
  await deployer.deploy(Claims, adminInsuranceInstance.address, userAuthInstance.address);
  console.log("Claims deployed.");

  console.log("Deploying PaymentModule...");
  await deployer.deploy(PaymentModule);


};
