# Development Mode - Authentication Disabled

## Overview
Authentication has been temporarily disabled to facilitate easier development and testing of the ERP system features.

## What's Changed
- **Auth Context**: Bypassed all authentication logic with a default admin user
- **Protected Routes**: All route protection has been commented out
- **Role Protection**: Role-based access control is disabled
- **Login Page**: Still accessible but login functionality is bypassed

## Default User
- **Email**: admin@nucleusone.com
- **Name**: Admin User
- **Role**: Administrator
- **Access**: Full access to all modules

## How to Re-enable Authentication
When you're ready to re-enable authentication:

1. **Auth Context** (`src/contexts/auth-context.tsx`):
   - Uncomment the original authentication logic
   - Remove the hardcoded default user

2. **Protected Route** (`src/components/auth/protected-route.tsx`):
   - Uncomment the authentication checks
   - Remove the direct return of children

3. **Role Protected Route** (`src/components/auth/role-protected-route.tsx`):
   - Uncomment the role-based access control logic

4. **Main Page** (`src/app/page.tsx`):
   - Uncomment the ProtectedRoute wrapper
   - Restore the original user-dependent UI

5. **Remove Development Notice**:
   - Remove the DevNotice component from the main page
   - Delete `src/components/dev-notice.tsx`

## Benefits of Development Mode
- ✅ No login required to test features
- ✅ All modules accessible immediately
- ✅ Faster development iteration
- ✅ Easy to see project growth
- ✅ No authentication-related errors during development

## Security Note
⚠️ **Important**: This development mode should NOT be used in production. Always re-enable authentication before deploying to production environments.
