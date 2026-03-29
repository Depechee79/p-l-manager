Aquí tienes la estructura HTML5 semántica diseñada específicamente para ser utilizada con el archivo CSS de tokens anterior. Esta estructura replica la jerarquía de la pantalla de Almacén que hemos validado.

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>P&L Manager - Almacén Test</title>
    <!-- El CSS generado anteriormente debería ir aquí -->
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-global">

    <!-- 1. NAVBAR SUPERIOR -->
    <header class="navbar">
        <div class="navbar-left">
            <div class="logo">P&L Manager</div>
            <div class="breadcrumb-container">
                <span class="breadcrumb">Management > Almacén</span>
                <span class="section-description">Existencias, inventarios, mermas y pedidos.</span>
            </div>
        </div>
        <div class="navbar-right">
            <div class="user-block">
                <div class="user-info">
                    <span class="user-name">Admin User</span>
                    <span class="user-role">SUPER ADMIN</span>
                </div>
                <div class="avatar"></div>
            </div>
        </div>
    </header>

    <div class="main-wrapper">
        <!-- 2. SIDEBAR -->
        <aside class="sidebar">
            <nav class="sidebar-nav">
                <div class="sidebar-group">MAIN MENU</div>
                <a href="#" class="sidebar-item">Dashboard</a>
                <a href="#" class="sidebar-item">Docs</a>
                <a href="#" class="sidebar-item active">Almacén</a>
                <a href="#" class="sidebar-item">Pedidos</a>
            </nav>
        </aside>

        <!-- 3. ÁREA DE CONTENIDO -->
        <main class="content-area">
            
            <!-- Fila de Navegación y Acción -->
            <div class="action-header">
                <nav class="tabs-nav">
                    <a href="#" class="tab-item active">Existencias</a>
                    <a href="#" class="tab-item">Inventarios</a>
                    <a href="#" class="tab-item">Mermas</a>
                    <a href="#" class="tab-item">Pedidos</a>
                </nav>
                <button class="btn-primary">+ Nuevo Producto</button>
            </div>

            <!-- Panel de Filtros -->
            <section class="filter-card">
                <div class="filter-group flex-grow">
                    <label class="filter-label">Buscar</label>
                    <input type="text" class="input-box" placeholder="Código, nombre...">
                </div>
                <div class="filter-group">
                    <label class="filter-label">Familia</label>
                    <select class="input-box">
                        <option>Todas las familias</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Sección</label>
                    <select class="input-box">
                        <option>Todas las secciones</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Proveedor</label>
                    <select class="input-box">
                        <option>Todos los proveedores</option>
                    </select>
                </div>
            </section>

            <!-- Tarjeta de Datos Principal -->
            <section class="main-card">
                <!-- Cabecera de KPIs -->
                <header class="kpi-header">
                    <div class="kpi-unit">
                        <span class="kpi-label">Productos</span>
                        <span class="kpi-value">1,284</span>
                    </div>
                    <div class="kpi-unit alert">
                        <span class="kpi-label">Stock Bajo</span>
                        <span class="kpi-value">12</span>
                    </div>
                    <div class="kpi-unit alert">
                        <span class="kpi-label">Sin Stock</span>
                        <span class="kpi-value">5</span>
                    </div>
                </header>

                <!-- Cuerpo: Empty State -->
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h2 class="empty-title">No hay productos disponibles</h2>
                    <p class="empty-text">Intenta ajustar los filtros o añade un nuevo producto para comenzar.</p>
                    <button class="btn-secondary">Limpiar filtros</button>
                </div>
            </section>

        </main>
    </div>

</body>
</html>
Por qué esta estructura es fiel al diseño:
Jerarquía Navbar: He separado el logo del breadcrumb y la descripción, colocándola justo debajo como pediste.
Continuidad Tabs-Filtros: No hay separadores pesados entre las pestañas y la tarjeta de filtros, respetando el "aire" visual del diseño.
KPIs Integrados: Están dentro de la main-card, actuando como el resumen de los datos que se mostrarán abajo.
Uso de Clases de Estado: He incluido la clase .alert en los KPIs de stock para que hereden el color carmesí del CSS.