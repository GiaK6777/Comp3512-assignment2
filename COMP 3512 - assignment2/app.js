document.addEventListener("DOMContentLoaded", () => {

    // ==== PART 2: chọn view, dialog ====
    const views = document.querySelectorAll(".view");
    const navLinks = document.querySelectorAll("nav a[data-view]");
    const aboutLink = document.getElementById("aboutLink");
    const aboutDialog = document.getElementById("aboutDialog");
    const closeAboutBtn = document.getElementById("closeAboutBtn");

    function showView(viewId) {
        views.forEach(v => v.style.display = "none");
        document.getElementById(viewId).style.display = "block";
    }

    // Khi load trang → hiện Home
    showView("home");

    // Khi click menu link → đổi view
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            showView(viewId);
        });
    });

    // Mở About dialog
    aboutLink.addEventListener("click", (e) => {
        e.preventDefault();
        aboutDialog.showModal();
    });

    // Đóng dialog
    closeAboutBtn.addEventListener("click", () => {
        aboutDialog.close();
    });

    // ==== PART 3: dữ liệu sản phẩm ====

    // mảng global để lưu tất cả sản phẩm
    let products = [];

    // ==== CART DATA ====
    let cart = [];


    let activeFilters = {
    gender: "all", // Mặc định hiện tất cả
    category: "all",
    sort: "name" // Mặc định sắp xếp theo tên (A-Z) như tài liệu yêu cầu
};

    // load cart từ localStorage (nếu có)
     const storedCart = localStorage.getItem("cart");
    if (storedCart) {
    cart = JSON.parse(storedCart);
}


    // chỗ hiển thị kết quả (Browse view)
    const resultsPanel = document.getElementById("resultsPanel");

    // ==== SINGLE PRODUCT VIEW ELEMENTS ====
const productImageEl = document.getElementById("productImage");
const productNameEl = document.getElementById("productName");
const productPriceEl = document.getElementById("productPrice");
const productDescriptionEl = document.getElementById("productDescription");
const productMaterialEl = document.getElementById("productMaterial");
const sizeSelectEl = document.getElementById("sizeSelect");
const qtyInputEl = document.getElementById("qtyInput");
const addToCartBtn = document.getElementById("addToCartBtn");


// 2. Hàm lọc mảng sản phẩm gốc dựa trên activeFilters
function applyFilters() {
    let filtered = products;

    if (activeFilters.gender !== "all") {
        filtered = filtered.filter(p => p.gender.toLowerCase() === activeFilters.gender.toLowerCase());
    }

    if (activeFilters.category !== "all") {
        filtered = filtered.filter(p => p.category.toLowerCase() === activeFilters.category.toLowerCase());
    }

   // --- LOGIC SẮP XẾP ---
    if (activeFilters.sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name)); // A-Z
    } else if (activeFilters.sort === "price") {
        filtered.sort((a, b) => a.price - b.price); // Giá thấp đến cao
    } else if (activeFilters.sort === "category") {
        filtered.sort((a, b) => a.category.localeCompare(b.category)); // Theo category
    }

    renderProducts(filtered);
}


   // hiển thị danh sách sản phẩm dưới dạng card grid
function renderProducts(list) {
    // Xóa nội dung cũ
    resultsPanel.innerHTML = "";

    // Nếu không có sản phẩm (sau này lọc) thì báo
    if (!list || list.length === 0) {
        const msg = document.createElement("p");
        msg.textContent = "No products match your filters.";
        resultsPanel.appendChild(msg);
        return;
    }

    // Tạo container dạng grid
    const grid = document.createElement("div");
    grid.className = "product-grid";
    resultsPanel.appendChild(grid);

    // Lặp qua từng sản phẩm
    list.forEach(prod => {
        const card = document.createElement("article");
        card.className = "product-card";

        // Ô màu (swatch) lấy từ color[0].hex
        const swatch = document.createElement("div");
        swatch.className = "product-swatch";

        if (Array.isArray(prod.color) && prod.color.length > 0) {
            swatch.style.backgroundColor = prod.color[0].hex;
        } else {
            swatch.style.backgroundColor = "#e0e0e0"; // fallback
        }
        card.appendChild(swatch);

        // Tên sản phẩm
        const name = document.createElement("h3");
        name.className = "product-name";
        name.textContent = prod.name;
        card.appendChild(name);

        // Giá
        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = `$${prod.price.toFixed(2)}`;
        card.appendChild(price);

        // Gender + Category (ví dụ: womens • Tops)
        const meta = document.createElement("p");
        meta.className = "product-meta";
        meta.textContent = `${prod.gender} • ${prod.category}`;
        card.appendChild(meta);

        // Màu + size (ví dụ: Ivory | XS,S,M,L)
        const extra = document.createElement("p");
        extra.className = "product-extra";
        const colorName = Array.isArray(prod.color) && prod.color[0]
            ? prod.color[0].name
            : "N/A";
        const sizeList = Array.isArray(prod.sizes) ? prod.sizes.join(", ") : "";
        extra.textContent = `${colorName} | ${sizeList}`;
        card.appendChild(extra);

        // Nút xem chi tiết (sẽ dùng ở Part 5)
        const btn = document.createElement("button");
        btn.className = "product-view-btn";
        btn.textContent = "View Details";
        btn.dataset.productId = prod.id; // lưu id để sau này tìm lại

        /*/ Tạm thời: chỉ log ra để kiểm tra, Part 5 mình sẽ nhảy sang single view
        btn.addEventListener("click", () => {
            console.log("View product", prod.id);
            // sau này sẽ: showProductDetails(prod.id);
        });*/

        btn.addEventListener("click", () => {
         showProductDetails(prod.id);
        });


        card.appendChild(btn);

        // Thêm card vào grid
        grid.appendChild(card);
    });
}

