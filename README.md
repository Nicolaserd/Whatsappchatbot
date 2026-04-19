# Telegram Chatbot

Este proyecto es un backend hecho con NestJS. Ahora esta pensado para trabajar con un bot de Telegram usando la Bot API oficial.

Tambien incluye usuarios, login con JWT, roles, mensajes guardados en base de datos, IA, NLP y Mercado Pago. Algunas partes todavia son esqueletos o pruebas.

## Explicacion muy simple

Imagina que el proyecto es una oficina con varios ayudantes:

- Un ayudante habla con Telegram.
- Otro ayudante revisa si una persona inicio sesion.
- Otro ayudante mira si esa persona es admin, usuario o proveedor.
- Otro ayudante guarda usuarios y mensajes en una base de datos.
- Otro ayudante esta empezando a aprender IA y procesamiento de texto.
- Otro ayudante esta preparado para pagos, pero por ahora solo responde una prueba.

NestJS es el edificio donde viven esos ayudantes. Cada ayudante esta separado en un modulo para que el proyecto no sea una mezcla gigante de archivos.

## Que hace ahora

- Arranca una API HTTP en `http://localhost:3000`.
- Tiene una ruta principal `GET /` que responde `Hello World!`.
- Se conecta con Telegram usando `TELEGRAM_BOT_TOKEN`.
- Puede recibir mensajes de Telegram por webhook.
- Puede responder automaticamente con Google AI Studio/Gemini cuando alguien le escribe al bot.
- Evita procesar dos mensajes del mismo chat al mismo tiempo: si la IA esta pensando, pide esperar.
- Guarda conversaciones de Telegram en PostgreSQL.
- Cifra el contenido de las conversaciones antes de guardarlas en la base de datos.
- Limita el uso global del bot a 4 conversaciones por dia.
- Si se supera el limite global, pide un PIN guardado en `BOT_UNLOCK_PIN`.
- Usa las ultimas 10 conversaciones guardadas de cada chat como contexto para la IA.
- Puede enviar mensajes a un `chatId`.
- Permite registrar usuarios.
- Permite iniciar sesion y devolver un token JWT.
- Usa guards para proteger rutas con token y roles.
- Usa PostgreSQL con TypeORM para guardar datos.
- Carga usuarios y mensajes de prueba al iniciar.

## Como esta construido

La entrada del programa esta en `src/main.ts`.

Ese archivo crea la aplicacion NestJS y la pone a escuchar en el puerto `3000`.

El archivo mas importante para juntar todo es `src/app.module.ts`. Ahi se conectan los modulos principales:

- `TelegramModule`: maneja Telegram.
- `AuthModule`: registro, login y JWT.
- `UsersModule`: usuarios y datos iniciales.
- `IaModule`: punto inicial para mensajes con IA.
- `NplModule`: punto inicial para procesar texto con `natural`.
- `MercadoPagoModule`: punto inicial para pagos.
- `TypeOrmModule`: conecta la API con PostgreSQL.

## Carpetas importantes

```txt
src/
  Auth/              Registro y login
  Users/             Creacion, actualizacion y carga inicial de usuarios
  telegram/          Webhook y envio de mensajes por Telegram
  IA/                Estructura inicial para responder mensajes con IA
  npl/               Estructura inicial para procesar texto
  mercado-pago/      Estructura inicial para pagos
  entities/          Tablas de la base de datos
  guards/            Proteccion con token y roles
  decorators/        Decorador @Roles()
  enum/              Roles del sistema
  config/            Configuracion de TypeORM/PostgreSQL
```

## Modulo de Telegram

Archivos principales:

- `src/telegram/telegram.controller.ts`
- `src/telegram/telegram.service.ts`
- `src/telegram/telegram.module.ts`
- `src/telegram/conversation-encryption.service.ts`

Rutas:

- `GET /telegram/status`: revisa si las variables de Telegram estan configuradas.
- `GET /telegram/webhook-info`: consulta el webhook configurado en Telegram. Necesita token JWT y rol `admin`.
- `POST /telegram/send-message`: envia un mensaje manualmente. Necesita token JWT y rol `admin`.
- `POST /telegram/webhook`: recibe eventos de Telegram. Esta es la URL que se registra en Telegram.

### Enviar mensaje manual

```http
POST /telegram/send-message
Authorization: Bearer TU_TOKEN_ADMIN
Content-Type: application/json
```

Body:

```json
{
  "chatId": "123456789",
  "text": "Hola desde mi API"
}
```

### Registrar webhook

El webhook se registra una sola vez directamente contra la API de Telegram, no desde una ruta del backend.

Primero configura en `.env` local o en Vercel:

```env
TELEGRAM_BOT_TOKEN=token_que_te_da_BotFather
TELEGRAM_WEBHOOK_SECRET=una_clave_secreta_para_telegram
```

Para registrar el webhook de Vercel:

```bash
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://tu-dominio.vercel.app/telegram/webhook\",\"secret_token\":\"una_clave_secreta_para_telegram\"}"
```

En Windows PowerShell:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" `
  -ContentType "application/json" `
  -Body '{"url":"https://tu-dominio.vercel.app/telegram/webhook","secret_token":"una_clave_secreta_para_telegram"}'
```

Telegram no acepta `localhost` como webhook porque necesita una URL publica HTTPS. Para probar localmente puedes usar un tunel como ngrok y registrar una URL tipo `https://algo.ngrok-free.app/telegram/webhook`.

