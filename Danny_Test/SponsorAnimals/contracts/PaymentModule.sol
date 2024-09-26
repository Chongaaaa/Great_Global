// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentModule {
    enum InsuranceStatus {
        Pending,
        Approved,
        Cancelled
    }

    struct InsuranceSubscription {
        uint256 insuranceSubscriptionID;
        uint256 insuranceID;
        uint256 payAmount;
        uint256 payDate;
        bool autoPay;
        InsuranceStatus insStatus;
    }

    struct Customer {
        uint256[] subscribedPackages;
    }

    address[] private addedCustomer;
    uint256 private custCount = 0;

    uint256 public constant latePaymentLimit = 10 days;

    mapping(address => bool) public admins;
    mapping(address => Customer) private customers;
    mapping(address => mapping(uint256 => InsuranceSubscription))
        public insuranceSubscribed;
    mapping(address => uint256) public customerBalances;
    mapping(address => bool) private isCustomer;

    event AdminAdded(address indexed admin, bool status);
    event CustomerAdded(address indexed customer);
    event InsuranceApproved(
        address indexed customer,
        uint256 insurancePurchaseID,
        uint256 insuranceID
    );
    event InsuranceInactive(
        address indexed customer,
        uint256 insurancePurchaseID
    );
    event ReminderSent(address indexed customer, string message);
    event StatusMessage(string msg);
    event PaymentProcessed(
        address indexed customer,
        uint256 insurancePurchaseID,
        uint256 amount,
        uint256 customerCurrentBalance
    );
    event BalanceAdded(address indexed customer, uint256 amount);
    event AutoPayStatusChanged(
        address indexed customer,
        uint256 insurancePurchaseID,
        bool newStatus
    );
    event PayDateUpdated(
        address indexed customer,
        uint256 insurancePurchaseID,
        uint256 newPayDate
    );
    event CancelInsurance(
        address indexed customer,
        uint256 insurancePurchaseID,
        InsuranceStatus insStatus
    );

    // Set the person who deploys as manager
    address public manager;

    constructor() {
        manager = msg.sender;
    }

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == manager, "Caller is not the manager.");
        _;
    }

    modifier onlyAdminOrManager() {
        require(
            admins[msg.sender] || msg.sender == manager,
            "Caller is not an admin or manager."
        );
        _;
    }

    modifier onlyCustomer() {
        require(isCustomer[msg.sender], "Caller is not a customer.");
        _;
    }

    // Add Admin
    function addAdmin(address adminAddress) external onlyOwner {
        admins[adminAddress] = true;
        emit AdminAdded(adminAddress, true);
    }

    // Add customer
    function registerCustomer() external {
        require(!isCustomer[msg.sender], "Customer already registered.");
        isCustomer[msg.sender] = true;
        emit CustomerAdded(msg.sender);
    }

    // Approve customer's subscription on insurance
    function approveInsurance(
        address customerAddr,
        uint256 _insuranceID,
        uint256 payAmount,
        uint256 payDate
    ) external onlyAdminOrManager {
        require(isCustomer[customerAddr], "Customer not found.");

        // Get current customer
        Customer storage currCustomer = customers[customerAddr];

        // Check if customer has already subscribed to this insurance
        for (uint i = 0; i < currCustomer.subscribedPackages.length; i++) {
            require(
                insuranceSubscribed[customerAddr][
                    currCustomer.subscribedPackages[i]
                ].insuranceID != _insuranceID,
                "This insurance has already been bought."
            );
        }

        // Create a new insurance subscription
        InsuranceSubscription
            memory newInsuranceSubscription = InsuranceSubscription({
                insuranceSubscriptionID: currCustomer.subscribedPackages.length,
                insuranceID: _insuranceID,
                payAmount: payAmount,
                payDate: payDate,
                autoPay: true,
                insStatus: InsuranceStatus.Approved
            });

        // Add new insurance subscription
        insuranceSubscribed[customerAddr][
            currCustomer.subscribedPackages.length
        ] = newInsuranceSubscription;

        // Push the new package ID inside
        currCustomer.subscribedPackages.push(
            currCustomer.subscribedPackages.length
        );

        emit InsuranceApproved(
            customerAddr,
            currCustomer.subscribedPackages.length,
            _insuranceID
        );
    }

    function dailyInsCheck() external {
        for (uint256 i = 0; i < addedCustomer.length; i++) {
            address currCustomerAddress = addedCustomer[i];
            Customer storage currCustomer = customers[currCustomerAddress];

            uint256 customerPackageCount = currCustomer
                .subscribedPackages
                .length;
            for (uint256 j = 0; j < customerPackageCount; j++) {
                InsuranceSubscription
                    storage currInsurance = insuranceSubscribed[
                        currCustomerAddress
                    ][currCustomer.subscribedPackages[j]];

                if (currInsurance.insStatus != InsuranceStatus.Approved)
                    continue;

                // Check if need pay
                if (block.timestamp >= currInsurance.payDate) {
                    // Calculate is there any delay
                    uint256 lateDays = (block.timestamp -
                        currInsurance.payDate) / 1 days;

                    // Check if within late payment limit
                    if (lateDays < latePaymentLimit / 1 days) {
                        // Check if auto pay is enabled
                        if (currInsurance.autoPay) {
                            if (
                                customerBalances[currCustomerAddress] >=
                                currInsurance.payAmount
                            ) {
                                makePayment(
                                    currCustomerAddress,
                                    currInsurance,
                                    currInsurance.payAmount
                                );
                                emit StatusMessage(
                                    "Auto pay process completed successfully!"
                                );
                            } else {
                                emit ReminderSent(
                                    currCustomerAddress,
                                    "Insufficient balance for auto pay"
                                );
                            }
                        } else {
                            emit ReminderSent(
                                currCustomerAddress,
                                "Customer needs to pay manually within 10 days."
                            );
                        }
                    } else {
                        currInsurance.insStatus = InsuranceStatus.Cancelled;
                        emit InsuranceInactive(
                            currCustomerAddress,
                            currInsurance.insuranceSubscriptionID
                        );
                        emit StatusMessage(
                            "Insurance had been Cancelled due to overdue payment."
                        );
                    }
                }
            }
        }
    }

    function manualPay(
        uint256 _insuranceSubscriptionID
    ) external payable onlyCustomer {
        bool validity = chkSubscriptionValidityInCustomer(
            msg.sender,
            _insuranceSubscriptionID
        );

        if (validity == true) {
            InsuranceSubscription storage currInsurance = insuranceSubscribed[
                msg.sender
            ][_insuranceSubscriptionID];

            require(
                currInsurance.insStatus == InsuranceStatus.Approved,
                "Insurance is not active."
            );
            require(
                customerBalances[msg.sender] >= currInsurance.payAmount,
                "Insufficient balance."
            );

            makePayment(msg.sender, currInsurance, currInsurance.payAmount);
            emit StatusMessage("Manual payment completed successfully!");
        } else {
            revert("Insurance not exist.");
        }
    }

    function chkManualPayInsurance(
        uint256 _insuranceSubscriptionID
    ) external view onlyCustomer returns (uint256, uint256) {
        return (
            insuranceSubscribed[msg.sender][_insuranceSubscriptionID].payAmount,
            insuranceSubscribed[msg.sender][_insuranceSubscriptionID].payDate
        );
    }

    function makePayment(
        address custAddress,
        InsuranceSubscription storage insurance,
        uint256 payAmount
    ) internal {
        customerBalances[custAddress] -= payAmount;
        insurance.payDate += 30 days;
        emit PaymentProcessed(
            custAddress,
            insurance.insuranceSubscriptionID,
            payAmount,
            customerBalances[custAddress] 
        );
    }

    function addBalance() external payable onlyCustomer {
        require(msg.value > 0, "Amount must be greater than 0");

        customerBalances[msg.sender] += msg.value;

        emit BalanceAdded(msg.sender, msg.value);
        emit StatusMessage("Amount had been topped up successfully");
    }

    function getCustomerBalance() external view onlyCustomer returns (uint256) {
        return customerBalances[msg.sender];
    }

    function updateAutoPay(
        uint256 _insuranceSubscriptionID
    ) external onlyCustomer {
        bool validity = chkSubscriptionValidityInCustomer(
            msg.sender,
            _insuranceSubscriptionID
        );

        if (validity == true) {
            InsuranceSubscription storage currInsurance = insuranceSubscribed[
                msg.sender
            ][_insuranceSubscriptionID];
            currInsurance.autoPay = !currInsurance.autoPay;
            emit AutoPayStatusChanged(
                msg.sender,
                _insuranceSubscriptionID,
                currInsurance.autoPay
            );
        } else {
            revert("Insurance not exist.");
        }
    }

    function chkAutoPayStatus(
        uint256 _insuranceSubscriptionID
    ) external view onlyCustomer returns (bool) {
        return
            insuranceSubscribed[msg.sender][_insuranceSubscriptionID].autoPay;
    }

    function updatePayDate(
        address customerAddress,
        uint256 _insuranceSubscriptionID,
        uint256 newPayDate
    ) external onlyAdminOrManager {
        require(
            newPayDate >= block.timestamp,
            "Pay date should not be previous time."
        );

        bool validity = chkSubscriptionValidityInCustomer(
            customerAddress,
            _insuranceSubscriptionID
        );

        if (validity == true) {
            InsuranceSubscription storage currInsurance = insuranceSubscribed[
                customerAddress
            ][_insuranceSubscriptionID];
            currInsurance.payDate = newPayDate;
            emit PayDateUpdated(
                customerAddress,
                _insuranceSubscriptionID,
                currInsurance.payDate
            );
        } else {
            revert("Insurance not exist.");
        }
    }

    function chkInsurancePayDate(
        address customerAddress,
        uint256 _insuranceSubscriptionID
    ) external view onlyAdminOrManager returns (uint256) {
        return
            insuranceSubscribed[customerAddress][_insuranceSubscriptionID]
                .payDate;
    }

    // Cancel Payment
    function cancelInsurance(
        uint256 _insuranceSubscriptionID
    ) external onlyCustomer {
        bool validity = chkSubscriptionValidityInCustomer(
            msg.sender,
            _insuranceSubscriptionID
        );

        if (validity == true) {
            InsuranceSubscription storage currInsurance = insuranceSubscribed[
                msg.sender
            ][_insuranceSubscriptionID];
            currInsurance.insStatus = InsuranceStatus.Cancelled;
            emit CancelInsurance(
                msg.sender,
                _insuranceSubscriptionID,
                currInsurance.insStatus
            );
        } else {
            revert("Insurance not exist.");
        }
    }

    function chkCancelInsuranceStatus(
        uint256 _insuranceSubscriptionID
    ) external view onlyCustomer returns (string memory) {
        InsuranceSubscription storage currInsurance = insuranceSubscribed[
            msg.sender
        ][_insuranceSubscriptionID];
        if (currInsurance.insStatus == InsuranceStatus.Pending) {
            return "Pending";
        } else if (currInsurance.insStatus == InsuranceStatus.Approved) {
            return "Approved";
        } else {
            return "Cancelled";
        }
    }

    function chkSubscriptionValidityInCustomer(
        address custAddress,
        uint256 _insuranceSubscriptionID
    ) private view returns (bool validity) {
        Customer storage currCustomer = customers[custAddress];
        for (uint256 i = 0; i < currCustomer.subscribedPackages.length; i++) {
            if (
                insuranceSubscribed[custAddress][
                    currCustomer.subscribedPackages[i]
                ].insuranceSubscriptionID == _insuranceSubscriptionID
            ) {
                return true;
            }
        }
        return false;
    }

    // Withdraw Ether from the contract
    function withdrawMoney(uint256 amount) public onlyOwner {
        require(
            amount <= address(this).balance,
            "Insufficient balance to withdraw"
        );
        payable(msg.sender).transfer(amount);
    }

    // View the total Ether balance in the contract
    function viewTotalMoney() public view onlyOwner returns (uint256) {
        return address(this).balance;
    }
}
