/**
 * AuthService - Firebase Authentication + Firestore User Management
 *
 * Handles:
 * - User registration (sign-up for business owners)
 * - User login/logout
 * - Invitation-based registration
 * - User profile management
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

import { getAuthInstance, getFirestoreInstance, isFirebaseConfigured } from '../../config/firebase.config';
import { getAllSystemRoles } from '@shared/config/systemRoles';
import { logger } from './LoggerService';
import type { AppUser, Invitation, RoleId, Restaurant, Company } from '@types';

// ============================================================================
// TYPES
// ============================================================================

export interface SignUpData {
    nombre: string;
    email: string;
    password: string;
    tipoNegocio: 'restaurante' | 'grupo';
    nombreNegocio: string;
}

export interface SignUpResult {
    success: boolean;
    user?: AppUser;
    error?: string;
}

export interface LoginResult {
    success: boolean;
    user?: AppUser;
    error?: string;
}

export interface InvitationSignUpData {
    token: string;
    nombre: string;
    password: string;
    telefono?: string;
}

// ============================================================================
// SEED ROLES
// ============================================================================

/**
 * Seed the 6 system roles to Firestore if they don't exist
 */
export async function seedSystemRoles(): Promise<void> {
    const db = getFirestoreInstance();
    const rolesRef = collection(db, 'roles');

    // Check if roles already exist
    const snapshot = await getDocs(rolesRef);
    if (!snapshot.empty) {
        return;
    }

    logger.info('Seeding system roles...');

    const roles = getAllSystemRoles();
    const now = Timestamp.now();

    for (const role of roles) {
        await setDoc(doc(db, 'roles', role.id as string), {
            ...role,
            createdAt: now,
            updatedAt: now,
        });
    }

    logger.info('System roles seeded successfully');
}

// ============================================================================
// SIGN UP (Business Owner)
// ============================================================================

/**
 * Register a new business owner
 * - Creates Firebase Auth user
 * - Creates company/restaurant in Firestore
 * - Creates user profile with director_operaciones role
 */
export async function signUpBusinessOwner(data: SignUpData): Promise<SignUpResult> {
    const auth = getAuthInstance();
    const db = getFirestoreInstance();

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName: data.nombre });

        const tsNow = Timestamp.now();
        let companyId: string | undefined;
        let restaurantId: string;

        if (data.tipoNegocio === 'grupo') {
            const companyRef = doc(collection(db, 'companies'));
            companyId = companyRef.id;

            const companyData: Omit<Company, 'id'> = {
                nombre: data.nombreNegocio,
                cif: '',
                direccion: '',
                restaurantes: [],
                createdAt: tsNow,
                updatedAt: tsNow,
            };
            await setDoc(companyRef, companyData);

            const restaurantRef = doc(collection(db, 'restaurants'));
            restaurantId = restaurantRef.id;

            const restaurantData: Omit<Restaurant, 'id'> = {
                companyId: companyId,
                nombre: `${data.nombreNegocio} - Principal`,
                direccion: '',
                codigo: generateRestaurantCode(),
                activo: true,
                configuracion: {
                    zonaHoraria: 'Europe/Madrid',
                    moneda: 'EUR',
                    ivaRestaurante: 10,
                    ivaTakeaway: 10,
                },
                trabajadores: [firebaseUser.uid],
                createdAt: tsNow,
                updatedAt: tsNow,
            };
            await setDoc(restaurantRef, restaurantData);

            await updateDoc(doc(db, 'companies', companyId), {
                restaurantes: [restaurantId],
            });
        } else {
            const restaurantRef = doc(collection(db, 'restaurants'));
            restaurantId = restaurantRef.id;

            const restaurantData: Omit<Restaurant, 'id'> = {
                companyId: '',
                nombre: data.nombreNegocio,
                direccion: '',
                codigo: generateRestaurantCode(),
                activo: true,
                configuracion: {
                    zonaHoraria: 'Europe/Madrid',
                    moneda: 'EUR',
                    ivaRestaurante: 10,
                    ivaTakeaway: 10,
                },
                trabajadores: [firebaseUser.uid],
                createdAt: tsNow,
                updatedAt: tsNow,
            };
            await setDoc(restaurantRef, restaurantData);
        }

        const userProfile: Omit<AppUser, 'id'> = {
            uid: firebaseUser.uid,
            nombre: data.nombre,
            email: data.email,
            rolId: 'director_operaciones',
            restaurantIds: [restaurantId],
            companyId: companyId,
            activo: true,
            fechaCreacion: tsNow,
            ultimoAcceso: tsNow,
        };

        await setDoc(doc(db, 'usuarios', firebaseUser.uid), userProfile);

        await seedSystemRoles();

        return {
            success: true,
            user: { id: firebaseUser.uid, ...userProfile } as AppUser,
        };
    } catch (error: unknown) {
        logger.error('Sign up error', error);

        const firebaseError = error as { code?: string };
        let errorMessage = 'Error al crear la cuenta';
        if (firebaseError.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email ya está registrado';
        } else if (firebaseError.code === 'auth/weak-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        } else if (firebaseError.code === 'auth/invalid-email') {
            errorMessage = 'El email no es válido';
        }

        return { success: false, error: errorMessage };
    }
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Login existing user
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
    const auth = getAuthInstance();
    const db = getFirestoreInstance();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        let userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));

        if (!userDoc.exists()) {
            // SECURITY: Do NOT auto-create profiles. Users must be invited or registered
            // through the proper signup flow. An auth credential without a Firestore
            // profile means the user was not onboarded correctly.
            logger.warn('Login attempt without Firestore profile — access denied', { uid: firebaseUser.uid, email });
            await signOut(auth);
            return { success: false, error: 'Tu cuenta no tiene un perfil configurado. Contacta con tu administrador.' };
        }

        const userData = userDoc.data() as Omit<AppUser, 'id'>;

        if (!userData.activo) {
            await signOut(auth);
            return { success: false, error: 'Tu cuenta ha sido desactivada' };
        }

        await updateDoc(doc(db, 'usuarios', firebaseUser.uid), {
            ultimoAcceso: Timestamp.now(),
        });

        return {
            success: true,
            user: { id: firebaseUser.uid, ...userData } as AppUser,
        };
    } catch (error: unknown) {
        logger.error('Login error', error);

        const firebaseError = error as { code?: string };
        let errorMessage = 'Error al iniciar sesión';
        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
            errorMessage = 'Email o contraseña incorrectos';
        } else if (firebaseError.code === 'auth/invalid-email') {
            errorMessage = 'El email no es válido';
        } else if (firebaseError.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos. Espera unos minutos';
        } else if (firebaseError.code === 'auth/invalid-credential') {
            errorMessage = 'Email o contraseña incorrectos';
        }

        return { success: false, error: errorMessage };
    }
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
    const auth = getAuthInstance();
    await signOut(auth);
}

