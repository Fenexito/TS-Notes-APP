/**
 * @file send-code.js
 * @summary Netlify function para generar un código de 6 dígitos y enviarlo por correo usando Brevo.
 * @description Esta función se activa mediante una solicitud POST desde el frontend,
 * genera un código, y utiliza la API de Brevo para enviar un correo transaccional.
 */

// Usamos 'require' para importar la librería de Brevo, que es lo correcto para las Netlify Functions.
const Brevo = require('@getbrevo/brevo');

// Una función de ayuda para crear respuestas HTTP consistentes en formato JSON.
const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Opcional: ajusta según tus necesidades de CORS
    },
    body: JSON.stringify(body),
});

// La función principal que Netlify ejecutará.
exports.handler = async function(event) {
    // 1. Validar el método de la solicitud. Solo se permiten POST.
    if (event.httpMethod !== 'POST') {
        return createResponse(405, { error: 'Method Not Allowed' });
    }

    // 2. Verificar que la API Key de Brevo esté configurada en las variables de entorno de Netlify.
    // ¡Esto es crucial para la seguridad! Nunca escribas la API Key directamente en el código.
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.error('Error Crítico: La variable de entorno BREVO_API_KEY no está configurada en Netlify.');
        return createResponse(500, { error: 'Error de configuración del servidor: Falta la API key.' });
    }

    try {
        // 3. Extraer el email del cuerpo de la solicitud.
        const { email } = JSON.parse(event.body);
        if (!email) {
            return createResponse(400, { error: 'El email es un campo requerido.' });
        }

        // 4. Generar un código de verificación aleatorio de 6 dígitos.
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 5. Configurar el cliente de la API de Brevo.
        // Esta es la parte corregida: usamos el objeto 'Brevo' que importamos.
        const defaultClient = Brevo.ApiClient.instance;
        const apiKeyAuth = defaultClient.authentications['api-key'];
        apiKeyAuth.apiKey = apiKey;

        // 6. Preparar el contenido del correo electrónico.
        const apiInstance = new Brevo.TransactionalEmailsApi();
        const sendSmtpEmail = new Brevo.SendSmtpEmail(); 

        sendSmtpEmail.subject = "Tu Código de Verificación para APad";
        sendSmtpEmail.htmlContent = `
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; padding: 40px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <h1 style="color: #333333;">Tu Código de Verificación</h1>
                    <p style="color: #555555; font-size: 16px;">Usa el siguiente código para completar tu inicio de sesión en APad.</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; background-color: #eef2f7; padding: 15px 20px; border-radius: 8px; display: inline-block; margin: 20px 0;">
                        ${code}
                    </div>
                    <p style="font-size: 14px; color: #888888;">Este código expirará en 10 minutos.</p>
                </div>
              </body>
            </html>`;
        
        // ¡MUY IMPORTANTE!
        // El email que uses en 'sender' DEBE estar verificado como un remitente autorizado en tu cuenta de Brevo.
        // De lo contrario, la API de Brevo rechazará el envío.
        sendSmtpEmail.sender = { "name": "APad Security", "email": "apadnoteapp@gmail.com" }; 
        sendSmtpEmail.to = [ { "email": email } ];

        // 7. Enviar el correo.
        console.log(`Intentando enviar código a ${email} via Brevo...`);
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Correo enviado exitosamente.');

        // 8. Devolver el código al frontend para su verificación.
        // Nota de seguridad: En una app de alta seguridad, el código no debería devolverse.
        // Se debería crear otro endpoint para verificar el código que el usuario introduce.
        return createResponse(200, { message: 'Código enviado exitosamente.', code: code });

    } catch (error) {
        // 9. Manejo de errores detallado.
        // Esto te ayudará a ver qué salió mal en los logs de Netlify.
        console.error('Error en la función send-code. Mensaje:', error.message);
        if (error.response) {
            // Si el error viene de la API de Brevo, su respuesta es muy útil.
            console.error('Cuerpo de la respuesta de error de la API de Brevo:', JSON.stringify(error.response.body, null, 2));
        }
        return createResponse(500, { error: 'Falló el envío del código de verificación. Revisa los logs de la función para más detalles.' });
    }
}
