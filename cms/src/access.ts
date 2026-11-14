import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'staff' | 'storefront'

type U = { role?: Role | null; _strategy?: string } | null | undefined
const hasRole = (user: U, ...roles: Role[]) => !!user?.role && roles.includes(user.role)
/**
 * A request signed with an API key is a program (the management system, the shop), not a person at the panel.
 * It never gets what its user's role allows a person: only the few operations listed under «integration».
 */
export const viaKey = (user: unknown) => (user as U)?._strategy === 'api-key'
const person = (user: U, ...roles: Role[]) => hasRole(user, ...roles) && !viaKey(user)

/** People who run the shop from the panel (signed in with their password). */
export const isTeam: Access = ({ req }) => person(req.user as U, 'admin', 'staff')
export const isAdmin: Access = ({ req }) => person(req.user as U, 'admin')
/** The storefront API user (API key) plus the team. */
export const isTeamOrStore: Access = ({ req }) => hasRole(req.user as U, 'admin', 'staff', 'storefront')
/**
 * The team, or an integration: the API key of a team user (the management system's «Gestión (API)»).
 * Used only where an integration needs it: reading orders and updating products (stock and prices).
 */
export const isTeamOrIntegration: Access = ({ req }) => hasRole(req.user as U, 'admin', 'staff')

export const teamField: FieldAccess = ({ req }) => person(req.user as U, 'admin', 'staff')
export const adminField: FieldAccess = ({ req }) => person(req.user as U, 'admin')

/** The panel is for people only; the storefront user authenticates by API key. */
export const canUsePanel = ({ req }: { req: { user?: unknown } }) => person(req.user as U, 'admin', 'staff')
