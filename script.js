    // JAVASCRIPT LOGIC
    document.addEventListener('DOMContentLoaded', () => {
        // --- UTILITIES ---
        const getById = (id) => document.getElementById(id);
        const getFromStorage = (key, fallback) => JSON.parse(localStorage.getItem(key)) || fallback;
        const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

        // --- BLOCK DEV TOOLS AND RIGHT CLICK ---
        // Disable right-click
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            alert("Right-click is disabled.");
        });

        // Disable common developer tool shortcuts
        document.addEventListener('keydown', (e) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                alert("Developer tools are disabled.");
            }
            // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                alert("Developer tools are disabled.");
            }
            // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) for Console
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                alert("Developer tools are disabled.");
            }
            // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) for Element Inspector
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                alert("Developer tools are disabled.");
            }
            // Ctrl+U (Windows/Linux) or Cmd+U (Mac) for View Source
            if ((e.ctrlKey || e.metaKey) && e.key === 'U') {
                e.preventDefault();
                alert("View source is disabled.");
            }
        });
        // --- END BLOCK DEV TOOLS AND RIGHT CLICK ---


        // --- DATA MANAGEMENT ---
        let products = getFromStorage('products', []);
        let transactions = getFromStorage('transactions', []);
        let settings = getFromStorage('settings', {
            storeName: 'My Supermarket', storeAddress: '123 Market St, City',
            storeContact: 'Ph: 123-456-7890', receiptFooter: 'Thank you for your visit!', receiptWidth: '3'
        });
        let billItems = [];

        // --- TRIAL MANAGEMENT ---
        const TRIAL_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
        let trialInfo = getFromStorage('trialInfo', {
            startTime: Date.now(), // Set start time on first load
            isPremium: false
        });

        // Save trialInfo immediately if it's a new entry (first load)
        if (!localStorage.getItem('trialInfo')) {
            saveToStorage('trialInfo', trialInfo);
        }

        const isTrialEnded = () => {
            if (trialInfo.isPremium) return false; // Premium users never have trial ended
            return (Date.now() - trialInfo.startTime) > TRIAL_DURATION_MS;
        };

        const showTrialEndedOverlay = () => {
            const overlay = getById('trialEndedOverlay');
            if (overlay) {
                overlay.style.display = 'flex';
                // Hide the main content
                document.querySelector('.container').style.display = 'none';
            }
        };

        // Check trial status on every page load
        if (isTrialEnded()) {
            showTrialEndedOverlay();
            return; // Stop further script execution if trial has ended
        }
        
        // --- NAVIGATION ---
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');

                // Lock settings page if not premium
                if (targetId === 'settings' && !trialInfo.isPremium) {
                    alert('Buy premium version to access settings!');
                    return; // Prevent navigation to settings
                }

                pages.forEach(page => page.classList.remove('active'));
                navLinks.forEach(nav => nav.classList.remove('active'));
                getById(targetId).classList.add('active');
                link.classList.add('active');
            });
        });

        // --- UNIVERSAL ELEMENT REFERENCES ---
        const selectProduct = getById('selectProduct'), quantityInput = getById('quantity'),
              addToBillBtn = getById('addToBill'), billBody = getById('billBody'),
              totalAmountSpan = getById('totalAmount'), saveBillBtn = getById('saveBill'),
              transactionList = getById('transactionList'), printArea = getById('print-area'),
              productNameInput = getById('productName'), productPriceInput = getById('productPrice'),
              addProductBtn = getById('addProduct'), productListBody = getById('productList'),
              settingsForm = getById('settingsForm'),
              resetSystemBtn = getById('resetSystemBtn'),
              resetConfirmNumberSpan = getById('resetConfirmNumber'),
              productSearchInput = getById('productSearch');

        // --- RENDER FUNCTIONS ---
        const renderProductList = () => {
            if (!productListBody) return;
            productListBody.innerHTML = '';
            products.forEach((product, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${product.name}</td><td class="text-right">Rs${parseFloat(product.price).toFixed(2)}</td>
                                <td><button class="btn-danger remove-product" data-index="${index}">Remove</button></td>`;
                productListBody.appendChild(tr);
            });
        };

        const renderProductOptions = (searchTerm = '') => {
            if (!selectProduct) return;
            selectProduct.innerHTML = '<option value="">-- Select Product --</option>';
            const lowerCaseSearchTerm = searchTerm.toLowerCase();

            products.forEach((product, index) => {
                if (product.name.toLowerCase().includes(lowerCaseSearchTerm)) {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${product.name} - Rs${product.price.toFixed(2)}`;
                    selectProduct.appendChild(option);
                }
            });
        };

        const renderBill = () => {
            if (!billBody) return;
            billBody.innerHTML = '';
            let total = 0;
            billItems.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td class="text-right">Rs${item.price.toFixed(2)}</td>
                                <td class="text-right">Rs${itemTotal.toFixed(2)}</td><td><button class="btn-danger remove-item" data-index="${index}">X</button></td>`;
                billBody.appendChild(tr);
            });
            totalAmountSpan.textContent = total.toFixed(2);
        };
        
        const renderTransactions = () => {
            if (!transactionList) return;
            transactionList.innerHTML = '';
            transactions.slice(0, 20).forEach((transaction, index) => {
                const li = document.createElement('li');
                // Use a div to wrap the text content and button for better alignment
                li.innerHTML = `
                    <div>
                        <span>Bill #${transactions.length - index} - ${new Date(transaction.date).toLocaleTimeString()}</span>
                        <strong>Rs${transaction.total.toFixed(2)}</strong>
                    </div>
                    <button class="btn-danger delete-bill-btn" data-index="${transactions.length - 1 - index}">Delete</button>
                `;
                li.dataset.transactionIndex = transactions.length - 1 - index; // For printing
                transactionList.appendChild(li);
            });
        };

        // --- PRINT RECEIPT FUNCTION (FIXED) ---
        const printReceipt = (transactionData) => {
            const { storeName, storeAddress, storeContact, receiptFooter, receiptWidth } = settings;
            const receiptHTML = `
                <div style="width: ${receiptWidth}in; padding: 0.1in; font-family: 'Courier New', monospace; color: #000;">
                    <div style="text-align: center;">
                        <h3 style="margin:0;">${storeName}</h3>
                        <p style="margin:2px 0; font-size: 10px;">${storeAddress}</p>
                        <p style="margin:2px 0; font-size: 10px;">${storeContact}</p>
                    </div>
                    <hr>
                    <p style="font-size: 10px;">Date: ${new Date(transactionData.date).toLocaleString()}</p>
                    <hr>
                    <table style="width:100%; font-size: 10px; border-collapse: collapse;">
                        <thead><tr><th style="text-align:left;">Item</th><th>Qty</th><th style="text-align:right;">Total</th></tr></thead>
                        <tbody>
                        ${transactionData.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td style="text-align:center;">${item.quantity}</td>
                                <td style="text-align:right;">Rs${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                    <hr>
                    <p style="text-align:right; font-size: 14px; margin: 5px 0;"><strong>Total: Rs${transactionData.total.toFixed(2)}</strong></p>
                    <hr>
                    <p style="text-align: center; font-size: 10px;">${receiptFooter}</p>
                </div>`;
            
            printArea.innerHTML = receiptHTML;
            window.print();
        };
        
        // --- EVENT LISTENERS ---
        addProductBtn?.addEventListener('click', () => {
            const name = productNameInput.value.trim(); const price = parseFloat(productPriceInput.value);
            if (name && !isNaN(price) && price > 0) {
                const existing = products.find(p => p.name.toLowerCase() === name.toLowerCase());
                if (existing) { if(confirm(`Update price for "${name}"?`)) existing.price = price; }
                else { products.push({ name, price }); }
                saveToStorage('products', products); renderProductList(); renderProductOptions();
                productNameInput.value = ''; productPriceInput.value = ''; productNameInput.focus();
            } else alert('Please enter a valid product name and price.');
        });

        productListBody?.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-product')) {
                if (confirm('Are you sure you want to remove this product?')) {
                    products.splice(e.target.dataset.index, 1);
                    saveToStorage('products', products); renderProductList(); renderProductOptions();
                }
            }
        });
        
        settingsForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            // Prevent saving settings if not premium
            if (!trialInfo.isPremium) {
                alert('Buy premium version to save settings!');
                return;
            }

            settings.storeName = getById('storeName').value; settings.storeAddress = getById('storeAddress').value;
            settings.storeContact = getById('storeContact').value; settings.receiptFooter = getById('receiptFooter').value;
            settings.receiptWidth = getById('receiptWidth').value;
            saveToStorage('settings', settings); alert('Settings saved successfully!');
        });
        
        addToBillBtn?.addEventListener('click', () => {
            const index = selectProduct.value; const quantity = parseInt(quantityInput.value);
            if (index !== '' && !isNaN(quantity) && quantity > 0) { // Check for empty string for index
                const product = products[index]; 
                if (!product) { // Handle case where product might not be found (e.g., after search filter)
                    alert('Selected product not found. Please select a valid product.');
                    return;
                }
                const existing = billItems.find(item => item.name === product.name);
                if (existing) existing.quantity += quantity; else billItems.push({ ...product, quantity });
                renderBill(); selectProduct.value = ''; quantityInput.value = '1';
                productSearchInput.value = ''; // Clear search after adding
                renderProductOptions(); // Re-render all options
            } else {
                alert('Please select a product and enter a valid quantity.');
            }
        });

        billBody?.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item')) { billItems.splice(e.target.dataset.index, 1); renderBill(); }
        });

        saveBillBtn?.addEventListener('click', () => {
            if (billItems.length > 0) {
                const newTransaction = {
                    date: new Date().toISOString(), items: billItems,
                    total: parseFloat(totalAmountSpan.textContent)
                };
                transactions.unshift(newTransaction);
                saveToStorage('transactions', transactions);
                printReceipt(newTransaction);
                billItems = []; renderBill(); renderTransactions();
            } else alert('Current bill is empty.');
        });
        
        transactionList?.addEventListener('click', (e) => {
            // Handle print action
            const li = e.target.closest('li');
            if (li && e.target.tagName !== 'BUTTON') { // Only print if not clicking the delete button
                if (li.dataset.transactionIndex) printReceipt(transactions[li.dataset.transactionIndex]);
            }

            // Handle delete bill action
            if (e.target.classList.contains('delete-bill-btn')) {
                const indexToDelete = parseInt(e.target.dataset.index);
                if (confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
                    transactions.splice(indexToDelete, 1);
                    saveToStorage('transactions', transactions);
                    renderTransactions(); // Re-render the list after deletion
                }
            }
        });

        // Event listener for the reset system button
        resetSystemBtn?.addEventListener('click', () => {
            // Prevent resetting if not premium
            if (!trialInfo.isPremium) {
                alert('Buy premium version to reset the system!');
                return;
            }

            const confirmNumber = resetConfirmNumberSpan.textContent; // Get the number from the span
            const userConfirmation = prompt(`To confirm system reset, please type the following number: ${confirmNumber}`);

            if (userConfirmation === confirmNumber) {
                if (confirm('Are you absolutely sure you want to reset the entire system? This action cannot be undone.')) {
                    localStorage.clear(); // Clears all data from local storage
                    
                    // Re-initialize all data to default values
                    products = [];
                    transactions = [];
                    settings = {
                        storeName: 'My Supermarket', storeAddress: '123 Market St, City',
                        storeContact: 'Ph: 123-456-7890', receiptFooter: 'Thank you for your visit!', receiptWidth: '3'
                    };
                    billItems = [];
                    
                    // Reset trial info as well, effectively restarting the trial
                    trialInfo = {
                        startTime: Date.now(),
                        isPremium: false
                    };
                    saveToStorage('trialInfo', trialInfo);

                    // Re-initialize settings form fields
                    Object.keys(settings).forEach(key => {
                        if (getById(key)) getById(key).value = settings[key];
                    });

                    renderProductList();
                    renderProductOptions();
                    renderTransactions();
                    renderBill(); // Clear current bill display
                    alert('System has been reset successfully! Your trial has been restarted.');
                    // Reload the page to ensure all states are fresh
                    location.reload();
                }
            } else if (userConfirmation !== null) { // If user entered something but it's wrong
                alert('Incorrect confirmation number. System reset cancelled.');
            } else { // If user clicked cancel on the prompt
                alert('System reset cancelled.');
            }
        });

        // New: Event listener for product search input
        productSearchInput?.addEventListener('input', (e) => {
            renderProductOptions(e.target.value);
        });

        // --- INITIALIZATION ---
        const init = () => {
            // Only initialize if trial has not ended
            if (!isTrialEnded()) {
                Object.keys(settings).forEach(key => { if (getById(key)) getById(key).value = settings[key]; });
                renderProductList(); 
                renderProductOptions(); // Initial render without search term
                renderTransactions();
                if (resetConfirmNumberSpan) {
                    resetConfirmNumberSpan.textContent = '12345'; // Set a fixed number for now
                }

                // Disable settings form inputs if not premium
                if (!trialInfo.isPremium) {
                    const settingsInputs = settingsForm.querySelectorAll('input, textarea, button[type="submit"]');
                    settingsInputs.forEach(input => {
                        input.disabled = true;
                        input.style.cursor = 'not-allowed';
                        input.style.backgroundColor = '#e9ecef'; // Visually indicate disabled
                    });
                    // Also disable the reset button
                    if (resetSystemBtn) {
                        resetSystemBtn.disabled = true;
                        resetSystemBtn.style.cursor = 'not-allowed';
                        resetSystemBtn.style.backgroundColor = '#e9ecef';
                    }
                }
            }
        };
        init();
    });
