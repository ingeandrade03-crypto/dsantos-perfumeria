# D'Santos Perfumería — Manual de Operación y Arquitectura

Bienvenida al sistema integral de comercio electrónico de **D'Santos Perfumería**, desarrollado especialmente para **Alba**.

---

## 1. Identidad Visual y Logotipo Oficial

- **Logotipo Principal**: Guardado en `public/logo.png` y `public/logo.svg`. Es fiel al diseño original: frasco de perfume dorado con silueta femenina formando la letra **S**, atomizador con gema facetada color rosa, texto *D'Santos*, divisor con pétalos de rosa y subtítulos *PERFUMERÍA Y CUIDADO PERSONAL*.
- **Paleta de Colores**:
  - Negro profundo: `#080808`
  - Dorado principal: `#D6A34A`
  - Dorado claro: `#F5D58A`
  - Rosa elegante: `#D98DA5`
  - Blanco marfil: `#FFF8EF`
- **Tipografía**: Combinación editorial de *Cinzel / Playfair Display* para títulos y *Montserrat* para catálogo legible y comercial.

---

## 2. Acceso al Panel Administrativo de Alba

El panel administrativo es privado y está protegido con autenticación en el servidor.

1. **Cómo acceder**:
   - Pulsa el botón con el icono de escudo en el encabezado o en el pie de página de la aplicación.
   - O navega directamente a la ruta `#admin`.
2. **Credenciales iniciales**:
   - **Usuario**: `alba`
   - **Contraseña inicial**: `Alba2026*`
3. **Cambiar la contraseña**:
   - Una vez dentro del panel, ve a la pestaña **Configuración & WhatsApp API** y podrás actualizar tu contraseña de forma segura.

---

## 3. Flujo de Pedidos por WhatsApp

1. El cliente explora el catálogo sin registrarse y añade artículos al carrito.
2. El sistema valida las existencias en tiempo real y no permite pedir más piezas de las disponibles.
3. Al pulsar **Tramitar Pedido por WhatsApp**:
   - Se genera un número de pedido único con formato `DSP-2026-XXXX`.
   - Se valida el inventario en el servidor.
   - El pedido queda guardado en la base de datos en estado **`pendiente_confirmacion`**.
   - Se abre WhatsApp con un mensaje estructurado y formal dirigido al número configurado por Alba.
4. **Alba confirma el pedido**:
   - En la pestaña **Pedidos** del panel administrativo, Alba actualiza el estado a `confirmado`, `preparando`, `listo_entrega` o `entregado`.
   - Al confirmar un pedido, el inventario se deduce de manera atómica con su registro en el historial.

---

## 4. Solicitudes de Productos Agotados ("Avísame cuando esté disponible")

1. Cuando un perfume o cosmético tiene existencia `0` o está marcado como `agotado`, el botón de compra se sustituye por **"Avísame cuando esté disponible"**.
2. El cliente ingresa su nombre, número de WhatsApp y marca la casilla de consentimiento obligatorio.
3. La solicitud se almacena en la tabla de interesados.
4. En el panel administrativo (**Avisos de Reposición**), Alba puede consultar:
   - Cuántos clientes están esperando cada producto agotado.
   - Qué fragancias tienen mayor demanda insatisfecha para realizar compras a proveedores.
5. Cuando Alba surte inventario (el stock pasa de 0 a positivo), el sistema le alerta y permite notificar a todos los clientes por WhatsApp con un solo clic.

---

## 5. Configuración de WhatsApp

El sistema cuenta con un modelo híbrido:
1. **Modo Directo (Listo para usar sin configuraciones complejas)**:
   - Utiliza enlaces oficiales `https://wa.me/{numero}` con textos prellenados y codificados. Funciona de inmediato sin costos ni trámites.
2. **Modo WhatsApp Business Cloud API (Opcional para envíos masivos por servidor)**:
   - Ve a **Configuración & WhatsApp API** en el panel de Alba.
   - Ingresa tu `Phone Number ID` y tu `Permanent Access Token` de Meta for Developers.
   - El sistema detectará automáticamente las credenciales y activará el envío por API de servidor. Si no están configuradas, mostrará el estado *Pendiente* y utilizará los enlaces directos.

---

## 6. Progresive Web App (PWA)

- **Instalación en Android y PC**: Muestra el botón **"Instalar App"** en el encabezado.
- **Instalación en iPhone / iPad (iOS Safari)**: Muestra una guía paso a paso para añadir a la pantalla de inicio desde el menú Compartir de Safari.
- **Modo sin conexión**: Los productos consultados y las configuraciones se almacenan en caché local. Si el usuario pierde conexión, un indicador flotante le informa que está navegando en modo offline.

---

## 7. Importación y Exportación Masiva (CSV)

- En la pestaña **Inventario & Catálogo**, Alba puede pulsar:
  - **Exportar CSV**: Para descargar el inventario completo, los pedidos o las solicitudes de reposición en Excel.
  - **Importar CSV**: Para dar de alta múltiples fragancias con el formato:
    `Nombre,Marca,Categoria,Precio,Stock,Presentacion,SKU`
