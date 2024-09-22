// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract payModule {

    struct InsuranceSubscription {
        uint256 insuranceSubscriptionID;
        uint256 insuranceID;
        uint256 payAmount;
        uint256 payDate;
        uint256 expiryDate;
        bool autoPay;
        bool isActive;
    }

    struct Customer {
        uint256[] subscribedPackages;
    }

    address[] private addedCustomer;
    uint256 private custCount = 0;

    uint256 public constant latePaymentLimit = 10 days;

    mapping(address => bool) public admins;
    mapping(address => Customer) private customers;
    mapping(address => mapping(uint256 => InsuranceSubscription)) public insuranceSubscribed;
    mapping(address => uint256) public customerBalances;

    event AdminAdded(address indexed admin, bool status);
    event CustomerAdded(address indexed customer);
    event InsuranceApproved(address indexed customer, uint256 insurancePurchaseID, uint256 insuranceID);
    event InsuranceInactive(address indexed customer, uint256 insurancePurchaseID);
    event ReminderSent(address indexed customer, string message);
    event StatusMessage(string msg);
    event PaymentProcessed(address indexed customer, uint256 insurancePurchaseID, uint256 amount);
    event BalanceAdded(address indexed customer, uint256 amount);
    event AutoPayStatusChanged(address indexed customer, uint256 insurancePurchaseID, bool newStatus);

    // Set the person who deploys as manager
    address public manager;

    constructor() {
        manager = msg.sender;
    }

    // Modifier
    modifier onlyManager() {
        require(msg.sender == manager, "Caller is not the manager");
        _;
    }

    modifier onlyAdminOrManager() {
        require(admins[msg.sender] || msg.sender == manager, "Caller is not an admin or manager");
        _;
    }

    modifier onlyCustomer(address customer) {
        require(msg.sender == customer, "Caller is not the customer");
        _;
    }

    // Add Admin
    function addAdmin(address adminAddress) external onlyManager {
        admins[adminAddress] = true;
        emit AdminAdded(adminAddress, true);
    }

    // Add customer
    function registerCustomer() external {
        addedCustomer.push(msg.sender);
        custCount++;
        emit CustomerAdded(msg.sender);
    }

    // Approve customer's subscription on insurance
    function approveInsurance(
        address customerAddr,
        uint256 _insuranceID,
        uint256 payAmount,
        uint256 payDate,
        uint256 expiryDate
    ) external onlyAdminOrManager {
        // Get current customer
        Customer storage currCustomer = customers[customerAddr];

        // Check if customer has already subscribed to this insurance
        for (uint i = 0; i < currCustomer.subscribedPackages.length; i++) {
            require(insuranceSubscribed[customerAddr][currCustomer.subscribedPackages[i]].insuranceID != _insuranceID, "This insurance has already been bought.");
        }

        // Create a new insurance subscription
        InsuranceSubscription memory newInsuranceSubscription = InsuranceSubscription({
            insuranceSubscriptionID: currCustomer.subscribedPackages.length,
            insuranceID: _insuranceID,
            payAmount: payAmount,
            payDate: payDate,
            expiryDate: expiryDate,
            autoPay: true,
            isActive: true
        });

        // Add new insurance subscription
        insuranceSubscribed[customerAddr][currCustomer.subscribedPackages.length] = newInsuranceSubscription;

        // Push the new package ID inside
        currCustomer.subscribedPackages.push(currCustomer.subscribedPackages.length);

        emit InsuranceApproved(customerAddr, currCustomer.subscribedPackages.length, _insuranceID);
    }

    function dailyInsCheck() external {
        for (uint256 i = 0; i < addedCustomer.length; i++) {
            address currCustomerAddress = addedCustomer[i];
            Customer storage currCustomer = customers[currCustomerAddress];

            for (uint256 j = 0; j < currCustomer.subscribedPackages.length; j++) {

                InsuranceSubscription storage currInsurance = insuranceSubscribed[currCustomerAddress][currCustomer.subscribedPackages[j]];

                if (!currInsurance.isActive) continue;

                // Check if expired
                if (block.timestamp >= currInsurance.expiryDate) {
                    currInsurance.isActive = false;
                    emit InsuranceInactive(currCustomerAddress, currInsurance.insuranceSubscriptionID);
                } 
                else if (block.timestamp >= currInsurance.payDate) {
                    // If payment is due
                    uint256 lateDays = (block.timestamp - currInsurance.payDate) / 1 days;

                    // Check if within late payment limit
                    if (lateDays < latePaymentLimit / 1 days) {
                        // Check if auto pay is enabled
                        if (currInsurance.autoPay) {
                            if (customerBalances[currCustomerAddress] >= currInsurance.payAmount) {
                                makePayment(currCustomerAddress, currInsurance, currInsurance.payAmount);
                                emit StatusMessage("Auto pay process completed successfully!");
                            } else {
                                emit ReminderSent(currCustomerAddress, "Insufficient balance for auto pay");
                            }
                        } else {
                            emit ReminderSent(currCustomerAddress, "Customer needs to pay manually within 10 days.");
                        }
                    } else {
                        currInsurance.isActive = false;
                        emit InsuranceInactive(currCustomerAddress, currInsurance.insuranceSubscriptionID);
                    }
                }
            }
        }
    }

    function manualPay(uint256 _insuranceSubscriptionID) external payable {
        Customer storage currCustomer = customers[msg.sender];
        for(uint256 i = 0; i < currCustomer.subscribedPackages.length; i++){
            require(insuranceSubscribed[msg.sender][currCustomer.subscribedPackages[i]].insuranceSubscriptionID == _insuranceSubscriptionID, "Insurance not exist.");
        }
        InsuranceSubscription storage currInsurance = insuranceSubscribed[msg.sender][_insuranceSubscriptionID];

        require(currInsurance.isActive, "Insurance is not active.");
        require(customerBalances[msg.sender] >= currInsurance.payAmount, "Insufficient payment.");
        makePayment(msg.sender, currInsurance, currInsurance.payAmount);
        emit StatusMessage("Manual payment completed successfully!");
    }

    function makePayment(address custAddress, InsuranceSubscription storage insurance, uint256 payAmount) internal {
        customerBalances[custAddress] -= payAmount;
        insurance.payDate += 30 days;
        emit PaymentProcessed(custAddress, insurance.insuranceSubscriptionID, payAmount);
    }

    function addBalance() external payable onlyCustomer(msg.sender) {
        require(msg.value > 0, "Amount must be greater than 0");

        customerBalances[msg.sender] += msg.value;

        emit BalanceAdded(msg.sender, msg.value);
        emit StatusMessage("Amount had been topped up successfully");
    }
    
    function updateAutoPay(uint256 _insuranceSubscriptionID) external onlyCustomer(msg.sender) {
        Customer storage currCustomer = customers[msg.sender];
        for(uint256 i = 0; i < currCustomer.subscribedPackages.length; i++){
            require(insuranceSubscribed[msg.sender][currCustomer.subscribedPackages[i]].insuranceSubscriptionID == _insuranceSubscriptionID, "Insurance not exist.");
        }
        InsuranceSubscription storage currInsurance = insuranceSubscribed[msg.sender][_insuranceSubscriptionID];
        currInsurance.autoPay = !currInsurance.autoPay;
        emit AutoPayStatusChanged(msg.sender, _insuranceSubscriptionID, currInsurance.autoPay);
    }

    function getCustomerBalance() external view onlyCustomer(msg.sender) returns (uint256) {
        return customerBalances[msg.sender];
    }
}