// --- ESTADO GLOBAL ---
let products = [
    { id: 1, name: "Jean Paul Gaultier Le Male", price: 450000, img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80", desc: "La fragancia icónica del torso masculino." },
    { id: 2, name: "Dior Sauvage", price: 650000, img: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&q=80", desc: "Composición radicalmente fresca y cruda." },
    { id: 3, name: "Paco Rabanne Invictus", price: 480000, img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80", desc: "La esencia del ganador." }
];
let cart = [];
let currentUser = null; // Rol: null o 'superadmin'
const waNumber = "573154345953";

// Utilidades
const formatPrice = (num) => `$ ${num.toLocaleString('es-CO')} COP`;
const getWAUrl = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    renderProducts();
    checkTheme();
}

// --- EVENTOS PRINCIPALES ---
function setupEventListeners() {
    // Menu Bottom Sheet
    document.getElementById('btn-hamburger').addEventListener('click', () => toggleMenu(true));
    document.querySelectorAll('.btn-close-menu').forEach(btn => btn.addEventListener('click', () => toggleMenu(false)));
    document.getElementById('menu-overlay').addEventListener('click', () => { toggleMenu(false); closeModals(); });

    // Menu Acordeón
    const catalogDropdown = document.getElementById('catalog-dropdown');
    catalogDropdown.querySelector('.dropdown-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        catalogDropdown.classList.toggle('active');
        const submenu = document.getElementById('catalog-submenu');
        submenu.style.maxHeight = catalogDropdown.classList.contains('active') ? submenu.scrollHeight + "px" : "0px";
    });

    // Navegación Page-in-Page
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('active');
        });
    });

    // Abrir páginas específicas
    document.getElementById('btn-cart').addEventListener('click', () => {
        renderCart();
        document.getElementById('page-cart').classList.add('active');
    });

    document.querySelectorAll('.btn-open-auth').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleMenu(false);
            if(currentUser === 'superadmin') document.getElementById('page-admin').classList.add('active');
            else document.getElementById('page-auth').classList.add('active');
        });
    });

    // Modal Configuración
    document.getElementById('btn-config').addEventListener('click', (e) => {
        e.preventDefault(); toggleMenu(false); document.getElementById('config-modal').classList.add('active');
    });
    document.getElementById('close-config').addEventListener('click', closeModals);
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.body.setAttribute('data-theme', e.target.checked ? 'dark' : '');
        localStorage.setItem('theme', theme);
    });

    // Botón Compartir
    document.getElementById('btn-share').addEventListener('click', async () => {
        try { await navigator.share({ title: 'Catálogo', url: window.location.href }); } 
        catch (e) { alert('Enlace copiado al portapapeles'); }
    });

    setupProductPageEvents();
    setupAuthAndAdminEvents();
}

function toggleMenu(show) {
    document.getElementById('bottom-sheet').classList.toggle('open', show);
    document.getElementById('menu-overlay').classList.toggle('open', show);
}
function closeModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

// --- CATÁLOGO ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    products.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'product-card glass';
        div.style.animation = `fadeInUp 0.4s ease forwards ${(i * 0.05)}s`;
        div.innerHTML = `<img src="${p.img}" loading="lazy"><h3>${p.name}</h3><p class="price">${formatPrice(p.price)}</p>`;
        div.addEventListener('click', () => openProductPage(p));
        grid.appendChild(div);
    });
}

// --- VISTA DE PRODUCTO Y CARRITO ---
let currentProduct = null;
let currentQty = 1;

function openProductPage(product) {
    currentProduct = product;
    currentQty = 1;
    document.getElementById('view-img').src = product.img;
    document.getElementById('view-title').innerText = product.name;
    document.getElementById('view-price').innerText = formatPrice(product.price);
    document.getElementById('view-desc').innerText = product.desc;
    document.getElementById('view-qty').innerText = currentQty;
    document.getElementById('page-product').classList.add('active');
}

