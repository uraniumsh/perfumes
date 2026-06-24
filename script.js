import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY", authDomain: "TU_AUTH_DOMAIN", projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET", messagingSenderId: "TU_SENDER_ID", appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let products = [];
let cart = [];
let currentUser = null; 

let currentPage = 1;
const itemsPerPage = 10; // Exigencia: 10 productos por página
let activeCategory = 'Todos';

const waNumber = "573043344577";
const TELEGRAM_BOT_TOKEN = "TU_TOKEN_TELEGRAM"; 
const TELEGRAM_CHAT_ID = "TU_CHAT_ID";

const formatPrice = (num) => `$ ${Number(num).toLocaleString('es-CO')}`;
const getWAUrl = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

function showToast(message, icon = "fa-circle-check") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast glass';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// --- TELEGRAM API (MENSAJES Y FOTOS PARA NEQUI) ---
async function sendTelegramNotification(message) {
    if (TELEGRAM_BOT_TOKEN === "TU_TOKEN_TELEGRAM") return;
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
        });
    } catch (e) { console.error(e); }
}

async function sendTelegramPhoto(file, caption) {
    if (TELEGRAM_BOT_TOKEN === "TU_TOKEN_TELEGRAM") return;
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', file);
    formData.append('caption', caption);
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
    } catch (e) { console.error("Error Telegram Photo:", e); }
}

document.addEventListener('DOMContentLoaded', async () => {
    checkTheme(); setupEventListeners(); await loadProductsFromDB(); checkAuthState();
});

async function loadProductsFromDB() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];
        querySnapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
        
        // Base de datos enfocada en el contexto real de Uranium
        if(products.length === 0) {
            products = [
                { id: "1", name: "Netflix Premium", price: 15000, category: "Streaming", img: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", desc: "Perfil 1 pantalla UHD 4K. Renovación mensual." },
                { id: "2", name: "Disney+ / Star+", price: 12000, category: "Streaming", img: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", desc: "Perfil individual. Contenido familiar y deportes ESPN." },
                { id: "3", name: "Amazon Prime Video", price: 10000, category: "Streaming", img: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png", desc: "Pantalla compartida. Catálogo completo de Prime Video." },
                { id: "4", name: "Plex Premium", price: 8000, category: "Servidores Privados", img: "https://upload.wikimedia.org/wikipedia/commons/2/22/Plex_logo_2022.svg", desc: "Acceso a servidor privado estable. Películas y Series." }
            ];
        }
        
        updateCategoriesMenu(); renderProducts();
        if(currentUser?.role === 'superadmin' || currentUser?.role === 'subadmin') renderAdminList();
    } catch (error) { console.error("Configura credenciales de BD:", error); }
}

function updateCategoriesMenu() {
    const submenu = document.getElementById('catalog-submenu');
    const categories = ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))];
    submenu.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-cat="${cat}">${cat}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault(); activeCategory = cat; currentPage = 1;
            document.getElementById('current-category-title').innerText = `Catálogo: ${cat}`;
            renderProducts(); toggleMenu(false);
        });
        submenu.appendChild(li);
    });
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    let filtered = [...products];
    if (activeCategory === 'Todos') {
        filtered.sort((a, b) => (a.category || "").localeCompare(b.category || "")); // Agrupación alfabética exigida
    } else {
        filtered = filtered.filter(p => p.category === activeCategory);
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (paginatedItems.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-sec);">No hay servicios disponibles</p>';
    } else {
        paginatedItems.forEach((p, i) => {
            const div = document.createElement('div');
            div.className = 'product-card glass';
            div.style.animation = `fadeInUp 0.3s ease forwards ${(i * 0.04)}s`;
            div.innerHTML = `<img src="${p.img}" loading="lazy" style="object-fit: contain; padding: 20px;"><h3>${p.name}</h3><p class="price">${formatPrice(p.price)}</p>`;
            div.addEventListener('click', () => openProductPage(p));
            grid.appendChild(div);
        });
    }
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = '';
    if (totalPages <= 1) return; 

    const prevBtn = document.createElement('button'); prevBtn.className = 'page-btn'; prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>'; prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderProducts(); }; container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button'); btn.className = `page-btn ${currentPage === i ? 'active' : ''}`; btn.innerText = i;
        btn.onclick = () => { currentPage = i; renderProducts(); }; container.appendChild(btn);
    }

    const nextBtn = document.createElement('button'); nextBtn.className = 'page-btn'; nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>'; nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderProducts(); }; container.appendChild(nextBtn);
}

// --- LOGICA DE COMPRA Y NEQUI ---
let currentProduct = null;
let currentQty = 1;
let currentReceiptFile = null; // Guardar foto del comprobante

