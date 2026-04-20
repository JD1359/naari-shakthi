/**
 * middleware/roleMiddleware.js
 * Role-Based Access Control (RBAC) middleware.
 * Use AFTER authMiddleware — requires req.user to be set.
 *
 * Usage:
 *   router.get("/admin-only", authMiddleware, requireRole("admin"), handler)
 *   router.get("/staff",      authMiddleware, requireRole("pharmacist", "admin"), handler)
 */

module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};
