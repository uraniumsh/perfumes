// Base de datos de productos con precios en Pesos Colombianos (COP)
const products = [
    { id: 1, name: "Jean Paul Gaultier Le Male", price: "$ 450.000 COP", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80", desc: "La fragancia icónica del torso masculino." },
    { id: 2, name: "Dior Sauvage", price: "$ 650.000 COP", img: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&q=80", desc: "Composición radicalmente fresca y cruda." },
    { id: 3, name: "Paco Rabanne Invictus", price: "$ 480.000 COP", img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80", desc: "La esencia del ganador. Frescura vibrante." },
    { id: 4, name: "One Million", price: "$ 460.000 COP", img: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=400&q=80", desc: "Un aroma de cuero especiado que deslumbra." },
    { id: 5, name: "Valentino Born In Roma", price: "$ 580.000 COP", img: "https://images.unsplash.com/photo-1608528577891-eb05eb101370?auto=format&fit=crop&w=400&q=80", desc: "Elegante fragancia amaderada con sal mineral." },
    { id: 6, name: "Creed Aventus", price: "$ 1.600.000 COP", img: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=400&q=80", desc: "Fuerza, poder y éxito. La fragancia nicho por excelencia." },
    { id: 7, name: "Versace Eros", price: "$ 410.000 COP", img: "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=400&q=80", desc: "Menta intensa, manzana verde y haba tonka." },
    { id: 8, name: "Armaf Odyssey", price: "$ 150.000 COP", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80", desc: "Una opción misteriosa y seductora oriental." },
    { id: 9, name: "Hugo Boss Bottled", price: "$ 350.000 COP", img: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&q=80", desc: "Equilibrada y elegante con notas de manzana." },
    { id: 10, name: "Carolina Herrera 212", price: "$ 430.000 COP", img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80", desc: "Energía pura de Nueva York para el hombre dinámico." },
    { id: 11, name: "Bleu de Chanel", price: "$ 720.000 COP", img: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=400&q=80", desc: "Un amaderado aromático, atemporal e inconformista." },
    { id: 12, name: "Acqua Di Giò", price: "$ 520.000 COP", img: "https://images.unsplash.com/photo-1608528577891-eb05eb101370?auto=format&fit=crop&w=400&q=80", desc: "Frescura marina, bergamota ligera y notas acuáticas." },
    { id: 13, name: "Afnan 9 PM", price: "$ 160.000 COP", img: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=400&q=80", desc: "Manzana, vainilla y especias dulces." },
    { id: 14, name: "Nautica Voyage", price: "$ 110.000 COP", img: "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=400&q=80", desc: "Como la brisa del océano. La fragancia más confiable." },
    { id: 15, name: "Lattafa Asad (Árabe)", price: "$ 140.000 COP", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80", desc: "Poderosa perfumería árabe. Notas de pimienta y tabaco." }
];

const itemsPerPage = 10;
let currentPage = 1;
let cartCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderPagination();
    checkTheme();

    // 1. Control del Menú Hamburguesa
    const bottomSheet = document.getElementById('bottom-sheet');
    const menuOverlay = document.getElementById('menu-overlay');
    
    document.getElementById('btn-hamburger').addEventListener('click', () => {
        bottomSheet.classList.add('open');
        menuOverlay.classList.add('open');
    });

    const closeMenu = () => {
        bottomSheet.classList.remove('open');
        menuOverlay.classList.remove('open');
    };
    
    document.getElementById('close-menu').addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);

    // 2. Lógica del Menú Desplegable (Catálogos)
    const catalogDropdown = document.getElementById('catalog-dropdown');
    const catalogSubmenu = document.getElementById('catalog-submenu');
    
    catalogDropdown.querySelector('.dropdown-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        catalogDropdown.classList.toggle('active');
        if (catalogDropdown.classList.contains('active')) {
            catalogSubmenu.style.maxHeight = catalogSubmenu.scrollHeight + "px";
        } else {
            catalogSubmenu.style.maxHeight = "0px";
        }
    });

    // 3. Modal de Configuración (Modo Oscuro)
    const configModal = document.getElementById('config-modal');
    document.getElementById('btn-config').addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        configModal.classList.add('active');
    });
    document.getElementById('close-config').addEventListener('click', () => configModal.classList.remove('active'));

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    // 4. Modal de Producto y Botón Comprar
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('product-modal').classList.remove('active');
    });

    document.querySelector('.buy-btn').addEventListener('click', () => {
        cartCount++;
        document.querySelector('.cart-badge').innerText = cartCount;
        
        // Animación de rebote en el carrito
        const btnCart = document.getElementById('btn-cart');
        btnCart.style.transform = 'scale(1.2)';
        setTimeout(() => btnCart.style.transform = 'scale(1)', 200);
        
        document.getElementById('product-modal').classList.remove('active');
    });
});

function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-toggle').checked = true;
    }
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = products.slice(start, start + itemsPerPage);

    paginatedItems.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card glass';
        // Añadir retraso escalonado a la animación
        card.style.animationDelay = `${index * 0.05}s`;
        
        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p class="price">${product.price}</p>
        `;
        card.addEventListener('click', () => openProductModal(product));
        grid.appendChild(card);
    });
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(products.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderProducts();
            renderPagination();
            window.scrollTo({ top: document.querySelector('.catalog-main').offsetTop - 60, behavior: 'smooth' });
        });
        paginationContainer.appendChild(btn);
    }
}

function openProductModal(product) {
    document.getElementById('modal-img').src = product.img;
    document.getElementById('modal-title').innerText = product.name;
    document.getElementById('modal-price').innerText = product.price;
    document.getElementById('modal-desc').innerText = product.desc;
    document.getElementById('product-modal').classList.add('active');
}
