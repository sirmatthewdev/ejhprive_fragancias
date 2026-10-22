import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'staff' | 'storefront'

type U = { role?: Role | null } | null | undefined
const hasRole = (user: U, ...roles: Role[]) => !!user?.role && roles.includes(user.role)

/** People who run the shop from the panel. */
export const isTeam: Access = ({ req }) => hasRole(req.user as U, 'admin', 'staff')
export const isAdmin: Access = ({ req }) => hasRole(req.user as U, 'admin')
/** The storefront API user (API key) plus the team. */
export const isTeamOrStore: Access = ({ req }) => hasRole(req.user as U, 'admin', 'staff', 'storefront')

export const teamField: FieldAccess = ({ req }) => hasRole(req.user as U, 'admin', 'staff')
export const adminField: FieldAccess = ({ req }) => hasRole(req.user as U, 'admin')

/** The panel is for people only; the storefront user authenticates by API key. */
export const canUsePanel = ({ req }: { req: { user?: unknown } }) => hasRole(req.user as U, 'admin', 'staff')
