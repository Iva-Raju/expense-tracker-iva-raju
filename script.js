// ==============================
// Expense Tracker
// ==============================

// Get elements from HTML
const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const balanceElement = document.getElementById("balance");
const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");

const monthlyIncomeElement = document.getElementById("monthly-income");
const monthlyExpensesElement = document.getElementById("monthly-expenses");
const monthlyMessage = document.getElementById("monthly-message");

const transactionList = document.getElementById("transaction-list");
const mobileTransactionList = document.getElementById(
    "mobile-transaction-list"
);

const emptyMessage = document.getElementById("empty-message");
const formMessage = document.getElementById("form-message");

const typeFilter = document.getElementById("type-filter");
const categoryFilter = document.getElementById("category-filter");

const submitButton = document.getElementById("submit-button");


// ==============================
// Variables
// ==============================

let transactions = [];
let editingId = null;
let expenseChart = null;


// ==============================
// Load transactions from Local Storage
// ==============================

const savedTransactions = localStorage.getItem("expenseTracker");

if (savedTransactions) {
    transactions = JSON.parse(savedTransactions);
}


// ==============================
// Set today's date automatically
// ==============================

const today = new Date().toISOString().split("T")[0];
dateInput.value = today;


// ==============================
// Save transactions
// ==============================

function saveTransactions() {
    localStorage.setItem(
        "expenseTracker",
        JSON.stringify(transactions)
    );
}


// ==============================
// Format amount as Indian Rupees
// ==============================

