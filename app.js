// Initialize local storage on first load
if (!localStorage.getItem('transactions')) {
    localStorage.setItem('transactions', JSON.stringify([]));
}

// DOM Elements
const currentBalanceEl = document.getElementById('current-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const transactionForm = document.getElementById('add-transaction-form');
const transactionList = document.getElementById('transaction-list');
const filterType = document.getElementById('filter-type');
const budgetProgress = document.getElementById('budget-progress');

// Transaction Class
class Transaction {
    constructor(id, description, amount, type, category, date) {
        this.id = id;
        this.description = description;
        this.amount = parseFloat(amount);
        this.type = type;
        this.category = category;
        this.date = date;
    }
}

// UI Class
class UI {
    static displayTransactions() {
        const transactions = Store.getTransactions();
        const filter = filterType.value;
        
        // Clear list first
        transactionList.innerHTML = '';
        
        // Filter transactions
        const filteredTransactions = filter === 'all' 
            ? transactions 
            : transactions.filter(transaction => transaction.type === filter);
        
        // Display filtered transactions
        filteredTransactions.forEach(transaction => UI.addTransactionToList(transaction));
        
        // Update summary figures
        UI.updateSummary();
        
        // Update budget tracking
        UI.updateBudgetTracking();
    }
    
    static addTransactionToList(transaction) {
        const listItem = document.createElement('li');
        listItem.className = 'transaction-item';
        
        const amountClass = transaction.type === 'income' ? 'income-amount' : 'expense-amount';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        
        listItem.innerHTML = `
            <div class="transaction-info">
                <strong>${transaction.description}</strong>
                <div>${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}</div>
            </div>
            <span class="transaction-amount ${amountClass}">${amountSign}$${Math.abs(transaction.amount).toFixed(2)}</span>
            <button class="delete-btn" data-id="${transaction.id}">X</button>
        `;
        
        transactionList.appendChild(listItem);
    }
    
    static updateSummary() {
        const transactions = Store.getTransactions();
        
        // Calculate total income
        const totalIncome = transactions
            .filter(transaction => transaction.type === 'income')
            .reduce((total, transaction) => total + transaction.amount, 0);
        
        // Calculate total expenses
        const totalExpenses = transactions
            .filter(transaction => transaction.type === 'expense')
            .reduce((total, transaction) => total + transaction.amount, 0);
        
        // Calculate balance
        const balance = totalIncome - totalExpenses;
        
        // Update UI
        currentBalanceEl.innerText = `$${balance.toFixed(2)}`;
        totalIncomeEl.innerText = `$${totalIncome.toFixed(2)}`;
        totalExpensesEl.innerText = `$${totalExpenses.toFixed(2)}`;
    }
    
    static updateBudgetTracking() {
        const transactions = Store.getTransactions();
        
        // Group expenses by category
        const categories = ['food', 'rent', 'utilities', 'entertainment', 'other'];
        const categoryTotals = {};
        
        categories.forEach(category => {
            const total = transactions
                .filter(t => t.type === 'expense' && t.category === category)
                .reduce((sum, t) => sum + t.amount, 0);
            
            categoryTotals[category] = total;
        });
        
        // Create budget bars
        budgetProgress.innerHTML = '';
        
        // Set some dummy budget limits
        const budgetLimits = {
            food: 500,
            rent: 1200,
            utilities: 300,
            entertainment: 200,
            other: 400
        };
        
        // Create bars for each category
        Object.keys(categoryTotals).forEach(category => {
            const limit = budgetLimits[category];
            const spent = categoryTotals[category];
            const percentage = Math.min((spent / limit) * 100, 100);
            
            const categoryEl = document.createElement('div');
            categoryEl.className = 'budget-category';
            categoryEl.innerHTML = `
                <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                <div class="budget-bar">
                    <div class="budget-progress" style="width: ${percentage}%; background-color: ${percentage > 90 ? '#e74c3c' : '#3498db'}"></div>
                </div>
                <div class="budget-label">
                    <span>$${spent.toFixed(2)}</span>
                    <span>$${limit.toFixed(2)}</span>
                </div>
            `;
            
            budgetProgress.appendChild(categoryEl);
        });
    }
    
    static clearForm() {
        document.getElementById('transaction-description').value = '';
        document.getElementById('transaction-amount').value = '';
        document.getElementById('transaction-type').value = 'income';
        document.getElementById('transaction-category').value = 'salary';
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    }
    
    static showAlert(message, className) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${className}`;
        alertDiv.appendChild(document.createTextNode(message));
        
        const container = document.querySelector('.container');
        const form = document.querySelector('.transaction-form');
        
        container.insertBefore(alertDiv, form);
        
        // Remove alert after 3 seconds
        setTimeout(() => document.querySelector('.alert').remove(), 3000);
    }
}

// Storage Class
class Store {
    static getTransactions() {
        let transactions;
        if (localStorage.getItem('transactions') === null) {
            transactions = [];
        } else {
            transactions = JSON.parse(localStorage.getItem('transactions'));
        }
        return transactions;
    }
    
    static addTransaction(transaction) {
        const transactions = Store.getTransactions();
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    static removeTransaction(id) {
        const transactions = Store.getTransactions();
        const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    // Display transactions
    UI.displayTransactions();
});

// Add transaction
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const description = document.getElementById('transaction-description').value;
    const amount = document.getElementById('transaction-amount').value;
    const type = document.getElementById('transaction-type').value;
    const category = document.getElementById('transaction-category').value;
    const date = document.getElementById('transaction-date').value;
    
    // Validate
    if (description === '' || amount === '' || date === '') {
        UI.showAlert('Please fill in all fields', 'error');
    } else {
        // Create transaction
        const id = Date.now().toString(); // Simple way to create unique IDs
        const transaction = new Transaction(id, description, amount, type, category, date);
        
        // Add to UI
        UI.addTransactionToList(transaction);
        
        // Add to storage
        Store.addTransaction(transaction);
        
        // Update summary
        UI.updateSummary();
        
        // Update budget tracking
        UI.updateBudgetTracking();
        
        // Clear form
        UI.clearForm();
        
        // Show success
        UI.showAlert('Transaction added successfully', 'success');
    }
});

// Remove transaction
transactionList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        // Remove from UI
        e.target.parentElement.remove();
        
        // Remove from storage
        Store.removeTransaction(e.target.dataset.id);
        
        // Update summary
        UI.updateSummary();
        
        // Update budget tracking
        UI.updateBudgetTracking();
        
        // Show success
        UI.showAlert('Transaction removed', 'success');
    }
});

// Filter transactions
filterType.addEventListener('change', UI.displayTransactions);