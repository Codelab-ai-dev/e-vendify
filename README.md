# E-Vendify 🚀

**Tu Tienda Digital en la Palma de tu Mano**

E-Vendify es una plataforma digital innovadora diseñada para transformar negocios locales en experiencias digitales modernas. Conecta con tus clientes, gestiona tu inventario y haz crecer tu emprendimiento con nuestra solución todo-en-uno.

## ✨ Características Principales

### 🏪 Gestión de Tienda
- Administración intuitiva de inventario
- Gestión completa de productos
- Panel de control de ventas
- Interface fácil de usar

### 👥 Conexión con Clientes
- Sistema de notificaciones
- Promociones personalizadas
- Relación cercana con clientes
- Comunicación directa

### ⚡ Rápido y Eficiente
- Procesamiento instantáneo de pedidos
- Pagos rápidos y seguros
- Tecnología optimizada
- Rendimiento superior

### 🛡️ Seguro y Confiable
- Plataforma segura
- Protección de datos
- Transacciones confiables
- Respaldo completo

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 15.2.4
- **Frontend**: React 19
- **Estilos**: TailwindCSS 3.4.17
- **Base de Datos**: Supabase
- **Componentes UI**: Radix UI
- **Iconos**: Lucide React
- **Formularios**: React Hook Form + Zod
- **Tema**: next-themes (soporte para modo oscuro/claro)
- **Lenguaje**: TypeScript 5

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm, yarn o pnpm
- Cuenta de Supabase (para la base de datos)

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd e-vendify
   ```

2. **Instala las dependencias**
   ```bash
   # Con npm
   npm install

   # Con yarn
   yarn install

   # Con pnpm
   pnpm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edita `.env.local` y agrega tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Ejecuta el servidor de desarrollo**
   ```bash
   # Con npm
   npm run dev

   # Con yarn
   yarn dev

   # Con pnpm
   pnpm dev
   ```

5. **Abre tu navegador**
   
   Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 📁 Estructura del Proyecto

```
e-vendify/
├── app/                    # Páginas y rutas de Next.js App Router
│   ├── about/             # Página Acerca de
│   ├── admin/             # Panel de administración
│   ├── auth/              # Autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── login/             # Página de inicio de sesión
│   ├── register/          # Página de registro
│   ├── store/             # Gestión de tienda
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes de interfaz base
├── hooks/                # Custom React hooks
├── lib/                  # Utilidades y configuraciones
├── public/               # Archivos estáticos
├── styles/               # Estilos globales
└── types/                # Definiciones de TypeScript
```

## 🎯 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Construcción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia el servidor de producción

# Calidad de código
npm run lint         # Ejecuta el linter
```

## 🌟 Funcionalidades

### Para Comerciantes
- ✅ Registro y autenticación de usuarios
- ✅ Dashboard personalizado
- ✅ Gestión de productos e inventario
- ✅ Procesamiento de pedidos
- ✅ Análisis de ventas
- ✅ Gestión de clientes

### Para Clientes
- ✅ Navegación de tiendas
- ✅ Búsqueda de productos
- ✅ Carrito de compras
- ✅ Proceso de checkout
- ✅ Historial de pedidos

## 🎨 Temas

La aplicación soporta tanto modo claro como oscuro, con transiciones suaves entre temas. Los usuarios pueden alternar entre temas usando el botón en la esquina superior derecha.

## 🔐 Autenticación

E-Vendify utiliza Supabase Auth para proporcionar:
- Registro de usuarios
- Inicio de sesión
- Recuperación de contraseña
- Confirmación de email
- Gestión de sesiones

## 📱 Responsive Design

La aplicación está completamente optimizada para dispositivos móviles y de escritorio, proporcionando una experiencia consistente en todas las plataformas.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- 📧 Email: soporte@e-vendify.com
- 🌐 Website: [e-vendify.com](https://e-vendify.com)
- 📱 Teléfono: +1 (555) 123-4567

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework de React
- [Supabase](https://supabase.com/) - Backend como servicio
- [TailwindCSS](https://tailwindcss.com/) - Framework de CSS
- [Radix UI](https://www.radix-ui.com/) - Componentes primitivos
- [Lucide](https://lucide.dev/) - Iconos

---

**¡Transforma tu negocio local en una experiencia digital moderna con E-Vendify!** 🚀
