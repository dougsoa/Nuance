import { auth } from '../lib/firebase';

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('Cannot send welcome email: No user authenticated');
      return;
    }

    const idToken = await user.getIdToken();

    const response = await fetch('/api/welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
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
