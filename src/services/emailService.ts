export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const response = await fetch('/api/welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send welcome email:', error);
    } else {
      console.log('Welcome email request sent successfully');
    }
  } catch (err) {
    console.error('Error triggering welcome email:', err);
  }
}
