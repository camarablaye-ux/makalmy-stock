import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import ProductList from './components/ProductList';
import FinanceDashboard from './components/FinanceDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EmployeeChargeForm from './components/EmployeeChargeForm';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import BulkEditProducts from './components/BulkEditProducts';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    const { user } = useAuth();

    const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="container">
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        borderRadius: '8px',
                        background: 'var(--surface-color)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--surface-border)',
                        boxShadow: 'var(--shadow-lg)'
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <ProductList theme={theme} toggleTheme={toggleTheme} />
                    </ProtectedRoute>
                } />
                <Route path="/finances" element={
                    <ProtectedRoute>
                        {user?.role === 'proprietaire'
                            ? <FinanceDashboard theme={theme} toggleTheme={toggleTheme} />
                            : <EmployeeChargeForm theme={theme} toggleTheme={toggleTheme} />
                        }
                    </ProtectedRoute>
                } />
                <Route path="/saisie" element={
                    <ProtectedRoute>
                        <EmployeeChargeForm theme={theme} toggleTheme={toggleTheme} />
                    </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                    <ProtectedRoute>
                        {user?.role === 'proprietaire' ? (
                            <AnalyticsDashboard theme={theme} toggleTheme={toggleTheme} />
                        ) : (
                            <Navigate to="/" replace />
                        )}
                    </ProtectedRoute>
                } />
                <Route path="/inventaire" element={
                    <ProtectedRoute>
                        {user?.role === 'proprietaire' ? (
                            <BulkEditProducts theme={theme} toggleTheme={toggleTheme} />
                        ) : (
                            <Navigate to="/" replace />
                        )}
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Settings theme={theme} toggleTheme={toggleTheme} />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {user && <BottomNav theme={theme} toggleTheme={toggleTheme} />}
        </div>
    );
}

export default App;