// hiển thị chi tiết 1 sản phẩm trong Single Product view
function showProductDetails(productId) {
    // tìm sản phẩm theo id trong mảng products
    const prod = products.find(p => p.id === productId);
    if (!prod) {
        console.error("Product not found:", productId);
        return;
    }

    // Cập nhật khối image: thay nội dung bằng 1 ô màu lớn
    productImageEl.innerHTML = ""; // xóa "Product image placeholder"
    const bigSwatch = document.createElement("div");
    bigSwatch.style.width = "100%";
    bigSwatch.style.height = "220px";
    bigSwatch.style.borderRadius = "6px";
    bigSwatch.style.border = "1px solid #ccc";
    bigSwatch.style.backgroundColor =
        Array.isArray(prod.color) && prod.color[0] ? prod.color[0].hex : "#e0e0e0";
    productImageEl.appendChild(bigSwatch);

    // Tên, giá, mô tả, material
    productNameEl.textContent = prod.name;
    productPriceEl.textContent = `$${prod.price.toFixed(2)}`;
    productDescriptionEl.textContent = prod.description;
    productMaterialEl.textContent = `Material: ${prod.material}`;

    // Dropdown size: xóa option cũ và thêm lại theo prod.sizes
    sizeSelectEl.innerHTML = "";
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Select size";
    sizeSelectEl.appendChild(defaultOpt);

    if (Array.isArray(prod.sizes)) {
        prod.sizes.forEach(size => {
            const opt = document.createElement("option");
            opt.value = size;
            opt.textContent = size;
            sizeSelectEl.appendChild(opt);
        });
    }

    // Quantity reset về 1
    qtyInputEl.value = 1;

    // Sau này có thể lưu productId hiện tại nếu cần cho cart
    qtyInputEl.dataset.productId = prod.id;

    // Chuyển sang view single product
    showView("singleproduct");
}

// ==== ADD TO CART ====
addToCartBtn.addEventListener("click", () => {
    const productId = qtyInputEl.dataset.productId;
    const selectedSize = sizeSelectEl.value;
    const qty = parseInt(qtyInputEl.value);

    // kiểm tra size
    if (!selectedSize) {
        alert("Please select a size.");
        return;
    }

    // tìm sản phẩm thật
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // kiểm tra nếu item cùng product + size đã tồn tại trong cart → tăng quantity
    const existing = cart.find(item => 
        item.id === productId && item.size === selectedSize
    );

    if (existing) {
        existing.qty += qty;
    } else {
        // thêm item mới
        cart.push({
            id: productId,
            name: prod.name,
            price: prod.price,
            size: selectedSize,
            qty: qty,
            color: prod.color[0].name,
        });
    }

    // lưu lại vào localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Added to cart!");
});
// ==== RENDER CART VIEW ====
const cartPanel = document.getElementById("cartPanel");
const merchSummaryEl   = document.getElementById("summaryMerch");
const shippingSummaryEl = document.getElementById("summaryShipping");
const taxSummaryEl      = document.getElementById("summaryTax");
const totalSummaryEl    = document.getElementById("summaryTotal");

const clearCartBtn = document.getElementById("clearCartBtn");

// 1. Định nghĩa bảng giá theo tài liệu 
const shippingRates = {
    standard: { CA: 10, US: 15, INT: 20 },
    express: { CA: 25, US: 25, INT: 30 },
    priority: { CA: 35, US: 50, INT: 50 }
};

function updateCartSummary(merchandiseTotal) {
    const destination = document.getElementById("destination").value;
    const shippingType = document.getElementById("shippingType").value;
    
    let shipping = 0;
    let tax = 0;

    // 2. Kiểm tra điều kiện miễn phí vận chuyển (> $500) 
    if (merchandiseTotal > 0 && merchandiseTotal <= 500) {
        shipping = shippingRates[shippingType][destination];
    } else {
        shipping = 0; // Miễn phí nếu > 500 hoặc giỏ hàng trống 
    }

    // 3. Tính thuế: 5% nếu là Canada 
    if (destination === "CA") {
        tax = merchandiseTotal * 0.05;
    }

    const total = merchandiseTotal + shipping + tax;

    // 4. Cập nhật DOM
    document.getElementById("summaryMerch").textContent = merchandiseTotal.toFixed(2);
    document.getElementById("summaryShipping").textContent = shipping.toFixed(2);
    document.getElementById("summaryTax").textContent = tax.toFixed(2);
    document.getElementById("summaryTotal").textContent = total.toFixed(2);
}