function setupProductPageEvents() {
    document.getElementById('btn-minus').addEventListener('click', () => { if(currentQty > 1) updateQty(-1); });
    document.getElementById('btn-plus').addEventListener('click', () => updateQty(1));
    
    document.getElementById('btn-add-cart').addEventListener('click', () => {
        const existing = cart.find(i => i.id === currentProduct.id);
        if(existing) existing.qty += currentQty;
        else cart.push({...currentProduct, qty: currentQty});
        updateCartBadge();
        document.getElementById('page-product').classList.remove('active');
    });

    document.getElementById('btn-wa-single').addEventListener('click', () => {
        const msg = `¡Hola!, me gustaría comprar ${currentQty}x ${currentProduct.name}, quiero más información.`;
        window.open(getWAUrl(msg), '_blank');
    });

    document.getElementById('btn-wa-cart').addEventListener('click', () => {
        if(cart.length === 0) return alert('El carrito está vacío');
        let msg = `¡Hola!, me gustaría realizar la siguiente compra:\n\n`;
        let total = 0;
        cart.forEach(item => {
            msg += `- ${item.qty}x ${item.name} (${formatPrice(item.price * item.qty)})\n`;
            total += (item.price * item.qty);
        });
        msg += `\nTotal: ${formatPrice(total)}\n\nQuiero más información.`;
        window.open(getWAUrl(msg), '_blank');
    });
}

function updateQty(change) {
    currentQty += change;
    document.getElementById('view-qty').innerText = currentQty;
}

function updateCartBadge() {
    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count');
    badge.innerText = totalItems;
    badge.style.transform = 'scale(1.3)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.img}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatPrice(item.price)} x ${item.qty}</p>
                <div class="qty-selector" style="display:inline-flex;">
                    <button onclick="changeCartQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeCartQty(${index}, 1)">+</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    document.getElementById('cart-total-price').innerText = formatPrice(total);
}

window.changeCartQty = function(index, change) {
    cart[index].qty += change;
    if(cart[index].qty <= 0) cart.splice(index, 1);
    updateCartBadge();
    renderCart();
}

// --- AUTH & ADMIN (Falso Backend) ---
function setupAuthAndAdminEvents() {
    document.getElementById('btn-login').addEventListener('click', () => {
        const u = document.getElementById('auth-user').value;
        const p = document.getElementById('auth-pass').value;
        if(u === 'admin' && p === 'admin') {
            currentUser = 'superadmin';
            document.getElementById('page-auth').classList.remove('active');
            document.getElementById('btn-admin-access').style.display = 'flex';
            alert('Bienvenido Superadmin');
            renderAdminList();
        } else { alert('Credenciales incorrectas'); }
    });

    document.getElementById('btn-admin-access').addEventListener('click', () => {
        toggleMenu(false); document.getElementById('page-admin').classList.add('active'); renderAdminList();
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        currentUser = null;
        document.getElementById('btn-admin-access').style.display = 'none';
        document.getElementById('page-admin').classList.remove('active');
    });

    document.getElementById('btn-save-product').addEventListener('click', () => {
        const id = document.getElementById('admin-id').value;
        const p = {
            id: id ? parseInt(id) : Date.now(),
            img: document.getElementById('admin-img').value.split(',')[0] || 'https://via.placeholder.com/400',
            name: document.getElementById('admin-name').value,
            price: parseInt(document.getElementById('admin-price').value),
            desc: document.getElementById('admin-desc').value
        };
        
        if(id) {
            const index = products.findIndex(x => x.id == id);
            products[index] = p;
        } else { products.unshift(p); } // Agrega al inicio

        clearAdminForm();
        renderAdminList();
        renderProducts(); // Actualiza el catálogo principal
        alert('Producto guardado');
    });
}

function renderAdminList() {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'admin-list-item';
        div.innerHTML = `
            <div><strong>${p.name}</strong><br><small>${formatPrice(p.price)}</small></div>
            <div>
                <button class="icon-btn" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn" style="color:var(--danger)" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        list.appendChild(div);
    });
}

window.editProduct = function(id) {
    const p = products.find(x => x.id === id);
    document.getElementById('admin-id').value = p.id;
    document.getElementById('admin-img').value = p.img;
    document.getElementById('admin-name').value = p.name;
    document.getElementById('admin-price').value = p.price;
    document.getElementById('admin-desc').value = p.desc;
    document.getElementById('admin-form-title').innerText = 'Editar Producto';
}

window.deleteProduct = function(id) {
    if(confirm('¿Seguro que deseas eliminar este producto?')) {
        products = products.filter(x => x.id !== id);
        renderAdminList();
        renderProducts();
    }
}

function clearAdminForm() {
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-img').value = '';
    document.getElementById('admin-name').value = '';
    document.getElementById('admin-price').value = '';
    document.getElementById('admin-desc').value = '';
    document.getElementById('admin-form-title').innerText = 'Publicar Producto';
}

function checkTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-toggle').checked = true;
    }
}
