// Importa el cliente de Brevo. Netlify lo instalará gracias al package.json.
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

        // MODIFICACIÓN CRÍTICA: Corregir la inicialización del cliente de Brevo
        // Se obtiene una instancia Singleton del cliente y se configura la autenticación.
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKeyAuth = defaultClient.authentications['api-key'];
        apiKeyAuth.apiKey = apiKey;

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        
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
        sendSmtpEmail.sender = { "name": "APad Security", "email": "apadnoteapp@gmail.com" }; 
        sendSmtpEmail.to = [ { "email": email } ];

        // Enviar el correo
        console.log('Attempting to send email via Brevo...');
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully.');

        return createResponse(200, { code });

    } catch (error) {
        // Registrar el error de forma más detallada.
        console.error('Error in send-code function. Error message:', error.message);
        if (error.response) {
            console.error('Brevo API response error body:', JSON.stringify(error.response.body, null, 2));
        } else {
            console.error('Full error object (for inspection):', error);
        }
        return createResponse(500, { error: 'Failed to send verification code. Check function logs for details.' });
    }
}