function openProductPage(product) {
    currentProduct = product; currentQty = 1;
    document.getElementById('view-img').src = product.img;
    document.getElementById('view-title').innerText = product.name;
    document.getElementById('view-price').innerText = formatPrice(product.price);
    document.getElementById('view-desc').innerText = product.desc;
    document.getElementById('view-qty').innerText = currentQty;
    document.getElementById('page-product').classList.add('active');
}

function setupEventListeners() {
    document.getElementById('btn-hamburger').addEventListener('click', () => toggleMenu(true));
    document.querySelectorAll('.btn-close-menu').forEach(btn => btn.addEventListener('click', () => toggleMenu(false)));
    document.getElementById('menu-overlay').addEventListener('click', () => { toggleMenu(false); closeModals(); });
    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.addEventListener('click', closeModals));
    
    document.getElementById('btn-home').addEventListener('click', (e) => {
        e.preventDefault(); activeCategory = 'Todos'; currentPage = 1;
        document.getElementById('current-category-title').innerText = 'Catálogo: Todos'; renderProducts();
    });

    const catalogDropdown = document.getElementById('catalog-dropdown');
    catalogDropdown.querySelector('.dropdown-trigger').addEventListener('click', (e) => {
        e.preventDefault(); catalogDropdown.classList.toggle('active');
        const submenu = document.getElementById('catalog-submenu');
        submenu.style.maxHeight = catalogDropdown.classList.contains('active') ? submenu.scrollHeight + "px" : "0px";
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => { document.getElementById(e.currentTarget.getAttribute('data-target')).classList.remove('active'); });
    });

    document.getElementById('btn-cart').addEventListener('click', () => { renderCart(); document.getElementById('page-cart').classList.add('active'); });
    document.getElementById('btn-config').addEventListener('click', (e) => { e.preventDefault(); toggleMenu(false); document.getElementById('config-modal').classList.add('active'); });
    
    document.getElementById('link-to-register').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('form-login').style.display = 'none'; document.getElementById('form-register').style.display = 'block'; document.getElementById('auth-title').innerText = 'Crear Cuenta'; });
    document.getElementById('link-to-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('form-register').style.display = 'none'; document.getElementById('form-login').style.display = 'block'; document.getElementById('auth-title').innerText = 'Iniciar Sesión'; });

    document.querySelectorAll('.btn-open-auth').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(false); document.getElementById('auth-modal').classList.add('active'); }));
    document.getElementById('btn-open-profile').addEventListener('click', (e) => {
        e.preventDefault(); toggleMenu(false);
        document.getElementById('profile-name').value = currentUser?.displayName || "";
        document.getElementById('profile-email').value = currentUser?.email || "";
        document.getElementById('profile-role').innerText = `Rol: ${currentUser?.role.toUpperCase()}`;
        document.getElementById('profile-modal').classList.add('active');
    });

    // Eventos Producto
    document.getElementById('btn-minus').addEventListener('click', () => { if(currentQty > 1) { currentQty--; document.getElementById('view-qty').innerText = currentQty; } });
    document.getElementById('btn-plus').addEventListener('click', () => { currentQty++; document.getElementById('view-qty').innerText = currentQty; });
    document.getElementById('btn-add-cart').addEventListener('click', () => {
        const existing = cart.find(i => i.id === currentProduct.id);
        if(existing) existing.qty += currentQty; else cart.push({...currentProduct, qty: currentQty});
        updateCartBadge(); document.getElementById('page-product').classList.remove('active'); showToast('Añadido al carrito', 'fa-cart-plus');
    });

    document.getElementById('btn-wa-cart').addEventListener('click', () => {
        if(cart.length === 0) return showToast('El carrito está vacío', 'fa-circle-exclamation');
        let msg = `¡Nuevo Pedido URANIUM!\nCliente: ${currentUser ? currentUser.email : 'Invitado'}\n\n`;
        cart.forEach(item => { msg += `- ${item.qty}x ${item.name}\n`; });
        window.open(getWAUrl(msg), '_blank');
    });

    // LÓGICA NEQUI OCULTA Y COMPROBANTES
    document.getElementById('btn-nequi-checkout').addEventListener('click', () => {
        if(cart.length === 0) return showToast('El carrito está vacío', 'fa-circle-exclamation');
        document.getElementById('nequi-total-ui').innerText = document.getElementById('cart-total-price').innerText;
        document.getElementById('nequi-modal').classList.add('active');
    });

    document.getElementById('nequi-receipt').addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            currentReceiptFile = e.target.files[0];
            document.getElementById('receipt-name').innerText = currentReceiptFile.name;
            document.getElementById('btn-confirm-nequi').disabled = false;
        }
    });

    document.getElementById('btn-confirm-nequi').addEventListener('click', async () => {
        const btn = document.getElementById('btn-confirm-nequi');
        btn.innerText = "Procesando..."; btn.disabled = true;

        let total = 0; let msg = `💳 PAGO NEQUI CONFIRMADO\nUsuario: ${currentUser ? currentUser.email : 'Sin Registro'}\n\nPerfiles Solicitados:\n`;
        cart.forEach(item => { msg += `- ${item.qty}x ${item.name}\n`; total += (item.price * item.qty); });
        msg += `\nTotal: ${formatPrice(total)}`;

        if(currentReceiptFile) await sendTelegramPhoto(currentReceiptFile, msg);
        else await sendTelegramNotification(msg);
        
        showToast('Pago y comprobante enviados exitosamente', 'fa-check');
        cart = []; renderCart(); updateCartBadge();
        document.getElementById('nequi-modal').classList.remove('active');
        document.getElementById('page-cart').classList.remove('active');
        
        btn.innerText = "Confirmar Pago"; btn.disabled = true; currentReceiptFile = null;
        document.getElementById('receipt-name').innerText = ""; document.getElementById('nequi-receipt').value = "";
    });

    setupAdminEvents(); setupFirebaseEvents();
}

