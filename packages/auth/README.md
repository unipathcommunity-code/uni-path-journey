# @unipath/auth
Unified authentication hook for all UniPath apps.

Usage:
import { useUnipathAuth } from '@unipath/auth'
const { user, signIn, signOut, hasRole } = useUnipathAuth()

# Check role in specific app:
hasRole('nova', 'admin')  // true/false
isAdmin('unitour')        // true if admin/moderator/super_admin in unitour
