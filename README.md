# Intranet Almonte

Proyecto de intranet desarrollado con Next.js y Bootstrap.

## Estructura del Proyecto

```
intranetAlmonte/
├── frontend-ubold/     # Aplicación principal Next.js
└── frontend/           # Otra aplicación frontend
```

## Tecnologías

- **Next.js 16.0.10** - Framework React
- **Bootstrap 5.3.8** - Framework CSS
- **TypeScript** - Tipado estático
- **React 19.1.0** - Biblioteca UI

## Desarrollo Local

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Instalación

```bash
cd frontend-ubold
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build para producción

```bash
npm run build
npm start
```

## Deployment

Este proyecto está configurado para desplegarse en Railway.

### Railway Setup

1. Conecta tu repositorio de GitHub a Railway
2. Railway detectará automáticamente el proyecto Next.js
3. Las variables de entorno se configuran en el dashboard de Railway
4. El despliegue se realiza automáticamente en cada push a la rama principal

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Prettier

## Notas

- Los archivos modificados en `node_modules/bootstrap/scss/` son temporales y se regeneran al ejecutar `npm install`
- Las variables dark de Bootstrap están personalizadas en `src/assets/scss/_variables-dark.scss`