## Flujo de Telegram

1. Creas un bot hablando con `@BotFather` en Telegram.
2. BotFather te da un `TELEGRAM_BOT_TOKEN`.
3. Pones el token en `.env` local y en las variables de Vercel.
4. Despliegas la API en una URL publica.
5. Registras el webhook una vez con la API de Telegram.
6. Un usuario le escribe al bot.
7. Telegram manda el mensaje a `POST /telegram/webhook`.
8. El backend manda el mensaje a Gemini.
9. Gemini genera una respuesta.
10. El bot responde por Telegram.

Para recibir mensajes y responder con IA, lo minimo es:

```env
TELEGRAM_BOT_TOKEN=token_que_te_da_BotFather
GOOGLE_AI_API_KEY=api_key_de_google_ai_studio
CONVERSATION_ENCRYPTION_KEY=una_clave_larga_para_cifrar_conversaciones
```

Y registrar este webhook:

```txt
https://tu-dominio.vercel.app/telegram/webhook
```

`TELEGRAM_WEBHOOK_SECRET` es opcional, pero recomendado. Si lo configuras, Telegram enviara ese secreto en el header `x-telegram-bot-api-secret-token` y el backend lo validara.

Si un usuario envia otro mensaje mientras la IA esta pensando, el bot responde:

```txt
Estoy pensando tu mensaje anterior. Dame un momento.
```

El bot permite maximo 4 conversaciones globales por dia. Es decir, el limite aplica para todos los chats juntos.

En cada respuesta permitida, el bot agrega al final:

```txt
uso de el bot 4 veces al dia intento numero X
```

Donde `X` es el intento global del dia.

Si ya se alcanzo el limite global, el bot responde:

```txt
El uso global del bot llego a 4 veces hoy. Envia el PIN para continuar.
```

Si el usuario envia el valor de `BOT_UNLOCK_PIN`, el bot desbloquea ese chat durante el dia y responde:

```txt
PIN correcto. Ya puedes seguir usando el bot hoy.
```

Para responder con contexto, el backend consulta las ultimas 10 conversaciones guardadas de ese `chatId` y las envia a Gemini antes del mensaje nuevo.

Antes de guardar una conversacion, el backend cifra `userMessage` y `botMessage` con AES-256-GCM usando `CONVERSATION_ENCRYPTION_KEY`. En la tabla se ve texto cifrado tipo `v1:...`, no el mensaje real. Los mensajes viejos que ya estaban guardados en texto plano se pueden seguir leyendo para no romper el contexto, pero no quedan cifrados automaticamente.

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
- `TelegramConversation`: conversaciones de Telegram usadas por el agente de IA.
- `Products`: productos relacionados con usuarios.
- `Proveedores`: proveedores relacionados con usuarios.

Variables de entorno esperadas:

```env
DATABASE_URL=postgresql://usuario:password@host.neon.tech/base?sslmode=require
DB_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=tu_base_de_datos
JWT_SECRET=tu_clave_secreta
TELEGRAM_BOT_TOKEN=token_que_te_da_BotFather
TELEGRAM_WEBHOOK_SECRET=una_clave_secreta_para_telegram
GOOGLE_AI_API_KEY=api_key_de_google_ai_studio
GEMINI_MODEL=gemini-2.5-flash
BOT_UNLOCK_PIN=123456789Zeus
CONVERSATION_ENCRYPTION_KEY=una_clave_larga_para_cifrar_conversaciones
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
- `MercadoPagoService`: por ahora solo devuelve `"Created Order"`.
- `UsersController.update`: la ruta existe, pero no llama correctamente al metodo de actualizacion.

## Como correr el proyecto

Instalar dependencias:

```bash
npm install
```

Crear un archivo `.env` con las variables necesarias.

Correr en modo desarrollo:

```bash
npm run start:dev
```

La API queda disponible en:

```txt
http://localhost:3000
```

## Deploy en Vercel

Este proyecto tiene un entrypoint serverless en `api/index.ts` y una configuracion `vercel.json` para que Vercel mande todas las rutas a NestJS.

Antes de desplegar, crea estas variables en Vercel:

```env
DATABASE_URL=postgresql://usuario:password@host.neon.tech/base?sslmode=require
JWT_SECRET=tu_clave_secreta
TELEGRAM_BOT_TOKEN=token_que_te_da_BotFather
TELEGRAM_WEBHOOK_SECRET=una_clave_secreta_para_telegram
GOOGLE_AI_API_KEY=api_key_de_google_ai_studio
GEMINI_MODEL=gemini-2.5-flash
BOT_UNLOCK_PIN=123456789Zeus
CONVERSATION_ENCRYPTION_KEY=una_clave_larga_para_cifrar_conversaciones
```

Comando para preview deploy:

```bash
npx vercel@latest deploy
```

Comando para produccion:

```bash
npx vercel@latest deploy --prod
```

## Comandos utiles

```bash
npm run start
npm run start:dev
npm run build
npm run test
npm run lint
```

## Resumen en una frase

Este proyecto es una API en NestJS para un bot de Telegram: recibe mensajes por webhook, responde usando Gemini, protege rutas con login y roles, guarda conversaciones cifradas en PostgreSQL y esta lista para desplegar en Vercel.
