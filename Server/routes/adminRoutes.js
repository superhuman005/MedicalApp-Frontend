router.get("/users", auth, role("admin"), getAllUsers);
router.delete("/users/:id", auth, role("admin"), deleteUser);
router.get("/stats", auth, role("admin"), dashboardStats);