window.changeCartQty = function(index, delta) {
    if(cart[index].qty + delta > 0) cart[index].qty += delta; else cart.splice(index, 1);
    updateCartBadge(); renderCart();
};

function updateCartBadge() { document.getElementById('cart-count').innerText = cart.reduce((a, i) => a + i.qty, 0); }

function renderCart() {
    const container = document.getElementById('cart-items'); container.innerHTML = ''; let total = 0;
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; margin-top:20px; color: var(--text-sec);">Carrito vacío</p>';
        document.getElementById('cart-total-price').innerText = formatPrice(0); return;
    }
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        const div = document.createElement('div'); div.className = 'cart-item';
        div.innerHTML = `<img src="${item.img}"><div class="cart-item-info"><h4>${item.name}</h4><p>${formatPrice(item.price)}</p>
            <div class="qty-selector" style="display:inline-flex; border: none; background: rgba(0,0,0,0.05);">
                <button onclick="changeCartQty(${index}, -1)">-</button><span>${item.qty}</span><button onclick="changeCartQty(${index}, 1)">+</button>
            </div></div>`;
        container.appendChild(div);
    });
    document.getElementById('cart-total-price').innerText = formatPrice(total);
}

// --- FIREBASE AUTH Y ROLES SUPERADMIN ---
function setupFirebaseEvents() {
    document.getElementById('btn-login').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value; const pass = document.getElementById('login-pass').value;
        if(email === 'juanrivera@urm.co' && pass === '170125@Jy') { // Lógica SuperAdmin Exigida
            await createOrUpdateUserDoc('super_uid', email, 'SuperAdmin Uranium', 'superadmin');
            simulateLocalLogin('super_uid', email, 'SuperAdmin', 'superadmin'); return;
        }
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, pass); await fetchUserRole(userCred.user);
            closeModals(); showToast('Acceso Correcto');
        } catch (e) { showToast('Credenciales incorrectas', 'fa-circle-xmark'); }
    });

    document.getElementById('btn-register').addEventListener('click', async () => {
        const user = document.getElementById('reg-user').value; const email = document.getElementById('reg-email').value; const pass = document.getElementById('reg-pass').value;
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, pass);
            await createOrUpdateUserDoc(userCred.user.uid, email, user, 'user');
            closeModals(); showToast('Cuenta Creada', 'fa-check');
        } catch (e) { showToast('Error al crear cuenta', 'fa-circle-xmark'); }
    });

    document.getElementById('btn-logout').addEventListener('click', async () => { await signOut(auth); currentUser = null; closeModals(); updateMenuState(); showToast('Sesión cerrada'); });
}

function checkAuthState() {
    onAuthStateChanged(auth, async (user) => { if (user) await fetchUserRole(user); else currentUser = null; updateMenuState(); });
}

async function fetchUserRole(firebaseUser) {
    if(firebaseUser.email === 'juanrivera@urm.co') { currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, displayName: 'SuperAdmin', role: 'superadmin' }; return; }
    try {
        const docSnap = await getDoc(doc(db, "users", firebaseUser.email));
        currentUser = docSnap.exists() ? { uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() } : { uid: firebaseUser.uid, email: firebaseUser.email, role: 'user', displayName: 'Usuario' };
    } catch (e) { currentUser = { uid: firebaseUser.uid, email: firebaseUser.email, role: 'user', displayName: 'Usuario' }; }
}

async function createOrUpdateUserDoc(uid, email, displayName, role) { try { await setDoc(doc(db, "users", email), { displayName, role }); } catch(e) {} }
function simulateLocalLogin(uid, email, displayName, role) { currentUser = { uid, email, displayName, role }; closeModals(); updateMenuState(); showToast('Modo SuperAdmin Activo'); }

