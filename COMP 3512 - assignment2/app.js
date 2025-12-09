document.addEventListener("DOMContentLoaded", () => {

    /* ====================
       1. VIEW MANAGEMENT
    ======================== */

    // Select all views 
    const views = document.querySelectorAll(".view");

    // All nav links that switch views
    const navLinks = document.querySelectorAll("nav a[data-view]");

    // Logo link → always go back to Home
    const logoLink = document.getElementById("logoLink");

    // Cart count indicator in nav
    const cartCountEl = document.getElementById("cartCount");

    // “Shop Now” button on home hero
    const shopNowBtn = document.getElementById("shopNowBtn");

    // Feature cards on home page that also open Browse
    const homeFeatureCards = document.querySelectorAll(".home-feature-link");

    // For About dialog modal
    const aboutLink = document.getElementById("aboutLink");
    const aboutDialog = document.getElementById("aboutDialog");
    const closeAboutBtn = document.getElementById("closeAboutBtn");

    /**
     * showView(id)
     * Hides all views and shows the one matching viewId.
     */
    function showView(viewId) {
        views.forEach(v => v.style.display = "none");
        const target = document.getElementById(viewId);
        if (target) target.style.display = "block";
    }

    // Show HOME as initial view
    showView("home");

    /**
     * Navigation links (Home, Browse, Cart)
     * Each link switches the current view.
     */
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            if (!viewId) return;

            showView(viewId);

            // If switching to cart, re-render cart content
            if (viewId === "cart" && typeof renderCart === "function") {
                renderCart();
            }
        });
    });

    // Clicking the logo always returns to Home
    if (logoLink) {
        logoLink.addEventListener("click", (e) => {
            e.preventDefault();
            showView("home");
        });
    }

    // “Shop Now” button → Browse view
    if (shopNowBtn) {
        shopNowBtn.addEventListener("click", (e) => {
            e.preventDefault();
            showView("browse");
        });
    }

    // Clicking a featured card also switches to Browse
    if (homeFeatureCards.length) {
        homeFeatureCards.forEach(card => {
            card.style.cursor = "pointer";
            card.addEventListener("click", () => {
                showView("browse");
            });
        });
    }

    // About modal open/close events
    if (aboutLink && aboutDialog && closeAboutBtn) {
        aboutLink.addEventListener("click", (e) => {
            e.preventDefault();
            aboutDialog.showModal();
        });
        closeAboutBtn.addEventListener("click", () => aboutDialog.close());
    }



    /* ============================================================
       2. GLOBAL STATE — products, cart, filters, UI helpers
       ============================================================ */

    let products = []; // Loaded later from JSON
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Active filter options for Browse page
    let activeFilters = {
        gender: "all",
        category: "all",
        size: "all",
        color: "all",
        sort: "name"
    };

    /**
     * updateCartCount()
     * Updates number of items displayed beside the Cart link.
     */
    function updateCartCount() {
        if (!cartCountEl) return;
        const totalItems = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
        cartCountEl.textContent = totalItems;
    }

    // Currently selected size in single product details view
    let currentSelectedSize = "";



    /* ===============================
       3. BROWSE: FILTERS & SORTING
      ==================== */

    const sortSelect = document.getElementById("sortOrder");
    const genderFilter = document.getElementById("genderFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const sizeFilter = document.getElementById("sizeFilter");
    const colorFilter = document.getElementById("colorFilter");
    const clearFiltersBtn = document.getElementById("clearAllFilters");
    const currentFiltersText = document.getElementById("currentFiltersText");

    /**
     * updateCurrentFiltersText()
     * Displays something like: “Male · Tops · Size L · Navy”
     */
    function updateCurrentFiltersText() {
        const parts = [];

        if (activeFilters.gender !== "all") {
            const g = activeFilters.gender.toLowerCase();
            const genderLabel =
                g === "mens" ? "Male" :
                g === "womens" ? "Female" :
                activeFilters.gender;
            parts.push(genderLabel);
        }

        if (activeFilters.category !== "all") parts.push(activeFilters.category);
        if (activeFilters.size !== "all") parts.push(`Size ${activeFilters.size}`);
        if (activeFilters.color !== "all") parts.push(activeFilters.color);

        if (!parts.length) {
            currentFiltersText.textContent = "All products";
        } else {
            currentFiltersText.textContent = parts.join(" · ");
        }
    }

    /**
     * applyFilters()
     * Applies all filter values to the products list, sorts it,
     * and re-renders products in Browse view.
     */
    function applyFilters() {
        if (!products || !products.length) {
            renderProducts([]);
            return;
        }

        let filtered = [...products];

        // Gender filter
        if (activeFilters.gender !== "all") {
            filtered = filtered.filter(p =>
                p.gender.toLowerCase() === activeFilters.gender.toLowerCase()
            );
        }

        // Category filter
        if (activeFilters.category !== "all") {
            filtered = filtered.filter(p => p.category === activeFilters.category);
        }

        // Size filter
        if (activeFilters.size !== "all") {
            filtered = filtered.filter(p =>
                Array.isArray(p.sizes) && p.sizes.includes(activeFilters.size)
            );
        }

        // Color filter
        if (activeFilters.color !== "all") {
            filtered = filtered.filter(p =>
                Array.isArray(p.color) &&
                p.color.some(c => c.name === activeFilters.color)
            );
        }

        // Sorting
        if (activeFilters.sort === "name") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (activeFilters.sort === "price") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (activeFilters.sort === "category") {
            filtered.sort((a, b) => a.category.localeCompare(b.category));
        }

        renderProducts(filtered);
        updateCurrentFiltersText();

        // Hide/show "Clear All"
        if (clearFiltersBtn) {
            const hasFilters =
                activeFilters.gender !== "all" ||
                activeFilters.category !== "all" ||
                activeFilters.size !== "all" ||
                activeFilters.color !== "all" ||
                activeFilters.sort !== "name";
            clearFiltersBtn.style.display = hasFilters ? "inline-block" : "none";
        }
    }

    /**
     * addProductToCart(prod, size, qty)
     * Adds a product (or increases qty if already added).
     */
    function addProductToCart(prod, size, qty) {
        if (!prod) {
            showToaster("Product not found.");
            return;
        }
        if (!size) {
            showToaster("Please select a size.");
            return;
        }
        if (!qty || qty < 1) qty = 1;

        const existing = cart.find(
            item => item.id === prod.id && item.size === size
        );

        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({
                id: prod.id,
                name: prod.name,
                price: prod.price,
                size,
                qty
            });
        }

        saveCart();
        updateCartCount();
        showToaster("Added to cart!");
    }

    /**
     * renderProducts(list)
     * Builds product cards inside Browse view.
     */
    function renderProducts(list) {
        const grid = document.getElementById("productsGrid");
        if (!grid) return;

        grid.innerHTML = "";

        if (!list.length) {
            grid.innerHTML = "<p>No products match your filters.</p>";
            return;
        }

        list.forEach(prod => {
            const card = document.createElement("article");
            card.className = "product-card";

            // Color swatch
            const swatch = document.createElement("div");
            swatch.className = "product-swatch";
            swatch.style.backgroundColor =
                Array.isArray(prod.color) && prod.color[0]
                ? prod.color[0].hex
                : "#e0e0e0";
            card.appendChild(swatch);

            // Name
            const name = document.createElement("h3");
            name.textContent = prod.name;
            card.appendChild(name);

            // Price
            const price = document.createElement("p");
            price.textContent = `$${prod.price.toFixed(2)}`;
            card.appendChild(price);

            // Action buttons row
            const actions = document.createElement("div");
            actions.className = "card-actions";

            // View button → opens Single Product view
            const viewBtn = document.createElement("button");
            viewBtn.className = "view-btn";
            viewBtn.type = "button";
            viewBtn.textContent = "View";
            viewBtn.addEventListener("click", () => {
                showProductDetails(prod.id);
            });
            actions.appendChild(viewBtn);

            // Quick Add button
            const addBtn = document.createElement("button");
            addBtn.className = "add-btn";
            addBtn.type = "button";
            addBtn.textContent = "+";
            addBtn.title = "Add to cart";
            addBtn.addEventListener("click", () => {
                const defaultSize = Array.isArray(prod.sizes) ? prod.sizes[0] : "";
                addProductToCart(prod, defaultSize, 1);
            });
            actions.appendChild(addBtn);

            card.appendChild(actions);
            grid.appendChild(card);
        });
    }


    // === Filter Event Listeners ===
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            activeFilters.sort = e.target.value;
            applyFilters();
        });
    }

    if (genderFilter) {
        genderFilter.addEventListener("change", (e) => {
            activeFilters.gender = e.target.value;
            applyFilters();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", (e) => {
            activeFilters.category = e.target.value;
            applyFilters();
        });
    }

    if (sizeFilter) {
        sizeFilter.addEventListener("change", (e) => {
            activeFilters.size = e.target.value;
            applyFilters();
        });
    }

    if (colorFilter) {
        colorFilter.addEventListener("change", (e) => {
            activeFilters.color = e.target.value;
            applyFilters();
        });
    }

    // Reset all filters
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
            activeFilters = {
                gender: "all",
                category: "all",
                size: "all",
                color: "all",
                sort: "name"
            };

            sortSelect.value = "name";
            genderFilter.value = "all";
            categoryFilter.value = "all";
            sizeFilter.value = "all";
            colorFilter.value = "all";

            applyFilters();
        });
    }



    /* ============================================================
       4. SINGLE PRODUCT VIEW — details, sizes, colors, related
       ============================================================ */

    const productImageEl = document.getElementById("productImage");
    const productNameEl = document.getElementById("productName");
    const productPriceEl = document.getElementById("productPrice");
    const productDescriptionEl = document.getElementById("productDescription");
    const productMaterialEl = document.getElementById("productMaterial");
    const qtyInputEl = document.getElementById("qtyInput");
    const addToCartBtn = document.getElementById("addToCartBtn");
    const breadcrumbEl = document.getElementById("breadcrumb");
    const sizePillsRow = document.getElementById("sizePills");
    const colorPillsRow = document.getElementById("colorPills");

    const relatedPanel =
        document.getElementById("relatedProductsPanel") ||
        document.getElementById("relatedProductsGrid");

    /**
     * showProductDetails(id)
     * Loads product info + builds UI for Single Product page.
     */
    function showProductDetails(productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod) {
            console.error("Product not found:", productId);
            return;
        }

        currentSelectedSize = ""; // reset when switching product

        // Create main color swatch image
        let bigSwatch = null;
        if (productImageEl) {
            productImageEl.innerHTML = "";
            bigSwatch = document.createElement("div");
            bigSwatch.className = "product-main-swatch";
            bigSwatch.style.backgroundColor =
                Array.isArray(prod.color) && prod.color[0]
                ? prod.color[0].hex
                : "#e0e0e0";
            productImageEl.appendChild(bigSwatch);
        }

        productNameEl.textContent = prod.name;
        productPriceEl.textContent = `$${prod.price.toFixed(2)}`;
        productDescriptionEl.textContent = prod.description;
        productMaterialEl.textContent = `Material: ${prod.material}`;

        // Build SIZE pills
        sizePillsRow.innerHTML = "";
        if (Array.isArray(prod.sizes)) {
            prod.sizes.forEach(size => {
                const pill = document.createElement("button");
                pill.type = "button";
                pill.className = "option-pill size-pill";
                pill.textContent = size;

                pill.addEventListener("click", () => {
                    currentSelectedSize = size;

                    // Remove previous .selected
                    document.querySelectorAll(".size-pill.selected")
                        .forEach(p => p.classList.remove("selected"));

                    pill.classList.add("selected");
                });

                sizePillsRow.appendChild(pill);
            });
        }

        // Build COLOR pills
        colorPillsRow.innerHTML = "";
        if (Array.isArray(prod.color) && prod.color.length) {
            prod.color.forEach(c => {
                const pill = document.createElement("button");
                pill.type = "button";
                pill.className = "option-pill color-pill";
                pill.style.backgroundColor = c.hex;
                pill.title = c.name;

                pill.addEventListener("click", () => {
                    if (bigSwatch) bigSwatch.style.backgroundColor = c.hex;

                    document.querySelectorAll(".color-pill.selected")
                        .forEach(p => p.classList.remove("selected"));

                    pill.classList.add("selected");
                });

                colorPillsRow.appendChild(pill);
            });
        }

        qtyInputEl.value = 1;
        qtyInputEl.dataset.productId = prod.id;

        // Breadcrumb navigation
        breadcrumbEl.innerHTML = `
            <a href="#" data-view="home" class="crumb-home">Home</a>
            <span>&gt;</span>
            <span>${prod.gender}</span>
            <span>&gt;</span>
            <span>${prod.category}</span>
            <span>&gt;</span>
            <span class="crumb-current">${prod.name}</span>
        `;

        breadcrumbEl.querySelector(".crumb-home").addEventListener("click", (e) => {
            e.preventDefault();
            showView("home");
        });

        renderRelatedProducts(prod);
        showView("singleproduct");
    }

    /**
     * renderRelatedProducts()
     * Shows similar products (same gender + category)
     */
    function renderRelatedProducts(currentProd) {
        if (!relatedPanel) return;

        relatedPanel.innerHTML = "";

        // filter excluding itself
        let related = products.filter(p =>
            p.id !== currentProd.id &&
            p.gender === currentProd.gender &&
            p.category === currentProd.category
        );

        related = related.slice(0, 4);

        if (!related.length) {
            relatedPanel.textContent = "No related products found.";
            return;
        }

        related.forEach(prod => {
            const card = document.createElement("article");
            card.className = "related-card";

            const swatch = document.createElement("div");
            swatch.className = "related-swatch";
            swatch.style.backgroundColor =
                Array.isArray(prod.color) && prod.color[0]
                ? prod.color[0].hex
                : "#e0e0e0";
            card.appendChild(swatch);

            const name = document.createElement("p");
            name.textContent = prod.name;
            name.style.fontWeight = "600";
            card.appendChild(name);

            const price = document.createElement("p");
            price.textContent = `$${prod.price.toFixed(2)}`;
            card.appendChild(price);

            const actions = document.createElement("div");
            actions.className = "card-actions";

            const viewBtn = document.createElement("button");
            viewBtn.type = "button";
            viewBtn.textContent = "View";
            viewBtn.addEventListener("click", () => showProductDetails(prod.id));
            actions.appendChild(viewBtn);

            const addBtn = document.createElement("button");
            addBtn.className = "add-btn";
            addBtn.type = "button";
            addBtn.textContent = "+";
            addBtn.title = "Add to cart";
            addBtn.addEventListener("click", () => {
                const defaultSize = Array.isArray(prod.sizes) ? prod.sizes[0] : "";
                addProductToCart(prod, defaultSize, 1);
            });
            actions.appendChild(addBtn);

            card.appendChild(actions);
            relatedPanel.appendChild(card);
        });
    }

    // Add to Cart button in product details view
    if (addToCartBtn && qtyInputEl) {
        addToCartBtn.addEventListener("click", () => {
            const productId = qtyInputEl.dataset.productId;
            const qty = parseInt(qtyInputEl.value, 10) || 1;

            if (!productId) {
                showToaster("No product selected.");
                return;
            }

            const prod = products.find(p => p.id === productId);
            if (!prod) {
                showToaster("Product not found.");
                return;
            }

            const defaultSize = Array.isArray(prod.sizes) ? prod.sizes[0] : "";
            const size = currentSelectedSize || defaultSize;

            addProductToCart(prod, size, qty);
        });
    }



    /* ============================================================
       5. CART — rendering, totals, remove, checkout
       ============================================================ */

    const cartPanel = document.getElementById("cartPanel");
    const destinationSelect = document.getElementById("destination");
    const shippingTypeSelect = document.getElementById("shippingType");

    const summaryMerchEl = document.getElementById("summaryMerch");
    const summaryShippingEl = document.getElementById("summaryShipping");
    const summaryTaxEl = document.getElementById("summaryTax");
    const summaryTotalEl = document.getElementById("summaryTotal");

    const clearCartBtn = document.getElementById("clearCartBtn");
    const checkoutBtn = document.getElementById("checkoutBtn");

    /**
     * saveCart()
     * Saves cart data to localStorage.
     */
    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    /**
     * computeMerchandiseTotal()
     * Sum of price * qty.
     */
    function computeMerchandiseTotal() {
        return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    /**
     * updateCartSummary()
     * Calculates shipping, tax, totals, and updates UI panel.
     */
    function updateCartSummary() {
        const totalMerch = computeMerchandiseTotal();

        const dest = destinationSelect ? destinationSelect.value : "CA";
        const type = shippingTypeSelect ? shippingTypeSelect.value : "standard";

        const rates = {
            standard: { CA: 10, US: 15, INT: 20 },
            express:  { CA: 25, US: 25, INT: 30 },
            priority: { CA: 35, US: 50, INT: 50 }
        };

        let shipping = 0;
        if (totalMerch > 0 && totalMerch <= 500) {
            shipping = rates[type][dest];
        }

        const tax = dest === "CA" ? totalMerch * 0.05 : 0;
        const total = totalMerch + shipping + tax;

        summaryMerchEl.textContent = totalMerch.toFixed(2);
        summaryShippingEl.textContent = shipping.toFixed(2);
        summaryTaxEl.textContent = tax.toFixed(2);
        summaryTotalEl.textContent = total.toFixed(2);
    }

    /**
     * renderCart()
     * Displays the table of cart items.
     */
    function renderCart() {
        if (!cartPanel) return;

        cartPanel.innerHTML = "";

        if (!cart.length) {
            cartPanel.textContent = "Your cart is empty.";
            updateCartSummary();
            updateCartCount();
            return;
        }

        const table = document.createElement("table");
        table.className = "cart-table";

        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th></th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        cart.forEach((item, index) => {
            const tr = document.createElement("tr");

            // Product name
            const tdName = document.createElement("td");
            tdName.textContent = item.name;
            tr.appendChild(tdName);

            // Size
            const tdSize = document.createElement("td");
            tdSize.textContent = item.size;
            tr.appendChild(tdSize);

            // Price
            const tdPrice = document.createElement("td");
            tdPrice.textContent = `$${item.price.toFixed(2)}`;
            tr.appendChild(tdPrice);

            // Quantity input
            const tdQty = document.createElement("td");
            const qtyInput = document.createElement("input");
            qtyInput.type = "number";
            qtyInput.min = "1";
            qtyInput.value = item.qty;

            qtyInput.addEventListener("change", () => {
                let newQty = parseInt(qtyInput.value, 10);
                if (isNaN(newQty) || newQty < 1) newQty = 1;

                item.qty = newQty;
                saveCart();
                renderCart(); // refresh totals
            });

            tdQty.appendChild(qtyInput);
            tr.appendChild(tdQty);

            // Total
            const tdTotal = document.createElement("td");
            tdTotal.textContent = `$${(item.price * item.qty).toFixed(2)}`;
            tr.appendChild(tdTotal);

            // Remove button
            const tdRemove = document.createElement("td");
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "Remove";
            removeBtn.addEventListener("click", () => {
                cart.splice(index, 1);
                saveCart();
                renderCart();
            });

            tdRemove.appendChild(removeBtn);
            tr.appendChild(tdRemove);

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        cartPanel.appendChild(table);

        updateCartSummary();
        updateCartCount();
    }

    // Update summary when destination or shipping changes
    if (destinationSelect) {
        destinationSelect.addEventListener("change", updateCartSummary);
    }
    if (shippingTypeSelect) {
        shippingTypeSelect.addEventListener("change", updateCartSummary);
    }

    // Clear all items in cart
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {
            cart = [];
            saveCart();
            renderCart();
        });
    }

    // Fake checkout behavior
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            if (!cart.length) return;
            showToaster("Order placed successfully!");
            cart = [];
            saveCart();
            renderCart();
            showView("home");
        });
    }



    /* ============================================================
       6. TOASTER — small success/info popup message
       ============================================================ */

    window.showToaster = function (msg) {
        const t = document.createElement("div");
        t.className = "toaster success";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    };


/* ============================================================
   7. LOAD PRODUCTS — fetch from API + cache in localStorage
============================================================ */
function loadProducts() {
    const storageKey = "products";
    const apiURL =
        "https://gist.githubusercontent.com/rconnolly/" +
        "d37a491b50203d66d043c26f33dbd798/raw/" +
        "37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json";

    // 1) Try loading from localStorage first
    const cached = localStorage.getItem(storageKey);
    if (cached) {
        try {
            products = JSON.parse(cached);
            applyFilters();
            return;
        } catch (e) {
            console.warn("Local storage data corrupted. Re-fetching…");
            // fallback to fetch
        }
    }

    // 2) Fetch from API (required by assignment)
    fetch(apiURL)
        .then(resp => resp.json())
        .then(data => {
            products = data;
            localStorage.setItem(storageKey, JSON.stringify(data));
            applyFilters();
        })
        .catch(err => {
            console.error("Error loading products from API:", err);
        });
}


    loadProducts();
    updateCartCount();  // refresh count on page load

});
