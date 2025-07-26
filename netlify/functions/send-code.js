// Importa el cliente de Brevo. Netlify lo instalará gracias al package.json.
// MODIFICACIÓN CRÍTICA: La forma de importar la librería ha sido corregida.
import * as SibApiV3Sdk from '@getbrevo/brevo';

// Una función de ayuda para crear respuestas consistentes.
const createResponse = (statusCode, body) => ({
    statusCode,
    body: JSON.stringify(body),
});

// La función principal que Netlify ejecutará.
export async function handler(event) {
    // Solo permitir solicitudes POST.
    if (event.httpMethod !== 'POST') {
        return createResponse(405, { error: 'Method Not Allowed' });
    }

    // Verificar que la API Key esté configurada en Netlify.
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.error('FATAL: BREVO_API_KEY environment variable is not set in Netlify.');
        return createResponse(500, { error: 'Server configuration error: Missing API key.' });
    }

    try {
        const { email } = JSON.parse(event.body);
        if (!email) {
            return createResponse(400, { error: 'Email is required.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Configurar el cliente de Brevo
        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        let apiClient = apiInstance.apiClient;
        apiClient.authentications['api-key'].apiKey = apiKey;

        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 

        sendSmtpEmail.subject = "Your APad Verification Code";
        sendSmtpEmail.htmlContent = `
            <html><body>
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #333;">Your Verification Code</h2>
                    <p style="color: #555;">Use the code below to sign in to APad.</p>
                    <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; background: #f0f0f0; padding: 15px 20px; border-radius: 8px; display: inline-block;">
                        ${code}
                    </p>
                    <p style="font-size: 12px; color: #888;">This code will expire in 10 minutes.</p>
                </div>
            </body></html>`;
        
        // IMPORTANTE: Reemplaza 'tu-correo-verificado@gmail.com' con el correo que verificaste en Brevo.
        sendSmtpEmail.sender = { "name": "APad Security", "email": "tu-correo-verificado@gmail.com" }; 
        sendSmtpEmail.to = [ { "email": email } ];

        // Enviar el correo
        await apiInstance.sendTransacEmail(sendSmtpEmail);

        return createResponse(200, { code });

    } catch (error) {
        console.error('Error in send-code function:', error.message);
        return createResponse(500, { error: 'Failed to send verification code.' });
    }
}
