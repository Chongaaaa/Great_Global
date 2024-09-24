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
    $.getJSON("UserAuth.json", function (data) {
      var UserAuthArtifact = data;
      App.contracts.UserAuth = TruffleContract(UserAuthArtifact);
      App.contracts.UserAuth.setProvider(App.web3Provider);
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", "#registerBtn", App.handleRegister);
    $(document).on("click", "#signinBtn", App.handleSignin);
    $(document).on("click", "#resetpwBtn", App.handleReset);
  },

  handleRegister: async function (event) {
    event.preventDefault();

      const name = $("#signupName").val();
      const email = $("#signupEmail").val();
      const age = $("#signupAge").val();
      const password = $("#signupPassword").val();
      const instance = await App.contracts.UserAuth.deployed();

      web3.eth.getAccounts(async function (error, accounts) {
        if (error) console.log(error);
        const account = accounts[0];
  
        try {
          await instance.addUser(name,email,age,password, { from: account });
          alert("User added successfully.");
        } catch (err) {
          console.error(err.message);
        }
      });
  },

  handleSignin: async function (event) {
    event.preventDefault();

    try {
      console.log(Web3.version);
      const identifier = document.getElementById("signinIdentifier").value; // Can be email or name
      const password = document.getElementById("signinPassword").value;

      if (!identifier || !password) {
        alert("Please enter all required fields.");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      await contract.methods
        .signIn(identifier, password)
        .call({ from: accounts[0] });

      alert("Sign in successful!");
    } catch (error) {
      alert("Invalid Name or Password.");
    }
  },

  handleReset: async function (event) {
    event.preventDefault();

    try {
      const identifier = document.getElementById("resetIdentifier").value; // Can be email or address
      const newPassword = document.getElementById("newPassword").value;

      if (!identifier || !newPassword) {
        alert("Please enter all required fields.");
        return;
      }

      // Fetch accounts only if not already connected
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Send the transaction once, check for connected account and address match
      await contract.methods
        .resetPassword(identifier, newPassword)
        .send({ from: accounts[0] });

      alert("Password reset successfully!");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password.");
    }
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
