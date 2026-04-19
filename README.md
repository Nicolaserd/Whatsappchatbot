# Whatsappchatbot

Este proyecto es un backend hecho con NestJS. Su idea principal es conectar una cuenta de WhatsApp Web, mostrar un codigo QR para iniciar sesion y permitir enviar mensajes desde una API.

Tambien tiene partes preparadas para usuarios, login con JWT, roles, mensajes guardados en base de datos, IA, NLP, generacion de QR y Mercado Pago. Algunas de esas partes todavia estan como prueba o esqueleto.

## Explicacion muy simple

Imagina que el proyecto es una oficina con varios ayudantes:

- Un ayudante habla con WhatsApp.
- Otro ayudante revisa si una persona inicio sesion.
- Otro ayudante mira si esa persona es admin, usuario o proveedor.
- Otro ayudante guarda usuarios y mensajes en una base de datos.
- Otro ayudante esta empezando a aprender IA y procesamiento de texto.
- Otro ayudante esta preparado para pagos, pero por ahora solo responde una prueba.

NestJS es el edificio donde viven esos ayudantes. Cada ayudante esta separado en un modulo para que el proyecto no sea una mezcla gigante de archivos.

## Que hace ahora

- Arranca una API HTTP en `http://localhost:3000`.
- Tiene una ruta principal `GET /` que responde `Hello World!`.
- Puede inicializar un cliente de WhatsApp Web con `whatsapp-web.js`.
- Puede generar un QR de WhatsApp para enlazar la cuenta.
- Puede enviar mensajes a un numero de WhatsApp si el cliente ya esta conectado.
- Permite registrar usuarios.
- Permite iniciar sesion y devolver un token JWT.
- Usa guards para proteger rutas con token y con roles.
- Usa PostgreSQL con TypeORM para guardar datos.
- Carga usuarios y mensajes de prueba al iniciar.

## Como esta construido

La entrada del programa esta en `src/main.ts`.

Ese archivo crea la aplicacion NestJS y la pone a escuchar en el puerto `3000`.

El archivo mas importante para juntar todo es `src/app.module.ts`. Ahi se conectan los modulos principales:

- `WhatsappModule`: maneja WhatsApp.
- `AuthModule`: registro, login y JWT.
- `UsersModule`: usuarios y datos iniciales.
- `IaModule`: punto inicial para mensajes con IA.
- `NplModule`: punto inicial para procesar texto con `natural`.
- `QrGeneratorModule`: genera codigos QR de prueba.
- `MercadoPagoModule`: punto inicial para pagos.
- `TypeOrmModule`: conecta la API con PostgreSQL.

## Carpetas importantes

```txt
src/
  Auth/              Registro y login
  Users/             Creacion, actualizacion y carga inicial de usuarios
  whatsapp/          Conexion con WhatsApp Web y envio de mensajes
  IA/                Estructura inicial para responder mensajes con IA
  npl/               Estructura inicial para procesar texto
  qr-generator/      Generacion de QR de prueba
  mercado-pago/      Estructura inicial para pagos
  entities/          Tablas de la base de datos
  guards/            Proteccion con token y roles
  decorators/        Decorador @Roles()
  enum/              Roles del sistema
  config/            Configuracion de TypeORM/PostgreSQL
```

## Modulo de WhatsApp

Archivos principales:

- `src/whatsapp/whatsapp.controller.ts`
- `src/whatsapp/whatsapp.service.ts`

Rutas:

- `GET /whatsapp`: inicializa el cliente de WhatsApp y devuelve el QR en base64. Necesita token JWT y rol `admin`.
- `GET /whatsapp/qr-code`: devuelve el ultimo QR guardado. Necesita token JWT y rol `admin`.
- `GET /whatsapp/send-message?to=NUMERO&message=TEXTO`: envia un mensaje al numero indicado.
- `GET /whatsapp/send`: envia un mensaje de prueba a un numero fijo.

Flujo simple:

1. Se llama a `GET /whatsapp`.
2. El servicio crea un cliente de WhatsApp Web.
3. WhatsApp genera un QR.
4. La respuesta devuelve el QR como `data:image/png;base64,...` para que el frontend lo muestre en un `<img>`.
5. El usuario escanea el QR con WhatsApp.
6. Cuando el cliente queda listo, ya se pueden enviar mensajes.

## Autenticacion y roles

Archivos principales:

