const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
    try {
        let token = req.cookies.token || req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ 
                message: "Access denied. Please login to continue." 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if token is expired
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return res.status(401).json({ 
                    message: "Token has expired. Please login again." 
                });
            }

            req.user = decoded;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: "Session expired. Please login again." 
                });
            }
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: "Invalid token. Please login again." 
                });
            }
            throw err;
        }
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ 
            message: "Authentication error. Please try again." 
        });
    }
};

module.exports = authMiddleware;