function updateMenuState() {
    if (currentUser) {
        document.getElementById('menu-auth-item').style.display = 'none'; document.getElementById('btn-header-auth').style.display = 'none'; document.getElementById('menu-profile-item').style.display = 'block';
        const adminBtn = document.getElementById('btn-admin-access');
        if (currentUser.role === 'superadmin' || currentUser.role === 'subadmin') {
            adminBtn.style.display = 'block'; adminBtn.onclick = (e) => { e.preventDefault(); toggleMenu(false); document.getElementById('page-admin').classList.add('active'); renderAdminList(); };
            document.getElementById('superadmin-section').style.display = currentUser.role === 'superadmin' ? 'block' : 'none';
        } else { adminBtn.style.display = 'none'; }
    } else {
        document.getElementById('menu-auth-item').style.display = 'block'; document.getElementById('menu-profile-item').style.display = 'none'; document.getElementById('btn-admin-access').style.display = 'none';
    }
}

// --- PANEL DE ADMIN ---
function setupAdminEvents() {
    document.getElementById('btn-save-product').addEventListener('click', async () => {
        const pId = document.getElementById('admin-id').value || Date.now().toString();
        const pImg = document.getElementById('admin-img').value; const pName = document.getElementById('admin-name').value;
        const pCat = document.getElementById('admin-category').value || 'Otros'; const pPrice = parseInt(document.getElementById('admin-price').value);
        const pDesc = document.getElementById('admin-desc').value;

        if(!pName || !pPrice) return showToast('Datos incompletos', 'fa-circle-xmark');
        const productData = { id: pId, img: pImg, name: pName, category: pCat, price: pPrice, desc: pDesc };

        try {
            await setDoc(doc(db, "products", pId), productData);
            const idx = products.findIndex(p => p.id === pId); if(idx > -1) products[idx] = productData; else products.push(productData);
            showToast('Servicio Actualizado'); document.querySelectorAll('.admin-form input, .admin-form textarea').forEach(i => i.value = '');
            updateCategoriesMenu(); renderProducts(); renderAdminList();
        } catch (e) { showToast('Error en BD', 'fa-database'); }
    });

    document.getElementById('btn-add-subadmin').addEventListener('click', async () => {
        const subEmail = document.getElementById('admin-subadmin-email').value;
        if(!subEmail) return showToast('Ingresa un correo válido');
        try {
            await setDoc(doc(db, "users", subEmail), { role: "subadmin" }, { merge: true });
            showToast(`Rol asignado a ${subEmail}`, 'fa-user-shield'); document.getElementById('admin-subadmin-email').value = '';
        } catch (e) { showToast('Error al asignar rol', 'fa-circle-xmark'); }
    });
}

window.deleteProduct = async (id) => {
    if(!confirm("¿Retirar este servicio?")) return;
    try { await deleteDoc(doc(db, "products", id)); products = products.filter(p => p.id !== id); updateCategoriesMenu(); renderProducts(); renderAdminList(); showToast('Servicio eliminado', 'fa-trash'); } catch(e) {}
};
window.editProduct = (id) => {
    const p = products.find(i => i.id === id); document.getElementById('admin-id').value = p.id; document.getElementById('admin-img').value = p.img;
    document.getElementById('admin-name').value = p.name; document.getElementById('admin-category').value = p.category || '';
    document.getElementById('admin-price').value = p.price; document.getElementById('admin-desc').value = p.desc;
    document.getElementById('admin-form-title').innerText = 'Editar Servicio'; document.querySelector('.admin-form').scrollIntoView({behavior: 'smooth'});
};
function renderAdminList() {
    const list = document.getElementById('admin-product-list'); list.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div'); div.className = 'admin-item';
        div.innerHTML = `<div class="admin-item-info"><h4>${p.name}</h4><p>${p.category} | ${formatPrice(p.price)}</p></div>
            <div class="admin-item-actions"><i class="fa-solid fa-pen-to-square" onclick="editProduct('${p.id}')"></i><i class="fa-solid fa-trash" onclick="deleteProduct('${p.id}')"></i></div>`;
        list.appendChild(div);
    });
}

function toggleMenu(show) { document.getElementById('bottom-sheet').classList.toggle('open', show); document.getElementById('menu-overlay').classList.toggle('open', show); }
function closeModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }
function checkTheme() { const isDark = localStorage.getItem('theme') === 'dark'; document.body.setAttribute('data-theme', isDark ? 'dark' : ''); document.getElementById('theme-toggle').checked = isDark; }
document.getElementById('theme-toggle').addEventListener('change', (e) => { document.body.setAttribute('data-theme', e.target.checked ? 'dark' : ''); localStorage.setItem('theme', e.target.checked ? 'dark' : 'light'); });
