// --- ESTADO GLOBAL ---
// Ampliación del catálogo a 8 productos
let products = [
    { id: 1, name: "Jean Paul Gaultier Le Male", price: 450000, img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80", desc: "La fragancia icónica del torso masculino. Notas orientales y amaderadas." },
    { id: 2, name: "Dior Sauvage", price: 650000, img: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&q=80", desc: "Composición radicalmente fresca y cruda. Inspirada en espacios abiertos." },
    { id: 3, name: "Paco Rabanne Invictus", price: 480000, img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80", desc: "La esencia del ganador. Un choque refrescante y vibrante." },
    { id: 4, name: "Chanel Bleu", price: 720000, img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80", desc: "Elegancia pura. Aromas cítricos y notas profundas de madera." },
    { id: 5, name: "Carolina Herrera Good Girl", price: 580000, img: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=400&q=80", desc: "Dulce, sensual y misterioso. El icónico frasco en forma de tacón." },
    { id: 6, name: "Versace Eros", price: 420000, img: "https://images.unsplash.com/photo-1605639956461-1c5211b816a1?auto=format&fit=crop&w=400&q=80", desc: "Amor, pasión, belleza y deseo. Menta, manzana verde y vainilla." },
    { id: 7, name: "Creed Aventus", price: 1200000, img: "https://images.unsplash.com/photo-1595425970377-c9703c486558?auto=format&fit=crop&w=400&q=80", desc: "Poder y éxito. Piña, abedul y almizcle en una mezcla perfecta." },
    { id: 8, name: "YSL Libre", price: 610000, img: "https://images.unsplash.com/photo-1616604847442-99bfc8a47568?auto=format&fit=crop&w=400&q=80", desc: "La libertad de vivir todo en exceso. Lavanda floral y azahar." }
];

let cart = [];
let currentUser = null; // Guardará objeto: { username, email, role }
const waNumber = "573154345953";

// Utilidades
const formatPrice = (num) => `$ ${num.toLocaleString('es-CO')}`;
const getWAUrl = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

// --- SISTEMA TOAST (Notificaciones Nativas) ---
function showToast(message, icon = "fa-circle-check") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast glass';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Forzar reflow para que la animación funcione
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto destruir
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    renderProducts();
    checkTheme();
    updateMenuState();
}

// --- EVENTOS PRINCIPALES ---
function setupEventListeners() {
    // Menu Bottom Sheet
    document.getElementById('btn-hamburger').addEventListener('click', () => toggleMenu(true));
    document.querySelectorAll('.btn-close-menu').forEach(btn => btn.addEventListener('click', () => toggleMenu(false)));
    document.getElementById('menu-overlay').addEventListener('click', () => { toggleMenu(false); closeModals(); });
    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.addEventListener('click', closeModals));

    // Menu Acordeón
    const catalogDropdown = document.getElementById('catalog-dropdown');
    catalogDropdown.querySelector('.dropdown-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        catalogDropdown.classList.toggle('active');
        const submenu = document.getElementById('catalog-submenu');
        submenu.style.maxHeight = catalogDropdown.classList.contains('active') ? submenu.scrollHeight + "px" : "0px";
    });

    // Navegación Pages (Pop Animation)
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

    // Botón Compartir (Copia Enlace + Toast)
    document.getElementById('btn-share').addEventListener('click', async () => {
        const url = window.location.href;
        try { 
            if (navigator.share) {
                await navigator.share({ title: 'Catálogo', url: url }); 
            } else {
                throw new Error('No share API');
            }
        } catch (e) { 
            navigator.clipboard.writeText(url).then(() => {
                showToast('Enlace copiado al portapapeles', 'fa-copy');
            });
        }
    });

    // Modal Configuración
    document.getElementById('btn-config').addEventListener('click', (e) => {
        e.preventDefault(); toggleMenu(false); document.getElementById('config-modal').classList.add('active');
    });
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.body.setAttribute('data-theme', e.target.checked ? 'dark' : '');
        localStorage.setItem('theme', theme);
    });

    setupProductPageEvents();
    setupAuthAndProfileEvents();
}

function toggleMenu(show) {
    document.getElementById('bottom-sheet').classList.toggle('open', show);
    document.getElementById('menu-overlay').classList.toggle('open', show);
}

function closeModals() { 
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); 
}

// --- CATÁLOGO ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    products.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'product-card glass';
        div.style.animation = `fadeInUp 0.3s ease forwards ${(i * 0.04)}s`;
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
        showToast('Añadido al carrito', 'fa-cart-plus');
    });

    document.getElementById('btn-wa-single').addEventListener('click', () => {
        const msg = `¡Hola!, me interesa comprar:\n- ${currentQty}x ${currentProduct.name}\n\nQuiero más información.`;
        window.open(getWAUrl(msg), '_blank');
    });

    document.getElementById('btn-wa-cart').addEventListener('click', () => {
        if(cart.length === 0) return showToast('El carrito está vacío', 'fa-circle-exclamation');
        let msg = `¡Hola!, quiero realizar este pedido:\n\n`;
        let total = 0;
        cart.forEach(item => {
            msg += `- ${item.qty}x ${item.name} (${formatPrice(item.price * item.qty)})\n`;
            total += (item.price * item.qty);
        });
        msg += `\nTotal: ${formatPrice(total)}\n\n¿Tienen disponibilidad?`;
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
    
    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: var(--text-sec);"><i class="fa-solid fa-cart-shopping" style="font-size: 40px; margin-bottom: 10px; opacity:0.5;"></i><p>Tu carrito está vacío</p></div>';
        document.getElementById('cart-total-price').innerText = formatPrice(0);
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.img}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatPrice(item.price)}</p>
                <div class="qty-selector" style="display:inline-flex; border: none; background: rgba(0,0,0,0.05);">
                    <button onclick="changeCartQty(${index}, -1)" style="width:30px; height:30px; font-size:16px;">-</button>
                    <span style="width:25px; line-height:30px; font-size:14px;">${item.qty}</span>
                    <button onclick="changeCartQty(${index}, 1)" style="width:30px; height:30px; font-size:16px;">+</button>
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

