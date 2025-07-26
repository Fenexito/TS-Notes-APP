/**
 * @file send-code.js
 * @summary Netlify function para enviar un código de verificación usando la API de Brevo directamente con fetch.
 * @description Esta es una solución robusta que no depende del SDK de Brevo, evitando problemas de compatibilidad.
 */

// Una función de ayuda para crear respuestas HTTP consistentes.
const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

// La función principal que Netlify ejecutará.
exports.handler = async function(event) {
    // 1. Validar el método de la solicitud.
    if (event.httpMethod !== 'POST') {
        return createResponse(405, { error: 'Method Not Allowed' });
    }

    // 2. Verificar que la API Key de Brevo esté configurada.
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

        // 4. Generar el código de verificación.
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 5. Definir los detalles para la llamada a la API de Brevo.
        const brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

        // ¡MUY IMPORTANTE! El email del remitente DEBE estar verificado en tu cuenta de Brevo.
        const emailPayload = {
            sender: {
                name: "APad Security",
                email: "apadnoteapp@gmail.com" // Reemplaza si usas otro email verificado.
            },
            to: [{ email: email }],
            subject: "Tu Código de Verificación para APad",
            htmlContent: `
                <html>
                  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                    <div style="max-width: 800px; margin: 10px auto; background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        <h1 style="color: #333333;margin-top: 0px;margin-bottom: 15px;">This is your 6-Digit Verification Code</h1>
                        <p style="color: #555555; font-size: 16px;">Use this code to complete your APad Authentication.</p>
                        <div style="font-size: 36px;font-weight: bold;letter-spacing: 20px;background-color: #eef2f7;padding: 15px 20px;border-radius: 8px;display: inline-block;">
                            ${code}
                        </div>
                        <p style="font-size: 14px; color: #888888;">This code expires in 10 minutes.</p>
                    </div>
                  </body>
                </html>`
        };

        // 6. Realizar la llamada a la API con fetch.
        console.log(`Intentando enviar código a ${email} via Brevo API (fetch)...`);
        const response = await fetch(brevoApiUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });

        // 7. Verificar la respuesta de la API de Brevo.
        if (!response.ok) {
            // Si la respuesta no es exitosa, capturamos el error para los logs.
            const errorBody = await response.json();
            console.error('Error de la API de Brevo:', JSON.stringify(errorBody, null, 2));
            throw new Error(`La API de Brevo respondió con el estado ${response.status}.`);
        }

        console.log('Correo enviado exitosamente a través de la API de Brevo.');

        // 8. Devolver el código al frontend para su verificación.
        return createResponse(200, { message: 'Código enviado exitosamente.', code: code });

    } catch (error) {
        // 9. Manejo de errores generales.
        console.error('Error en la función send-code:', error.message);
        return createResponse(500, { error: 'Falló el envío del código de verificación.' });
    }
};
