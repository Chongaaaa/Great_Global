var Claims = artifacts.require("./ClaimProcessing.sol");
var Users = artifacts.require("./UserAuth.sol");
var PaymentModule = artifacts.require("./PaymentModule.sol");
var AdminInsurancePolicy = artifacts.require("./AdminInsurancePolicy.sol");
var PurchasePackage = artifacts.require("./PurchasePackage.sol");

module.exports = async function (deployer) {
  console.log("Deploying UserAuth...");
  await deployer.deploy(Users);
  const userAuthInstance = await Users.deployed();
  console.log("UserAuth deployed at:", userAuthInstance.address);

  console.log("Deploying AdminInsurancePolicy...");
  await deployer.deploy(AdminInsurancePolicy, userAuthInstance.address);
  const adminInsuranceInstance = await AdminInsurancePolicy.deployed();
  console.log("AdminInsurancePolicy deployed at:", adminInsuranceInstance.address);

  console.log("Deploying PurchasePackage...");
  await deployer.deploy(PurchasePackage, adminInsuranceInstance.address, userAuthInstance.address);
  console.log("PurchasePackage deployed.");

  // Deploy other contracts
  console.log("Deploying Claims...");
  await deployer.deploy(Claims, adminInsuranceInstance.address, userAuthInstance.address);
  console.log("Claims deployed.");

  console.log("Deploying PaymentModule...");
  await deployer.deploy(PaymentModule);
  console.log("PaymentModule deployed.");

};
