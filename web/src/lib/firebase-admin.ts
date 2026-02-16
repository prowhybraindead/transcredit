import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

function getFirebaseAdmin() {
    if (getApps().length === 0) {
        // In production, use GOOGLE_APPLICATION_CREDENTIALS or service account env vars.
        // For development, you can set FIREBASE_SERVICE_ACCOUNT_KEY as a JSON string.
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccountKey) {
            const serviceAccount = JSON.parse(serviceAccountKey);
            app = initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id,
            });
        } else {
            // Fallback: use default credentials (e.g., in Cloud environments)
            app = initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || 'transcredit-demo',
            });
        }
    } else {
        app = getApps()[0];
    }

    if (!db) {
        db = getFirestore(app);
    }

    return { app, db };
}

export { getFirebaseAdmin };
