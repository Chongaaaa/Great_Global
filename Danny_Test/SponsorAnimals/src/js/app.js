App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("ClaimProcessing.json", function (data) {
      var ClaimProcessingArtifact = data;
      App.contracts.ClaimProcessing = TruffleContract(ClaimProcessingArtifact);
      App.contracts.ClaimProcessing.setProvider(App.web3Provider);
    });

    $.getJSON("UserAuth.json", function (data) {
      var UserAuthArtifact = data;
      App.contracts.UserAuth = TruffleContract(UserAuthArtifact);
      App.contracts.UserAuth.setProvider(App.web3Provider);
    });

    $.getJSON("PaymentModule.json", function (data) {
      var PaymentModuleArtifact = data;
      App.contracts.PaymentModule = TruffleContract(PaymentModuleArtifact);
      App.contracts.PaymentModule.setProvider(App.web3Provider);
    });

    $.getJSON("AdminInsurancePolicy.json", function (data) {
      var AdminInsurancePolicyArtifact = data;
      App.contracts.AdminInsurancePolicy = TruffleContract(AdminInsurancePolicyArtifact);
      App.contracts.AdminInsurancePolicy.setProvider(App.web3Provider);
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    // Claims Module
    $(document).on("click", "#addUserBtn", App.handleAddUser);
    $(document).on("click", "#addClaimBtn", App.handleAddClaim);
    $(document).on("click", "#approveClaimBtn", App.handleApproveClaim);
    $(document).on("click", "#rejectClaimBtn", App.handleRejectClaim);
    $(document).on(
      "click",
      "#viewUnprocessedClaimsBtn",
      App.handleViewUnprocessedClaims
    );
    $(document).on(
      "click",
      "#viewAllUnprocessedClaimsBtn",
      App.handleViewAllUnprocessedClaims
    );
    $(document).on("click", "#sendFundsBtn", App.handleSendFunds);

    // User Module
    $(document).on("click", "#registerBtn", App.handleRegister);
    $(document).on("click", "#signinBtn", App.handleSignin);
    $(document).on("click", "#resetpwBtn", App.handleReset);
    $(document).on("click", "#signinAdminBtn", App.handleSignInAdmin);
    $(document).on("click", "#addAdminBtn", App.handleAddAdmin);
    $(document).on("click", "#removeAdminBtn", App.handleRemoveAdmin);
    $(document).on("click", "#logOutBtn", App.handleLogout); // Add logout event binding

    // Payment Module
    $(document).on("click", "#viewTotalMoneyBtn", App.handleViewTotalMoney);
    $(document).on("click", "#withdrawMoneyBtn", App.handleWithdrawMoney);
    $(document).on("click", "#pAddAdminBtn", App.handlePAddAdmin);
    $(document).on("click", "#updatePayDateBtn", App.handleUpdatePayDate);
    $(document).on("click", "#approveInsuranceBtn", App.handlePApproveInsurance);
    $(document).on("click", "#registerCustomerBtn", App.handlePRegisterCustomer);
    $(document).on("click", "#addBalanceBtn", App.handleAddBalance);
    $(document).on("click", "#getCustomerBalanceBtn", App.handleGetCustomerBalance);
    $(document).on("click", "#updateAutoPayBtn", App.handleUpdateAutoPay);
    $(document).on("click", "#cancelInsuranceBtn", App.handleCancelInsurance);
    $(document).on("click", "#manualPayBtn", App.handleManualPayment);

    // Policy
    $(document).on("click", "#CreatePolicyBtn", App.handleCreatePolicy);
    $(document).on("click", "#UpdatePolicyBtn", App.handleUpdatePolicy);
    $(document).on("click", "#ArchievePolicyBtn", App.handleViewArchivedPolicy);
    $(document).on("click", "#ViewPolicyBtn", App.handleViewPolicy);
  },

  // Admin Management
  handleSignInAdmin: async function (event) {
    event.preventDefault();

    const adminAddress = $("#signinAdminAddress").val();

    // Simple Validation Rules
    if (!adminAddress || adminAddress.trim() === "") {
      alert("Please enter your address.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.adminSignIn(adminAddress, { from: account });
        alert("Sign In successfully.");
        // Redirect to AdminHomePage.html after successful sign-in
        window.location.href = "AdminHomePage.html";
      } catch (err) {
        console.error(err.message);
        alert("Invalid Address.");
      }
    });
  },

  handleAddAdmin: async function (event) {
    event.preventDefault();

    const adminAddress = $("#assignAdminAddress").val();

    // Simple Validation Rules
    if (!adminAddress || adminAddress.trim() === "") {
      alert("Please enter your address.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.assignAdmin(adminAddress, { from: account });
        alert("Admin added successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Failed to add admin.");
      }
    });
  },

  handleRemoveAdmin: async function (event) {
    event.preventDefault();

    const adminAddress = $("#removeAdminAddress").val();

    // Simple Validation Rules
    if (!adminAddress || adminAddress.trim() === "") {
      alert("Please enter your address.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.removeAdmin(adminAddress, { from: account });
        alert("Admin removed successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Failed to remove admin.");
      }
    });
  },

  handleAddUser: async function (event) {
    event.preventDefault();

    const userAddress = $("#addUserAddress").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.addUser(userAddress, { from: account });
        alert("User added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleAddClaim: async function (event) {
    event.preventDefault();

    const claimAmount = $("#claimAmount").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.addClaim(claimAmount * 1e18, {
          from: account,
        });
        alert("Claim added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleApproveClaim: async function (event) {
    event.preventDefault();

    const userAddress = $("#approveUserAddress").val();
    const claimId = $("#claimId").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.approveClaim(userAddress, claimId, true, {
          from: account,
        });
        alert("Claim approved.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleRejectClaim: async function (event) {
    event.preventDefault();

    const userAddress = $("#userAddress").val();
    const claimId = $("#claimId").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.approveClaim(userAddress, claimId, false, {
          from: account,
        });
        alert("Claim rejected.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleViewUnprocessedClaims: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.ClaimProcessing.deployed();

    try {
      console.log(Web3.version);
      const userAddress = $("#viewClaimsUserAddress").val();
      const [claimIds, claimAmount] = await instance.getUnprocessedClaims(
        userAddress,
        {
          from: web3.eth.accounts[0],
        }
      );

      // Clear the div before adding new content
      $("#unprocessedClaims").html("");

      if (claimIds.length === 0) {
        $("#unprocessedClaims").append(`<p>No unprocessed claims found.</p>`);
      } else {
        for (let i = 0; i < claimIds.length; i++) {
          $("#unprocessedClaims").append(
            `<p>Claim ID: ${claimIds[i]} - Claim Amount: ${claimAmount[i] / 1e18
            } ETH</p>`
          );
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  },

  handleViewAllUnprocessedClaims: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.ClaimProcessing.deployed();

    try {
      console.log(Web3.version);
      const [userAddresses, claimIds, claimAmount] =
        await instance.getAllUnprocessedClaims({
          from: web3.eth.accounts[0],
        });

      // Clear the div before adding new content
      $("#allUnprocessedClaims").html("");

      if (userAddresses.length === 0) {
        $("#allUnprocessedClaims").append(
          `<p>No unprocessed claims found.</p>`
        );
      } else {
        for (let i = 0; i < userAddresses.length; i++) {
          $("#allUnprocessedClaims").append(
            `<p>User: ${userAddresses[i]} - Claim ID: ${claimIds[i]
            } - Claim Amount: ${claimAmount[i] / 1e18} ETH</p>`
          );
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  },

  handleSendFunds: async function (event) {
    event.preventDefault();

    const fundAmount = $("#fundAmount").val();
    const instance = await App.contracts.ClaimProcessing.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        var amountInWei = fundAmount * 1e18;
        await instance.fund({
          from: account,
          value: amountInWei,
        });
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  // User Module

  handleRegister: async function (event) {
    event.preventDefault();

    const name = $("#signupName").val();
    const email = $("#signupEmail").val();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const age = $("#signupAge").val();
    const password = $("#signupPassword").val();
    const refundAddress = $("#signupRefundAddress").val();

    // Simple Validation Rules
    if (!name || name.trim() === "") {
      alert("Please enter your name.");
      return;
    }

    if (!email || email.trim() === "") {
      alert("Please enter your email.");
      return;
    }

    // Basic email validation pattern
    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address. (e.g., example@domain.com)");
      return;
    }

    // Add validation for Ethereum address
    if (!refundAddress || refundAddress.trim() === "") {
      alert("Please enter a valid Ethereum address.");
      return;
  }

    if (!age || isNaN(age)) {
      alert("Please enter a valid age.");
      return;
    }
    if (age < 18) {
      alert("You must be at least 18 years old to register.");
      return;
    }

    if (!password || password.trim() === "") {
      alert("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.register(name, email, refundAddress, age, password, { from: account });
        alert("User registered successfully!");
        window.location.href = "UserHomePage.html";
      } catch (err) {
        console.error(err.message);
        alert("Failed to Register.");
      }
    });
  },

  handleSignin: async function (event) {
    event.preventDefault();

    const identifier = $("#signinIdentifier").val();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const password = $("#signinPassword").val();

    // Validate the identifier (basic check)
    if (!identifier || identifier.trim() === "") {
      alert("Please enter your email.");
      return;
    }
    // Basic email validation pattern
    if (!emailPattern.test(identifier)) {
      alert("Please enter a valid email address. (e.g., example@domain.com)");
      return;
    }

    if (!password || password.trim() === "") {
      alert("Please enter your password.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.signIn(identifier, password, { from: account });
        alert("Sign In successfully!");
        window.location.href = "UserHomePage.html";
      } catch (err) {
        console.error(err.message);
        alert("Invalid Email or Password.");
      }
    });
  },

  handleReset: async function (event) {
    event.preventDefault();

    const identifier = $("#resetIdentifier").val();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newPassword = $("#newPassword").val();

    // Validate the identifier (basic check)
    if (!identifier || identifier.trim() === "") {
      alert("Please enter your email.");
      return;
    }
    // Basic email validation pattern
    if (!emailPattern.test(identifier)) {
      alert("Please enter a valid email address. (e.g., example@domain.com)");
      return;
    }

    if (!newPassword || newPassword.trim() === "") {
      alert("Please enter your password.");
      return;
    }

    const instance = await App.contracts.UserAuth.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.resetPassword(identifier, newPassword, {
          from: account,
        });
        alert("Password reset successfully!");
      } catch (err) {
        console.error(err.message);
        alert("Failed to reset password.");
      }
    });
  },

   // Logout User or Admin based on their current session
   handleLogout: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.UserAuth.deployed();
    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        const isAdmin = await instance.admins(account); // Check if the account is admin
        if (isAdmin) {
          await instance.logoutAdmin({ from: account });
          alert("Admin logged out successfully!");
        } else {
          await instance.logoutUser({ from: account });
          alert("User logged out successfully!");
        }

        // Redirect to homepage after logging out
        window.location.href = "index.html"; 
      } catch (err) {
        console.error(err.message);
        alert("Failed to log out.");
      }
    });
  },

  // Payment Module
  handleViewTotalMoney: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        const money = await instance.viewTotalMoney({ from: account });
        const displayMoney = money && money.toString() !== "0" ? money.toString() : "0";
        $("#totalMoneyDisplay").text(`Total Ether in contract: ${displayMoney} ETH`);
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleWithdrawMoney: async function (event) {
    event.preventDefault();

    const amount = $("#withdrawAmount").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        const money = await instance.withdrawMoney(amount * 1e18, { from: account });
        alert(`Successfully withdrew ${money} ETH.`);
      } catch (err) {
        console.error(err.message);
        alert("Withdrawal failed.");
      }
    });
  },

  handlePAddAdmin: async function (event) {
    event.preventDefault();

    const adminAddress = $("#pAdminAddress").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.addAdmin(adminAddress, { from: account });
        console.log(account);
        alert("Admin added successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleUpdatePayDate: async function (event) {
    event.preventDefault();

    const customerAddress = $("#payDateCustomerAddress").val();
    const insuranceSubscriptionID = $("#payDateInsuranceID").val();
    const newPayDate = $("#newPayDate").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.updatePayDate(customerAddress, insuranceSubscriptionID, newPayDate, { from: account });
        alert("Pay date updated successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handlePApproveInsurance: async function (event) {
    event.preventDefault();

    const customerAddress = $("#approveInsuranceCustomerAddress").val();
    const insuranceID = $("#pInsuranceID").val();
    const payAmount = Math.max(0, parseInt($("#pPayAmount").val(), 10));
    const payDate = Math.floor(new Date($("#pPayDate").val()).getTime() / 1000); // Convert to seconds
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        // Call with correct arguments
        await instance.approveInsurance(customerAddress, insuranceID, payAmount, payDate, { from: account });
        alert("Insurance approved successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handlePRegisterCustomer: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.registerCustomer({ from: account });
        console.account(address);
        alert("Customer registered successfully.");
      } catch (err) {
        console.error(err.message);
      }
    });
  },

  handleAddBalance: async function (event) {
    event.preventDefault();

    const amount = $("#addBalanceInput").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.addBalance({ from: account, value: amount * 1e18 });
        alert("Balance added successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Failed to add balance");
      }
    });
  },

  handleGetCustomerBalance: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        const balance = await instance.getCustomerBalance({ from: account });
        const displayBalance = balance && balance.toString() !== "0" ? balance.toString() : "0";
        $("#customerBalanceDisplay").text(`Your balance is: ${displayBalance} ETH`);
      } catch (err) {
        console.error(err.message);
        alert("Failed to get customer balance");
      }
    });
  },

  handleUpdateAutoPay: async function (event) {
    event.preventDefault();

    const insuranceSubscriptionID = $("#autoPayInsuranceID").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.updateAutoPay(insuranceSubscriptionID, { from: account });
        alert("AutoPay status updated successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Failed to change auto pay status");
      }
    });
  },

  handleCancelInsurance: async function (event) {
    event.preventDefault();

    const insuranceSubscriptionID = $("#cancelInsuranceID").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.cancelInsurance(insuranceSubscriptionID, { from: account });
        alert("Insurance subscription cancelled successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Failed to cancel insurance");
      }
    });
  },

  handleManualPayment: async function (event) {
    event.preventDefault();

    const insuranceSubscriptionID = $("#manualPayInsuranceID").val();
    const instance = await App.contracts.PaymentModule.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.error(error);
      const account = accounts[0];

      try {
        await instance.manualPay(insuranceSubscriptionID, { from: account, value: $("#payAmountInput").val() * 1e18 });

        // Fetch updated subscription details, particularly payDate
        const insuranceSubscription = await instance.insuranceSubscribed(account, insuranceSubscriptionID);
        const nextPayDateTimestamp = insuranceSubscription.payDate.toString();

        // Convert the Unix timestamp to a readable date
        const nextPayDate = new Date(nextPayDateTimestamp * 1000).toLocaleDateString();
        $("#nextPayDateDisplay").html(`Your next payment is due on: <strong>${nextPayDate}</strong>`);

        alert("Manual payment completed successfully.");
      } catch (err) {
        console.error(err.message);
        alert("Payment failed");
      }
    });
  },
  
  //Policy
  handleCreatePolicy: async function (event) {
    event.preventDefault();

    const policyName = $("#policyName").val();
    const premium = $("#premium").val();
    const amount = $("#coverageAmount").val();
    const agelimit = $("#ageLimit").val();
    const active = $("#isActive").val() === "true";

    // Simple Validation Rules
    if (!policyName || policyName.trim() === "") {
      alert("Please enter the policy name.");
      return;
    }

    if (!premium || premium.trim() === "") {
      alert("Please enter the premium");
      return;
    }

    if (premium < 0 ) {
      alert("Premium must be greater than 0");
      return;
    }

    if (!amount || amount.trim() === "") {
      alert("Please enter the coverage amount.");
      return;
    }

    if (amount < 0) {
      alert("Coverage amount must be greater than 0");
      return;
    }

    if (!agelimit || isNaN(agelimit)) {
      alert("Please enter a valid age limit.");
      return;
    }
    if (agelimit < 0) {
      alert("Age limit must be positive.");
      return;
    }

    const instance = await App.contracts.AdminInsurancePolicy.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.createPolicy(policyName,premium,amount,agelimit,active, { from: account });
        alert("Create policy successfully!");
      } catch (err) {
        console.error(err.message);
        alert("Failed to create policy.");
      }
    });
  },

  handleUpdatePolicy: async function (event) {
    event.preventDefault();
    const policyId = $("#updatePolicyId").val();
    const policyName = $("#updatePolicyName").val();
    const premium = $("#updatePremium").val();
    const amount = $("#updateCoverageAmount").val();
    const agelimit = $("#updateAgeLimit").val();
    const active = $("#updateIsActive").val() === "true";

    // Simple Validation Rules
    if (!policyId || policyId.trim() === "") {
      alert("Please enter your policy id.");
      return;
    }
    if (!policyName || policyName.trim() === "") {
      alert("Please enter the policy name.");
      return;
    }

    if (!premium || premium.trim() === "") {
      alert("Please enter the premium");
      return;
    }

    if (premium < 0 ) {
      alert("Premium must be greater than 0");
      return;
    }

    if (!amount || amount.trim() === "") {
      alert("Please enter the coverage amount.");
      return;
    }

    if (amount < 0) {
      alert("Coverage amount must be greater than 0");
      return;
    }

    if (!agelimit || isNaN(agelimit)) {
      alert("Please enter a valid age limit.");
      return;
    }
    if (agelimit < 0) {
      alert("Age limit must be positive.");
      return;
    }

    const instance = await App.contracts.AdminInsurancePolicy.deployed();

    web3.eth.getAccounts(async function (error, accounts) {
      if (error) console.log(error);
      const account = accounts[0];

      try {
        await instance.updatePolicy(policyId,policyName,premium,amount,agelimit,active, { from: account });
        alert("Update policy successfully!");
      } catch (err) {
        console.error(err.message);
        alert("Failed to update policy.");
      }
    });
  },

  handleViewArchivedPolicy: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.AdminInsurancePolicy.deployed();

    try {
        const archivedPolicyIds = await instance.getAllArchivedPolicies.call();

        const policyDetailsDiv = document.getElementById("policyDetails");
        policyDetailsDiv.innerHTML = ""; // Clear any previous content

        // Loop through the archived policies and display them
        for (let i = 0; i < archivedPolicyIds.length; i++) {
            const policyId = archivedPolicyIds[i].toNumber();

            // Fetch the policy details
            const policy = await instance.getPolicy.call(policyId);
            const policyName = policy[0];
            const premium = policy[1].toString();
            const coverageAmount = policy[2].toString();
            const ageLimit = policy[3].toString();
            const isActive = policy[4];

            // Append the policy details to the UI
            policyDetailsDiv.innerHTML += `
                <div>
                    <h4>Policy ID: ${policyId}</h4>
                    <p><strong>Name:</strong> ${policyName}</p>
                    <p><strong>Premium:</strong> ${premium}</p>
                    <p><strong>Coverage Amount:</strong> ${coverageAmount}</p>
                    <p><strong>Age Limit:</strong> ${ageLimit}</p>
                    <p><strong>Active:</strong> ${isActive ? "Yes" : "No"}</p>
                    <hr>
                </div>`;
        }

        if (archivedPolicyIds.length === 0) {
            policyDetailsDiv.innerHTML = "<p>No archived policies available.</p>";
        }

    } catch (err) {
        console.error(err.message);
        alert("Failed to fetch archived policies.");
    }
},

  handleViewPolicy: async function (event) {
    event.preventDefault();

    const instance = await App.contracts.AdminInsurancePolicy.deployed();

    try {
        const activePolicyIds = await instance.getAllActivePolicies.call();

        const policyDetailsDiv = document.getElementById("policyDetails2");
        policyDetailsDiv.innerHTML = ""; // Clear any previous content

        // Loop through the active policies and display them
        for (let i = 0; i < activePolicyIds.length; i++) {
            const policyId = activePolicyIds[i].toNumber();

            // Fetch the policy details
            const policy = await instance.getPolicy.call(policyId);
            const policyName = policy[0];
            const premium = policy[1].toString();
            const coverageAmount = policy[2].toString();
            const ageLimit = policy[3].toString();
            const isActive = policy[4];

            // Append the policy details to the UI
            policyDetailsDiv.innerHTML += `
                <div>
                    <h4>Policy ID: ${policyId}</h4>
                    <p><strong>Name:</strong> ${policyName}</p>
                    <p><strong>Premium:</strong> ${premium}</p>
                    <p><strong>Coverage Amount:</strong> ${coverageAmount}</p>
                    <p><strong>Age Limit:</strong> ${ageLimit}</p>
                    <p><strong>Active:</strong> ${isActive ? "Yes" : "No"}</p>
                    <hr>
                </div>`;
        }

        if (activePolicyIds.length === 0) {
            policyDetailsDiv.innerHTML = "<p>No active policies available.</p>";
        }

    } catch (err) {
        console.error(err.message);
        alert("Failed to fetch policies.");
    }
},
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
