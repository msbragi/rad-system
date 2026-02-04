import { SetMetadata } from '@nestjs/common';

export const ADMIN_KEY = 'admin_required';
export const SUPER_USER_KEY = 'super_user_required';

/**
 * Requires admin role (admin or super_user) to access the endpoint
 */
export const AdminRequired = () => SetMetadata(ADMIN_KEY, true);

/**
 * Requires super_user role specifically to access the endpoint
 */
export const SuperUserRequired = () => SetMetadata(SUPER_USER_KEY, true);