- `src/Auth/auth.controller.ts`
- `src/Auth/auth.service.ts`
- `src/guards/auth.guard.ts`
- `src/guards/roles.guard.ts`
- `src/decorators/roles.decorator.ts`

Rutas:

- `POST /auth/singup`: registra un usuario.
- `POST /auth/singin`: inicia sesion y devuelve un JWT.

Nota: los nombres de las rutas estan escritos como `singup` y `singin`, no como `signup` y `signin`.

El login funciona asi:

1. El usuario manda email y password.
2. La API busca el usuario en la base de datos.
3. Compara la password usando `bcrypt`.
4. Si todo esta bien, genera un token JWT.
5. Ese token se usa en rutas protegidas con el header:

```txt
Authorization: Bearer TU_TOKEN
```

Roles disponibles:

- `admin`
- `usuario`
- `proveedor`

## Base de datos

El proyecto usa PostgreSQL con TypeORM.

Entidades principales:

- `Users`: usuarios del sistema.
- `Messages`: mensajes relacionados con usuarios.
- `Products`: productos relacionados con usuarios.
- `Proveedores`: proveedores relacionados con usuarios.

Variables de entorno esperadas:

```env
DATABASE_URL=postgresql://usuario:password@host.neon.tech/base?sslmode=require
DB_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=tu_base_de_datos
JWT_SECRET=tu_clave_secreta
```

Si existe `DATABASE_URL`, el proyecto usa esa URL. Si no existe, intenta conectarse a PostgreSQL local con `DB_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`.

Para deploy en Vercel/Neon usa `DATABASE_URL`.

Advertencia importante: `src/config/typeorm.ts` debe quedar asi para no borrar datos:

```ts
synchronize: true,
dropSchema: false,
```

`dropSchema: false` evita que TypeORM borre las tablas al iniciar. No uses `dropSchema: true` en una base de datos en la nube.

## Datos de prueba

El archivo `src/PreloadTemplates/Users.ts` contiene usuarios de ejemplo.

Cuando inicia el modulo de usuarios, `UsersService` intenta cargar esos datos si no encuentra el usuario `john.doe@example.com`.

## Partes que todavia estan en construccion

Estas partes existen, pero aun no estan completas:

- `IaService`: tiene comentarios para usar modelos de IA, pero todavia no devuelve una respuesta real.
- `NplController`: recibe una ruta, pero no esta llamando al servicio todavia.
- `QrGeneratorService`: genera un QR de prueba hacia una URL de Google, pero solo lo imprime en consola.
- `MercadoPagoService`: por ahora solo devuelve `"Created Order"`.
- `UsersController.update`: la ruta existe, pero no llama correctamente al metodo de actualizacion.

## Como correr el proyecto

Instalar dependencias:

```bash
npm install
```

Crear un archivo `.env` con las variables necesarias:

```env
DB_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=tu_base_de_datos
JWT_SECRET=tu_clave_secreta
```

Levantar PostgreSQL y asegurarse de que exista la base de datos.

Correr en modo desarrollo:

```bash
npm run start:dev
```

La API queda disponible en:

```txt
http://localhost:3000
```

## Deploy en Vercel

Este proyecto ya tiene un entrypoint serverless en `api/index.ts` y una configuracion `vercel.json` para que Vercel mande todas las rutas a NestJS.

Antes de desplegar, crea estas variables en Vercel:

```env
DATABASE_URL=postgresql://usuario:password@host.neon.tech/base?sslmode=require
JWT_SECRET=tu_clave_secreta
```

Si usas Neon desde la integracion de Vercel, Vercel puede crear `DATABASE_URL` automaticamente.

Comando para preview deploy:

```bash
npx vercel@latest deploy
```

Comando para produccion:

```bash
npx vercel@latest deploy --prod
```

Nota importante: Vercel sirve muy bien para la API HTTP, login, usuarios y conexion a PostgreSQL. La parte de `whatsapp-web.js` necesita un navegador y una sesion viva por mucho tiempo; eso no encaja bien con funciones serverless. Para un bot de WhatsApp estable conviene usar Railway, Render, Fly.io, VPS o cualquier hosting con proceso Node persistente.

## Comandos utiles

```bash
npm run start
npm run start:dev
npm run build
npm run test
npm run lint
```

## Resumen en una frase

Este proyecto es una API en NestJS que quiere funcionar como un chatbot de WhatsApp: conecta WhatsApp Web con QR, protege rutas con login y roles, guarda usuarios/mensajes en PostgreSQL y tiene bases preparadas para IA, NLP y pagos.