function formatAmount(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// ==============================
// Show form message
// ==============================

function showMessage(message, isError = false) {

    formMessage.textContent = message;

    if (isError) {
        formMessage.style.color = "#c0392b";
    } else {
        formMessage.style.color = "#2e7d32";
    }

    setTimeout(function () {
        formMessage.textContent = "";
    }, 3000);
}


// ==============================
// Add / Update Transaction
// ==============================

form.addEventListener("submit", function (event) {

    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;


    // Basic validation

    if (description === "") {
        showMessage("Please enter a description.", true);
        return;
    }

    if (amount <= 0 || isNaN(amount)) {
        showMessage("Please enter a valid amount.", true);
        return;
    }

    if (category === "") {
        showMessage("Please select a category.", true);
        return;
    }

    if (date === "") {
        showMessage("Please select a date.", true);
        return;
    }


    // If editing an existing transaction

    if (editingId !== null) {

        transactions = transactions.map(function (transaction) {

            if (transaction.id === editingId) {

                return {
                    id: editingId,
                    description: description,
                    amount: amount,
                    type: type,
                    category: category,
                    date: date
                };

            }

            return transaction;

        });

        editingId = null;

        submitButton.textContent = "+ Add Transaction";

        showMessage("Transaction updated successfully.");

    }

    // If adding a new transaction

    else {

        const newTransaction = {
            id: Date.now(),
            description: description,
            amount: amount,
            type: type,
            category: category,
            date: date
        };

        transactions.push(newTransaction);

        showMessage("Transaction added successfully.");
    }


    // Save and refresh page content

    saveTransactions();

    form.reset();

    dateInput.value = today;

    updateDashboard();

    renderTransactions();

    updateChart();

});


// ==============================
// Calculate Dashboard Totals
// ==============================

function updateDashboard() {

    let totalIncome = 0;
    let totalExpenses = 0;


    transactions.forEach(function (transaction) {

        if (transaction.type === "income") {
            totalIncome += Number(transaction.amount);
        }

        else if (transaction.type === "expense") {
            totalExpenses += Number(transaction.amount);
        }

    });


    const balance = totalIncome - totalExpenses;


    totalIncomeElement.textContent = formatAmount(totalIncome);

    totalExpensesElement.textContent = formatAmount(totalExpenses);

    balanceElement.textContent = formatAmount(balance);


    // Update monthly summary

    updateMonthlySummary();
}


// ==============================
// Monthly Summary
// ==============================

function updateMonthlySummary() {

    const currentDate = new Date();

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;


    transactions.forEach(function (transaction) {

        const transactionDate = new Date(transaction.date);

        if (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
        ) {

            if (transaction.type === "income") {
                monthlyIncome += Number(transaction.amount);
            }

            if (transaction.type === "expense") {
                monthlyExpenses += Number(transaction.amount);
            }

        }

    });


    monthlyIncomeElement.textContent =
        formatAmount(monthlyIncome);

    monthlyExpensesElement.textContent =
        formatAmount(monthlyExpenses);


    if (monthlyIncome === 0 && monthlyExpenses === 0) {

        monthlyMessage.textContent =
            "No income or expenses recorded this month yet.";

    }

    else {

        monthlyMessage.textContent =
            "Your activity for the current month.";

    }
}


// ==============================
// Display Transactions
// ==============================

function renderTransactions() {

    transactionList.innerHTML = "";

    mobileTransactionList.innerHTML = "";


    // Get filter values

    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;


    // Filter transactions

    const filteredTransactions = transactions.filter(
        function (transaction) {

            const typeMatches =
                selectedType === "all" ||
                transaction.type === selectedType;

            const categoryMatches =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            return typeMatches && categoryMatches;
        }
    );


    // Sort newest date first

    filteredTransactions.sort(function (a, b) {

        return new Date(b.date) - new Date(a.date);

    });


    // Show empty message

    if (filteredTransactions.length === 0) {

        emptyMessage.style.display = "block";

    }

    else {

        emptyMessage.style.display = "none";

    }


    // Create each transaction

    filteredTransactions.forEach(function (transaction) {

        createDesktopTransaction(transaction);

        createMobileTransaction(transaction);

    });

}


// ==============================
// Create Desktop Table Row
// ==============================

function createDesktopTransaction(transaction) {

    const row = document.createElement("tr");


    const amountText =
        transaction.type === "income"
            ? "+ " + formatAmount(transaction.amount)
            : "- " + formatAmount(transaction.amount);


    row.innerHTML = `

        <td>${formatDate(transaction.date)}</td>

        <td>${transaction.description}</td>

        <td>${transaction.category}</td>

        <td>${transaction.type === "income" ? "Income" : "Expense"}</td>

        <td>${amountText}</td>

        <td>

            <button
                class="edit-btn"
                onclick="editTransaction(${transaction.id})">
                Edit
            </button>

            <button
                class="delete-btn"
                onclick="deleteTransaction(${transaction.id})">
                Delete
            </button>

        </td>

    `;


    transactionList.appendChild(row);
}


// ==============================
// Create Mobile Transaction Card
// ==============================

function createMobileTransaction(transaction) {

    const card = document.createElement("div");

    card.className = "mobile-transaction";


    const amountText =
        transaction.type === "income"
            ? "+ " + formatAmount(transaction.amount)
            : "- " + formatAmount(transaction.amount);


    card.innerHTML = `

        <div class="mobile-transaction-top">

            <div class="mobile-description">
                ${transaction.description}
            </div>

            <div class="mobile-amount">
                ${amountText}
            </div>

        </div>


        <div class="mobile-transaction-details">

            ${formatDate(transaction.date)}
            •
            ${transaction.category}
            •
            ${transaction.type === "income" ? "Income" : "Expense"}

        </div>


        <div class="mobile-actions">

            <button
                class="edit-btn"
                onclick="editTransaction(${transaction.id})">
                Edit
            </button>

            <button
                class="delete-btn"
                onclick="deleteTransaction(${transaction.id})">
                Delete
            </button>

        </div>

    `;


    mobileTransactionList.appendChild(card);
}


// ==============================
// Format Date
// ==============================

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// ==============================
// Edit Transaction
// ==============================

function editTransaction(id) {

    const transaction = transactions.find(
        function (item) {
            return item.id === id;
        }
    );


    if (!transaction) {
        return;
    }


    descriptionInput.value = transaction.description;

    amountInput.value = transaction.amount;

    typeInput.value = transaction.type;

    categoryInput.value = transaction.category;

    dateInput.value = transaction.date;


    editingId = id;


    submitButton.textContent = "Update Transaction";


    // Scroll to form

    document.querySelector(".form-section").scrollIntoView({
        behavior: "smooth"
    });

}


// ==============================
// Delete Transaction
// ==============================

function deleteTransaction(id) {

    const transaction = transactions.find(
        function (item) {
            return item.id === id;
        }
    );


    if (!transaction) {
        return;
    }


    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );


    if (!confirmDelete) {
        return;
    }


    transactions = transactions.filter(
        function (item) {
            return item.id !== id;
        }
    );


    saveTransactions();

    updateDashboard();

    renderTransactions();

    updateChart();

    showMessage("Transaction deleted.");
}


// ==============================
// Filter Transactions
// ==============================

typeFilter.addEventListener("change", function () {

    renderTransactions();

});


categoryFilter.addEventListener("change", function () {

    renderTransactions();

});


// ==============================
// Expense Chart
// ==============================

function updateChart() {

    const categoryTotals = {};


    // Calculate expenses for each category

    transactions.forEach(function (transaction) {

        if (transaction.type === "expense") {

            if (!categoryTotals[transaction.category]) {

                categoryTotals[transaction.category] = 0;

            }

            categoryTotals[transaction.category] +=
                Number(transaction.amount);

        }

    });


    const labels = Object.keys(categoryTotals);

    const values = Object.values(categoryTotals);


    const chartCanvas =
        document.getElementById("expense-chart");


    // Remove old chart

    if (expenseChart) {

        expenseChart.destroy();

    }


    // Don't create an empty chart

    if (labels.length === 0) {

        return;

    }


    // Create new chart

    expenseChart = new Chart(chartCanvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [

                {
                    data: values
                }

            ]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}


// ==============================
// Start the application
// ==============================

updateDashboard();

renderTransactions();

updateChart();