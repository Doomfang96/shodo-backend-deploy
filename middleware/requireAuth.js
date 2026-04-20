const requireAuth = (req, res, next) => {
  if (!req.session.learner) {
    return res.status(401).json({
      message: "Authentication required",
      data: null,
    });
  }

  next();
};

export default requireAuth;
