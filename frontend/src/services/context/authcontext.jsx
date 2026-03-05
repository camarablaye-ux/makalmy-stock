import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({ username: decoded.username, role: decoded.role });
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
    }, []);

    const loginAction = (data) => {
        localStorage.setItem('token', data.token);
        const decoded = jwtDecode(data.token);
        setUser({ username: decoded.username, role: decoded.role });
    };

    const logOut = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, loginAction, logOut }}>
            {children}
        </Auth.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};