// ============================================================================
// INVITATION SYSTEM
// ============================================================================

/**
 * Create an invitation for a new user
 */
export async function createInvitation(
    creatorUid: string,
    email: string,
    rolId: RoleId,
    restaurantIds: string[],
    companyId?: string,
    datosPrecompletados?: { nombre?: string; telefono?: string }
): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
    const db = getFirestoreInstance();

    try {
        const token = generateInvitationToken();

        const now = new Date();
        const expiraEn = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const invitationRef = doc(collection(db, 'invitations'));
        const invitation: Omit<Invitation, 'id'> = {
            token,
            email,
            rolId,
            restaurantIds,
            companyId,
            datosPrecompletados,
            creadoPor: creatorUid,
            creadoEn: Timestamp.now(),
            expiraEn: expiraEn.toISOString(),
            usado: false,
        };

        await setDoc(invitationRef, invitation);

        return {
            success: true,
            invitation: { id: invitationRef.id, ...invitation } as Invitation,
        };
    } catch (error: unknown) {
        logger.error('Create invitation error', error);
        return { success: false, error: 'Error al crear la invitación' };
    }
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
    token: string
): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
    const db = getFirestoreInstance();

    try {
        const q = query(
            collection(db, 'invitations'),
            where('token', '==', token),
            where('usado', '==', false)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: 'Invitación no válida o ya utilizada' };
        }

        const invDoc = snapshot.docs[0];
        const invitation = { id: invDoc.id, ...invDoc.data() } as Invitation;

        // Check expiration
        if (new Date(invitation.expiraEn) < new Date()) {
            return { success: false, error: 'La invitación ha expirado' };
        }

        return { success: true, invitation };
    } catch (error: unknown) {
        logger.error('Get invitation error', error);
        return { success: false, error: 'Error al verificar la invitación' };
    }
}

/**
 * Register user via invitation
 */
