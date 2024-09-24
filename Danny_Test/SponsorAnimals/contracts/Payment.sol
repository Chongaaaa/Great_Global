// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PayModule {
    struct Insurance {
        uint256 insurancePurchaseID;
        uint256 customerID;
        uint256 insuranceID;
        uint256 payAmount;
        uint256 payDate;
        uint256 expiryDate;
        bool autoPay;
        bool isActive;
    }

    struct Customer {
        uint256 customerID;
        address customerAddress;
    }

    mapping(uint256 => Insurance) public insurances;
    mapping(address => bool) public admins;
    mapping(uint256 => Customer) public customers;
    mapping(address => uint256) public customerBalances;

    address public manager;

    uint256 public constant latePaymentLimit = 10 days;

    event InsuranceApproved(
        uint256 insurancePurchaseID,
        address indexed customer,
        uint256 insuranceID
    );
    event PaymentProcessed(
        uint256 insurancePurchaseID,
        address indexed customer,
        uint256 amount
    );
    event InsuranceInactive(
        uint256 insurancePurchaseID,
        address indexed customer
    );
    event ReminderSent(address indexed customer, string message);
    event PayDateUpdated(
        uint256 insurancePurchaseID,
        address indexed customer,
        uint256 newPayDate
    );
    event BalanceAdded(address indexed customer, uint256 amount);
    event AdminUpdated(address indexed admin, bool status);
    event CustomerUpdated(
        uint256 customerID,
        address indexed customer,
        uint256 balance
    );
    event AutoPayStatusChanged(
        uint256 insurancePurchaseID,
        address indexed customer,
        bool newStatus
    );
    event StatusMessage(string msg);

    modifier onlyManager() {
        require(msg.sender == manager, "Caller is not the manager");
        _;
    }

    modifier onlyAdminOrManager() {
        require(
            admins[msg.sender] || msg.sender == manager,
            "Caller is not an admin or manager"
        );
        _;
    }

    modifier onlyCustomer(address customer) {
        require(msg.sender == customer, "Caller is not the customer");
        _;
    }

    constructor() {
        manager = msg.sender;
    }

    function addAdmin(address adminAddress) external onlyManager {
        admins[adminAddress] = true;
        emit AdminUpdated(adminAddress, true);
    }

    function addCustomer(
        uint256 customerID,
        address customerAddress
    ) external onlyAdminOrManager {
        customers[customerID] = Customer({
            customerID: customerID,
            customerAddress: customerAddress
        });
        emit CustomerUpdated(customerID, customerAddress, 0);
    }

    function approveInsurance(
        uint256 insurancePurchaseID,
        uint256 customerID,
        uint256 insuranceID,
        uint256 payAmount,
        uint256 payDate,
        uint256 expiryDate
    ) external onlyAdminOrManager {
        require(
            !insurances[insurancePurchaseID].isActive,
            "Insurance already active"
        );

        insurances[insurancePurchaseID] = Insurance({
            insurancePurchaseID: insurancePurchaseID,
            customerID: customerID,
            insuranceID: insuranceID,
            payAmount: payAmount,
            payDate: payDate,
            expiryDate: expiryDate,
            autoPay: true,
            isActive: true
        });

        emit InsuranceApproved(
            insurancePurchaseID,
            customers[customerID].customerAddress,
            insuranceID
        );
    }

    function checkInsuranceStatus(uint256 insurancePurchaseID) external {
        Insurance storage insurance = insurances[insurancePurchaseID];
        require(insurance.isActive, "Insurance is not active.");

        Customer storage customer = customers[insurance.customerID];

        if (block.timestamp >= insurance.expiryDate) {
            insurance.isActive = false;
            emit InsuranceInactive(
                insurancePurchaseID,
                customer.customerAddress
            );
            revert("Insurance has expired.");
        } else {
            if (block.timestamp >= insurance.payDate) {
                uint256 lateDay = (block.timestamp - insurance.payDate) /
                    1 days;

                if (lateDay < latePaymentLimit / 1 days) {
                    if (insurance.autoPay) {
                        if (
                            customerBalances[msg.sender] >= insurance.payAmount
                        ) {
                            makePayment(insurance, insurance.payAmount);
                            emit StatusMessage(
                                "Auto pay process completed successfully!"
                            );
                        } else {
                            emit ReminderSent(
                                customer.customerAddress,
                                "Insufficient balance for auto pay"
                            );
                            emit StatusMessage(
                                "Please add balance to continue the auto-payment process."
                            );
                        }
                    } else {
                        emit ReminderSent(
                            customer.customerAddress,
                            "Customer needs to pay manually within 10 days."
                        );
                        emit StatusMessage(
                            "Please pay your insurance within 10 days."
                        );
                    }
                } else {
                    insurance.isActive = false;
                    emit InsuranceInactive(
                        insurancePurchaseID,
                        customer.customerAddress
                    );
                    emit StatusMessage(
                        "Your insurance is now inactive due to late payment."
                    );
                }
            }
            emit StatusMessage("Your insurance is currently active.");
        }
    }

    function manualPay(uint256 insurancePurchaseID) external payable {
        Insurance storage insurance = insurances[insurancePurchaseID];

        require(insurance.isActive, "Insurance is not active.");
        require(
            customerBalances[msg.sender] >= insurance.payAmount,
            "Insufficient payment."
        );
        makePayment(insurance, insurance.payAmount);
        emit StatusMessage("Auto payment completed successfully!");
    }

    function makePayment(
        Insurance storage insurance,
        uint256 payAmount
    ) internal {
        require(
            customerBalances[msg.sender] >= payAmount,
            "Insufficient balance"
        );
        customerBalances[msg.sender] -= payAmount;
        insurance.payDate += 30 days;
        emit PaymentProcessed(
            insurance.insurancePurchaseID,
            msg.sender,
            payAmount
        );
    }

    function updatePayDate(
        uint256 insurancePurchaseID,
        uint256 newPayDate
    ) external onlyAdminOrManager {
        Insurance storage insurance = insurances[insurancePurchaseID];
        uint lastPayDate = insurance.expiryDate - 30 days;
        require(newPayDate < lastPayDate, "Invalid pay date.");
        insurance.payDate = newPayDate;
        Customer storage customer = customers[insurance.customerID];
        emit PayDateUpdated(
            insurancePurchaseID,
            customer.customerAddress,
            newPayDate
        );
    }

    // Top up
    function addBalance() external payable onlyCustomer(msg.sender) {
        require(msg.value > 0, "Amount must be greater than 0");

        customerBalances[msg.sender] += msg.value;

        emit BalanceAdded(msg.sender, msg.value);
        emit StatusMessage("Amount had been top up successfully");
    }

    function updateAutoPay(
        uint256 insurancePurchaseID
    ) external onlyCustomer(msg.sender) {
        Insurance storage insurance = insurances[insurancePurchaseID];
        insurance.autoPay = !insurance.autoPay;
        emit AutoPayStatusChanged(
            insurancePurchaseID,
            msg.sender,
            insurance.autoPay
        );
    }

    function getCustomerBalance()
        external
        view
        onlyCustomer(msg.sender)
        returns (uint256)
    {
        return customerBalances[msg.sender];
    }
}