// 5. Lắng nghe sự kiện thay đổi trên các thẻ select
document.getElementById("destination").addEventListener("change", () => {
    // Gọi lại render để tính lại giá dựa trên lựa chọn mới
    renderCart(); 
});
document.getElementById("shippingType").addEventListener("change", () => {
    renderCart();
});

function removeFromCart(productId, size) {
    // Lọc bỏ sản phẩm khớp với ID và Size được chọn
    cart = cart.filter(item => !(item.id === productId && item.size === size));

    // Cập nhật lại localStorage để thay đổi này được lưu lại
    localStorage.setItem("cart", JSON.stringify(cart));

    // Vẽ lại giỏ hàng ngay lập tức để người dùng thấy thay đổi
    renderCart();
}

function renderCart() {
    cartPanel.innerHTML = "";


    let merchandise = 0;


    if (cart.length === 0) {
        cartPanel.textContent = "Your cart is empty.";
         updateCartSummary(0);   // summary về 0 luôn
        return;
    }

   // let total = 0;

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-row";

        const lineSubtotal = item.qty * item.price;
        merchandise += lineSubtotal;

        row.innerHTML = `
            <p><strong>${item.name}</strong></p>
            <p>Size: ${item.size}</p>
            <p>Qty: ${item.qty} | Price: $${item.price.toFixed(2)}</p>
             <p>Subtotal: $${lineSubtotal.toFixed(2)}</p>
            <hr>
        `;
        // Tạo nút xóa
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove Item";
        removeBtn.className = "remove-item-btn"; // Thêm class để dễ style
        removeBtn.onclick = () => removeFromCart(item.id, item.size);

        row.appendChild(removeBtn);
        row.appendChild(document.createElement("hr"));
        cartPanel.appendChild(row);
    });

  /*  const totalEl = document.createElement("p");
    totalEl.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
    cartPanel.appendChild(totalEl);*/

       // Cập nhật Summary box
    updateCartSummary(merchandise);
}

// nút xóa toàn bộ giỏ hàng
clearCartBtn.addEventListener("click", () => {
    // xóa dữ liệu trong mảng
    cart = [];

    // xóa trong localStorage để lần sau load lại không còn item cũ
    localStorage.removeItem("cart");

    // vẽ lại cart (sẽ ra "Your cart is empty.")
    renderCart();
});


navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const viewId = link.dataset.view;

        showView(viewId);

        if (viewId === "cart") {
            renderCart();
        }
    });

    // 4. Gán sự kiện cho các Dropdown Filter
document.getElementById("genderFilter").addEventListener("change", (e) => {
    activeFilters.gender = e.target.value;
    applyFilters();
});

document.getElementById("categoryFilter").addEventListener("change", (e) => {
    activeFilters.category = e.target.value;
    applyFilters();
});

document.getElementById("sortOrder").addEventListener("change", (e) => {
    activeFilters.sort = e.target.value;
    applyFilters(); // Cập nhật lại danh sách ngay lập tức
});

});

    // hàm load dữ liệu, ưu tiên lấy từ localStorage
    function loadProducts() {
        const stored = localStorage.getItem("products");

        if (stored) {
            // đã có dữ liệu trong localStorage
            products = JSON.parse(stored);
            console.log("Loaded products from localStorage", products);
            console.log("One sample product:", products[0]);   // <--- thêm dòng này
            renderProducts(products);
        } else {
            // chưa có → fetch từ file JSON
            fetch("data-pretty.json")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(data => {
                    products = data;
                    console.log("Fetched products from JSON", products);
                    console.log("One sample product:", products[0]);   // <--- thêm dòng này
                    // lưu vào localStorage để lần sau dùng lại
                    localStorage.setItem("products", JSON.stringify(products));
                    renderProducts(products);
                })
                .catch(error => {
                    console.error("Error loading products:", error);
                    resultsPanel.textContent = "Failed to load products.";
                });
        }
    }
    const checkoutBtn = document.getElementById("checkoutBtn");

    checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            showToaster("Your cart is empty!", "error");
            return;
        }

        showToaster("Order placed successfully! Thank you for your purchase.");

        cart = [];
        localStorage.removeItem("cart");

        renderCart();

        setTimeout(() => {
            showView("home");
        }, 2000);
    });

    function showToaster(message, type = "success") {
        const toaster = document.createElement("div");
        toaster.className = `toaster ${type}`;
        toaster.textContent = message;
        document.body.appendChild(toaster);

        setTimeout(() => {
            toaster.remove();
        }, 3000);
    }

    // gọi hàm khi trang load
    loadProducts();
});