// --- AUTH, PERFIL Y ADMIN ---
function setupAuthAndProfileEvents() {
    // Abrir Modal Auth
    document.querySelectorAll('.btn-open-auth').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu(false);
            document.getElementById('auth-modal').classList.add('active');
        });
    });

    // Alternar Login/Registro
    document.getElementById('link-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('auth-title').innerText = 'Crear Cuenta';
        document.getElementById('form-login').style.display = 'none';
        document.getElementById('form-register').style.display = 'block';
    });
    document.getElementById('link-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('auth-title').innerText = 'Iniciar Sesión';
        document.getElementById('form-register').style.display = 'none';
        document.getElementById('form-login').style.display = 'block';
    });

    // Acción: Iniciar Sesión
    document.getElementById('btn-login').addEventListener('click', () => {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        
        if(u === 'admin' && p === 'admin') {
            currentUser = { username: 'Admin', email: 'admin@tienda.com', role: 'superadmin' };
            showToast('Bienvenido al panel de control', 'fa-shield-halved');
        } else if(u && p) {
            currentUser = { username: u, email: `${u}@mail.com`, role: 'user' };
            showToast(`¡Hola de nuevo, ${u}!`, 'fa-hand-wave');
        } else {
            return showToast('Ingresa usuario y contraseña', 'fa-circle-exclamation');
        }
        
        closeModals();
        updateMenuState();
    });

    // Acción: Registrarse
    document.getElementById('btn-register').addEventListener('click', () => {
        const user = document.getElementById('reg-user').value;
        const email = document.getElementById('reg-email').value;
        if(user && email) {
            currentUser = { username: user, email: email, role: 'user' };
            showToast('Cuenta creada con éxito', 'fa-user-check');
            closeModals();
            updateMenuState();
        } else {
            showToast('Completa todos los campos', 'fa-circle-exclamation');
        }
    });

    // Ver Perfil
    document.getElementById('btn-open-profile').addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu(false);
        if(!currentUser) return;
        document.getElementById('profile-name').value = currentUser.username;
        document.getElementById('profile-email').value = currentUser.email;
        document.getElementById('profile-modal').classList.add('active');
    });

    // Actualizar Perfil
    document.getElementById('btn-update-profile').addEventListener('click', () => {
        currentUser.username = document.getElementById('profile-name').value;
        currentUser.email = document.getElementById('profile-email').value;
        showToast('Datos actualizados correctamente', 'fa-check');
        closeModals();
    });

    // Cerrar Sesión
    document.getElementById('btn-logout').addEventListener('click', () => {
        currentUser = null;
        showToast('Has cerrado sesión', 'fa-info-circle');
        closeModals();
        updateMenuState();
        document.getElementById('page-admin').classList.remove('active');
    });

    // Panel Admin
    document.getElementById('btn-admin-access').addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu(false); 
        document.getElementById('page-admin').classList.add('active'); 
        renderAdminList();
    });

    // Guardar Producto (Admin)
    document.getElementById('btn-save-product').addEventListener('click', () => {
        const id = document.getElementById('admin-id').value;
        const p = {
            id: id ? parseInt(id) : Date.now(),
            img: document.getElementById('admin-img').value || 'https://via.placeholder.com/400',
            name: document.getElementById('admin-name').value,
            price: parseInt(document.getElementById('admin-price').value),
            desc: document.getElementById('admin-desc').value
        };
        
        if(!p.name || isNaN(p.price)) return showToast('Nombre y precio obligatorios', 'fa-triangle-exclamation');

        if(id) {
            const index = products.findIndex(x => x.id == id);
            products[index] = p;
            showToast('Producto editado', 'fa-check');
        } else { 
            products.unshift(p); 
            showToast('Producto creado', 'fa-check');
        }

        clearAdminForm();
        renderAdminList();
        renderProducts();
    });
}

function updateMenuState() {
    const authItem = document.getElementById('menu-auth-item');
    const profileItem = document.getElementById('menu-profile-item');
    const adminBtn = document.getElementById('btn-admin-access');

    if (currentUser) {
        authItem.style.display = 'none';
        profileItem.style.display = 'block';
        if(currentUser.role === 'superadmin') {
            adminBtn.style.display = 'flex';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        authItem.style.display = 'block';
        profileItem.style.display = 'none';
        adminBtn.style.display = 'none';
    }
}

// --- FUNCIONES EXTRA ADMIN ---
function renderAdminList() {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'admin-list-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.padding = '12px 0';
        div.style.borderBottom = '1px solid var(--glass-border)';
        div.innerHTML = `
            <div><strong>${p.name}</strong><br><small>${formatPrice(p.price)}</small></div>
            <div>
                <button class="icon-btn" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn" style="color:var(--danger); margin-left: 10px;" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
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
        showToast('Producto eliminado', 'fa-trash');
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
