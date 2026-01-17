import type { AppUser, Role, Permission } from '@types';

export type { AppUser, Role, Permission };

export interface UserFormData extends Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'> {
    // Campos auxiliares si fueran necesarios
}
