// Importa el cliente de Resend. Netlify lo instalará automáticamente.
import { Resend } from 'resend';

// La función principal que Netlify ejecutará.
export async function handler(event) {
    // Solo permitir solicitudes POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Obtener el correo electrónico del cuerpo de la solicitud
        const { email } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, body: 'Email is required' };
        }

        // Inicializar Resend con la API key guardada en Netlify
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Generar un código de 6 dígitos seguro
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Enviar el correo electrónico
        await resend.emails.send({
            from: 'APad Authentication <onboarding@resend.dev>', // Reemplaza con tu dominio verificado en producción
            to: email,
            subject: 'Your APad Verification Code',
            html: `
                <div style="font-family: sans-serif; text-align: center;">
                    <h2>Your Verification Code</h2>
                    <p>Use the code below to sign in to APad.</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 15px; border-radius: 8px;">
                        ${code}
                    </p>
                    <p style="font-size: 12px; color: #888;">This code will expire in 10 minutes.</p>
                </div>
            `,
        });

        // Devolver el código al frontend para que pueda ser verificado
        return {
            statusCode: 200,
            body: JSON.stringify({ code: code }), // Enviamos el código para que el frontend lo guarde temporalmente
        };

    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send verification code.' }),
        };
    }
}