export async function signUpWithInvitation(data: InvitationSignUpData): Promise<SignUpResult> {
    const auth = getAuthInstance();
    const db = getFirestoreInstance();

    try {
        // 1. Validate invitation
        const invResult = await getInvitationByToken(data.token);
        if (!invResult.success || !invResult.invitation) {
            return { success: false, error: invResult.error || 'Invitación no válida' };
        }

        const invitation = invResult.invitation;

        // 2. Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            invitation.email,
            data.password
        );
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: data.nombre });

        // 3. Create user profile with assigned role (NOT CHOSEN BY USER)
        const tsNow = Timestamp.now();
        const userProfile: Omit<AppUser, 'id'> = {
            uid: firebaseUser.uid,
            nombre: data.nombre,
            email: invitation.email,
            telefono: data.telefono || invitation.datosPrecompletados?.telefono,
            rolId: invitation.rolId, // ASSIGNED BY ADMIN - user cannot change
            restaurantIds: invitation.restaurantIds, // ASSIGNED BY ADMIN
            companyId: invitation.companyId,
            activo: true,
            fechaCreacion: tsNow,
            ultimoAcceso: tsNow,
            invitadoPor: invitation.creadoPor,
        };

        await setDoc(doc(db, 'usuarios', firebaseUser.uid), userProfile);

        // 4. Mark invitation as used
        await updateDoc(doc(db, 'invitations', invitation.id as string), {
            usado: true,
            usadoEn: tsNow,
            usadoPor: firebaseUser.uid,
        });

        // 5. Add user to restaurant workers list
        for (const restaurantId of invitation.restaurantIds) {
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            const restaurantDoc = await getDoc(restaurantRef);
            if (restaurantDoc.exists()) {
                const trabajadores = restaurantDoc.data().trabajadores || [];
                if (!trabajadores.includes(firebaseUser.uid)) {
                    await updateDoc(restaurantRef, {
                        trabajadores: [...trabajadores, firebaseUser.uid],
                    });
                }
            }
        }

        return {
            success: true,
            user: { id: firebaseUser.uid, ...userProfile } as AppUser,
        };
    } catch (error: unknown) {
        logger.error('Invitation sign up error', error);

        const firebaseError = error as { code?: string };
        let errorMessage = 'Error al crear la cuenta';
        if (firebaseError.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email ya está registrado';
        } else if (firebaseError.code === 'auth/weak-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        }

        return { success: false, error: errorMessage };
    }
}

// ============================================================================
// CURRENT USER
// ============================================================================

/**
 * Get current user profile from Firestore
 */
export async function getCurrentUserProfile(): Promise<AppUser | null> {
    const auth = getAuthInstance();
    const db = getFirestoreInstance();

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
    if (!userDoc.exists()) return null;

    return { id: firebaseUser.uid, ...userDoc.data() } as AppUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
    callback: (user: AppUser | null) => void
): () => void {
    const auth = getAuthInstance();
    const db = getFirestoreInstance();

    return onAuthStateChanged(
        auth,
        async (firebaseUser: FirebaseUser | null) => {
            try {
                if (!firebaseUser) {
                    callback(null);
                    return;
                }

                // Get full user profile
                const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
                if (!userDoc.exists()) {
                    callback(null);
                    return;
                }

                const userData = { id: firebaseUser.uid, ...userDoc.data() } as AppUser;
                callback(userData);
            } catch (error: unknown) {
                logger.error('Error in onAuthStateChange callback', error);
                callback(null);
            }
        },
        (error: Error) => {
            logger.error('Firebase auth state error', error);
            callback(null);
        }
    );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a random restaurant code
 */
function generateRestaurantCode(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(4));
    const hex = Array.from(randomBytes).map(b => b.toString(36)).join('').substring(0, 4).toUpperCase();
    return `REST-${Date.now().toString(36).toUpperCase()}-${hex}`;
}

/**
 * Generate a secure invitation token
 */
function generateInvitationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charLen = chars.length; // 62
    const maxValid = 256 - (256 % charLen); // 248 — rejection threshold eliminates modulo bias
    let token = '';
    while (token.length < 32) {
        const randomValues = crypto.getRandomValues(new Uint8Array(32));
        for (let i = 0; i < randomValues.length && token.length < 32; i++) {
            if (randomValues[i] < maxValid) {
                token += chars.charAt(randomValues[i] % charLen);
            }
        }
    }
    return token;
}

/**
 * Create test director user (for development)
 */
export async function createTestDirector(): Promise<SignUpResult> {
    return signUpBusinessOwner({
        nombre: 'Director Test',
        email: 'director@pltest.com',
        password: 'Director123!',
        tipoNegocio: 'restaurante',
        nombreNegocio: 'Restaurante Test',
    });
}

/**
 * Diagnostic function to check Firebase connection
 */
export async function checkFirebaseConnection(): Promise<{
    configured: boolean;
    authConnected: boolean;
    firestoreConnected: boolean;
    error?: string;
}> {
    const configured = isFirebaseConfigured();

    if (!configured) {
        return {
            configured: false,
            authConnected: false,
            firestoreConnected: false,
            error: 'Firebase no está configurado. Revisa las variables de entorno.',
        };
    }

    let authConnected = false;
    let firestoreConnected = false;

    try {
        const auth = getAuthInstance();
        authConnected = !!auth;
    } catch (error: unknown) {
        logger.error('Auth connection error', error);
    }

    try {
        const db = getFirestoreInstance();
        const testQuery = await getDocs(query(collection(db, 'roles')));
        firestoreConnected = true;
        logger.debug('Firestore connected, roles count:', testQuery.size);
    } catch (error: unknown) {
        logger.error('Firestore connection error', error);
    }

    return {
        configured,
        authConnected,
        firestoreConnected,
    };
}
